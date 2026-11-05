import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { PurchaseOrderService } from './purchase-order.service';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PurchaseOrderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists orders sending only the filters that have a value', () => {
    service.list({ page: 1, pageSize: 8, status: 'Pending', code: '' }).subscribe();

    const req = http.expectOne((r) => r.url === '/api/purchase-orders');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('Pending');
    expect(req.request.params.has('code')).toBe(false);
    req.flush({ items: [], total: 0, page: 1, pageSize: 8, totalPages: 0 });
  });

  it('reads the counters of screen 05.1', async () => {
    const summary = firstValueFrom(service.summary());

    http
      .expectOne('/api/purchase-orders/summary')
      .flush({ pending: 2, approved: 1, arrivingToday: 1, arrivingThisWeek: 3 });

    expect((await summary).arrivingThisWeek).toBe(3);
  });

  it('creates an order with its lines', () => {
    const request = {
      supplierId: 3,
      expectedDeliveryDate: '2026-11-05',
      notes: null,
      items: [{ supplyId: 1, quantity: 25, unitPrice: 50_000 }],
    };
    service.create(request).subscribe();

    const req = http.expectOne('/api/purchase-orders');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({});
  });

  it('approves, cancels with a reason and receives', () => {
    service.approve(7).subscribe();
    service.cancel(7, 'Proveedor sin stock').subscribe();
    service.receive(7, '2026-11-04').subscribe();

    const approve = http.expectOne('/api/purchase-orders/7/approve');
    expect(approve.request.method).toBe('POST');
    approve.flush({});

    const cancel = http.expectOne('/api/purchase-orders/7/cancel');
    expect(cancel.request.body).toEqual({ reason: 'Proveedor sin stock' });
    cancel.flush({});

    const receive = http.expectOne('/api/purchase-orders/7/receive');
    expect(receive.request.body).toEqual({ receivedDate: '2026-11-04' });
    receive.flush({});
  });

  it('propagates the 422 of a rule so the screen can show it', async () => {
    const result = firstValueFrom(service.approve(7));

    http
      .expectOne('/api/purchase-orders/7/approve')
      .flush(
        { detail: 'Presupuesto insuficiente' },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

    await expect(result).rejects.toMatchObject({ status: 422 });
  });
});
