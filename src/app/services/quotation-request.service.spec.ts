import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { QuotationRequestService } from './quotation-request.service';

describe('QuotationRequestService', () => {
  let service: QuotationRequestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(QuotationRequestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists requests by status', () => {
    service.list({ page: 1, pageSize: 8, status: 'Open' }).subscribe();

    const req = http.expectOne((r) => r.url === '/api/quotation-requests');
    expect(req.request.params.get('status')).toBe('Open');
    req.flush({ items: [], total: 0, page: 1, pageSize: 8, totalPages: 0 });
  });

  it('creates a request with deadline and supplies', () => {
    const request = {
      description: null,
      responseDeadline: '2026-11-05',
      items: [{ supplyId: 1, quantity: 25 }],
    };
    service.create(request).subscribe();

    const req = http.expectOne('/api/quotation-requests');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('registers a supplier quotation on the request', () => {
    const quotation = {
      supplierId: 3,
      deliveryDays: 2,
      notes: null,
      prices: [{ supplyId: 1, unitPrice: 50_000 }],
    };
    service.registerQuotation(4, quotation).subscribe();

    const req = http.expectOne('/api/quotation-requests/4/quotations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(quotation);
    req.flush({});
  });

  it('selects the winner and returns the purchase order created', async () => {
    const result = firstValueFrom(service.select(4, 9, null));

    const req = http.expectOne('/api/quotation-requests/4/quotations/9/select');
    expect(req.request.body).toEqual({ expectedDeliveryDate: null });
    req.flush({ purchaseOrderId: 12, purchaseOrderCode: 'OC-1012' });

    expect(await result).toEqual({ purchaseOrderId: 12, purchaseOrderCode: 'OC-1012' });
  });

  it('cancels a request', () => {
    service.cancel(4).subscribe();

    expect(http.expectOne('/api/quotation-requests/4/cancel').request.method).toBe('POST');
  });
});
