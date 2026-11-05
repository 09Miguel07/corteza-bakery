import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { PurchaseOrderDetail as Order } from '../../../entities';
import PurchaseOrderDetail from './purchase-order-detail';

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 7,
  code: 'OC-1007',
  status: 'Pending',
  supplierId: 3,
  supplierName: 'Harinera San Antonio',
  supplierTaxId: '900123456',
  supplierPhone: '3001112233',
  supplierAvailableBudget: 1_000_000,
  expectedDeliveryDate: '2026-11-05',
  total: 1_250_000,
  notes: null,
  quotationCode: null,
  requestedAt: '2026-11-02T15:00:00Z',
  createdBy: 'Diego Rojas',
  approvedAt: null,
  approvedBy: null,
  receivedAt: null,
  cancelledAt: null,
  cancelReason: null,
  items: [
    {
      supplyId: 1,
      supplyName: 'Harina de trigo',
      unitLabel: 'bultos',
      unitSizeKg: 50,
      quantity: 25,
      unitPrice: 50_000,
      lineTotal: 1_250_000,
    },
  ],
  ...overrides,
});

/** Deja correr microtareas y efectos sin esperar a que terminen las peticiones pendientes (whenStable sí las espera). */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

describe('PurchaseOrderDetail (05.3)', () => {
  let fixture: ComponentFixture<PurchaseOrderDetail>;
  let http: HttpTestingController;
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const button = (label: string) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) =>
      b.textContent?.includes(label),
    );

  async function open(o: Order): Promise<void> {
    fixture.componentRef.setInput('id', String(o.id));
    await settle();
    http.expectOne(`/api/purchase-orders/${o.id}`).flush(o);
    await settle();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(true);
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PurchaseOrderDetail);
  });

  afterEach(() => http.verify());

  it('warns before approving when the order exceeds the supplier budget', async () => {
    await open(order());

    expect(text()).toContain('Supera el presupuesto del proveedor');
    expect(button('Aprobar orden')).toBeDefined();
    expect(button('Registrar recepción')).toBeUndefined();
  });

  it('shows the domain message when the API rejects the approval', async () => {
    await open(order());

    button('Aprobar orden')!.click();
    await settle();
    http.expectOne('/api/purchase-orders/7/approve').flush(
      {
        detail:
          'Presupuesto insuficiente: la orden vale $1.250.000 y el proveedor tiene $1.000.000 disponibles.',
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await settle();

    expect(text()).toContain('Presupuesto insuficiente');
    expect(text()).toContain('Pendiente');
  });

  it('updates the status after a successful approval', async () => {
    await open(order({ supplierAvailableBudget: 10_000_000 }));

    button('Aprobar orden')!.click();
    await settle();
    http
      .expectOne('/api/purchase-orders/7/approve')
      .flush(order({ status: 'Approved', supplierAvailableBudget: 8_750_000 }));
    await settle();

    expect(text()).toContain('Aprobada');
    expect(button('Aprobar orden')).toBeUndefined();
    expect(button('Registrar recepción')).toBeDefined();
  });

  it('asks for a reason before cancelling', async () => {
    await open(order());

    button('Cancelar orden')!.click();
    await settle();
    button('Confirmar cancelación')!.click();
    await settle();

    expect(text()).toContain('Indica el motivo de la cancelación.');
    http.expectNone('/api/purchase-orders/7/cancel');
  });
});
