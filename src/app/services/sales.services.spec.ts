import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { OrderService } from './order.service';
import { SalesInvoiceService } from './sales-invoice.service';

describe('Sales services', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists open orders', () => {
    TestBed.inject(OrderService).list({ page: 1, pageSize: 10, open: true, status: null }).subscribe();

    const req = http.expectOne((r) => r.url === '/api/orders');
    expect(req.request.params.get('open')).toBe('true');
    expect(req.request.params.has('status')).toBe(false);
    req.flush({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
  });

  it('creates, advances, asks for the bill and checks out an order', async () => {
    const orders = TestBed.inject(OrderService);
    const create = { serviceType: 'DineIn' as const, diningTableId: 4, customerId: null, items: [{ productId: 1, quantity: 4 }] };
    orders.create(create).subscribe();
    orders.advance(9, 'Preparing').subscribe();
    orders.requestBill(9).subscribe();
    const invoice = firstValueFrom(orders.checkout(9, { paymentMethod: 'Cash', amountReceived: 20_000 }));

    expect(http.expectOne('/api/orders').request.body).toEqual(create);
    const advance = http.expectOne('/api/orders/9/status');
    expect(advance.request.method).toBe('PATCH');
    expect(advance.request.body).toEqual({ status: 'Preparing' });
    expect(http.expectOne('/api/orders/9/request-bill').request.method).toBe('POST');
    http.expectOne('/api/orders/9/checkout').flush({ id: 3, changeGiven: 6_400 });

    expect((await invoice).changeGiven).toBe(6_400);
  });

  it('reads the table board', () => {
    TestBed.inject(OrderService).tables().subscribe();
    expect(http.expectOne('/api/dining-tables/status').request.method).toBe('GET');
  });

  it('voids an invoice with a reason', () => {
    TestBed.inject(SalesInvoiceService).void(3, 'Error de cobro').subscribe();

    const req = http.expectOne('/api/sales-invoices/3/void');
    expect(req.request.body).toEqual({ reason: 'Error de cobro' });
  });
});
