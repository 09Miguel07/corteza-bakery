import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RfqDetail } from '../../../entities';
import QuotationRequestDetail from './quotation-request-detail';

const rfq: RfqDetail = {
  id: 4,
  code: 'SC-004',
  description: 'Harina de diciembre',
  status: 'Open',
  responseDeadline: '2026-11-05',
  createdAt: '2026-11-02T15:00:00Z',
  closedAt: null,
  createdBy: 'Diego Rojas',
  items: [{ supplyId: 1, supplyName: 'Harina de trigo', unitLabel: 'bulto', quantity: 25 }],
  quotations: [],
  lowestQuotationId: null,
  purchaseOrderId: null,
  purchaseOrderCode: null,
};

const suppliers = {
  items: [
    {
      id: 3,
      name: 'Molinos del Valle',
      taxId: '900123456',
      contactName: 'Ana',
      phone: '300',
      email: 'a@b.co',
      availableBudget: 10_000_000,
      isActive: true,
      categories: [],
    },
  ],
  total: 1,
  page: 1,
  pageSize: 100,
  totalPages: 1,
};

/** Deja correr microtareas y efectos sin esperar a que terminen las peticiones pendientes (whenStable sí las espera). */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

describe('QuotationRequestDetail', () => {
  let fixture: ComponentFixture<QuotationRequestDetail>;
  let http: HttpTestingController;
  const el = () => fixture.nativeElement as HTMLElement;

  function type(selector: string, value: string): void {
    const input = el().querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event(input instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(QuotationRequestDetail);
    fixture.componentRef.setInput('id', '4');
    await settle();
    http.expectOne((r) => r.url === '/api/suppliers').flush(suppliers);
    http.expectOne('/api/quotation-requests/4').flush(rfq);
    await settle();
  });

  afterEach(() => http.verify());

  it('computes the quoted total while typing the unit price', async () => {
    type('#q-price-1', '50000');
    await settle();

    expect(el().textContent?.replace(/\s/g, ' ')).toContain('$ 1.250.000');
  });

  it('blocks a zero price with "Monto inválido" without calling the API', async () => {
    type('#q-supplier', '3');
    type('#q-price-1', '0');
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();

    expect(el().textContent).toContain('Monto inválido: debe ser mayor que cero.');
    http.expectNone('/api/quotation-requests/4/quotations');
  });

  it('sends the quotation and shows it in the table', async () => {
    type('#q-supplier', '3');
    type('#q-price-1', '50000');
    el().querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle();

    const req = http.expectOne('/api/quotation-requests/4/quotations');
    expect(req.request.body).toEqual({
      supplierId: 3,
      deliveryDays: 2,
      notes: null,
      prices: [{ supplyId: 1, unitPrice: 50_000 }],
    });
    req.flush({
      ...rfq,
      quotations: [
        {
          id: 9,
          supplierId: 3,
          supplierName: 'Molinos del Valle',
          status: 'Received',
          deliveryDays: 2,
          total: 1_250_000,
          notes: null,
          receivedAt: '2026-11-02T15:00:00Z',
          items: [],
        },
      ],
      lowestQuotationId: 9,
    });
    await settle();

    expect(el().textContent).toContain('Mejor precio');
  });
});
