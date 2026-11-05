import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { OrderDetail as Order } from '../../../entities';
import OrderDetail from './order-detail';

const order: Order = {
  id: 9,
  code: 'P-0152',
  serviceType: 'DineIn',
  diningTableId: 4,
  tableNumber: 4,
  customerId: null,
  customerName: null,
  status: 'Delivered',
  total: 13_600,
  servedBy: 'sofia.diaz',
  createdAt: '2026-11-04T15:00:00Z',
  preparingAt: null,
  readyAt: null,
  deliveredAt: null,
  billRequestedAt: '2026-11-04T16:00:00Z',
  closedAt: null,
  invoiceId: null,
  invoiceNumber: null,
  items: [
    { productId: 1, productName: 'Pan francés', quantity: 4, unitPrice: 1_500, lineTotal: 6_000 },
  ],
};

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.tick();
}

describe('OrderDetail (02.3 / 02.5 cobro)', () => {
  let fixture: ComponentFixture<OrderDetail>;
  let http: HttpTestingController;
  const el = () => fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    [...el().querySelectorAll('button')].find((b) =>
      b.textContent?.replace(/\s/g, ' ').includes(label),
    )!;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OrderDetail);
    fixture.componentRef.setInput('id', '9');
    await settle();
    http.expectOne('/api/orders/9').flush(order);
    await settle();
  });

  afterEach(() => http.verify());

  it('shows the change while the cashier types the cash received', async () => {
    button('$ 20.000').click();
    await settle();

    expect(el().textContent?.replace(/\s/g, ' ')).toContain('$ 6.400');
  });

  it('does not call the API when the cash does not cover the total', async () => {
    const input = el().querySelector<HTMLInputElement>('#received')!;
    input.value = '10000';
    input.dispatchEvent(new Event('input'));
    await settle();
    button('Cobrar y emitir factura').click();
    await settle();

    expect(el().textContent).toContain('Efectivo insuficiente');
    http.expectNone('/api/orders/9/checkout');
  });

  it('checks out by card without sending cash and opens the invoice', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    button('Tarjeta').click();
    await settle();
    button('Cobrar y emitir factura').click();
    await settle();

    const req = http.expectOne('/api/orders/9/checkout');
    expect(req.request.body).toEqual({ paymentMethod: 'Card', amountReceived: null });
    req.flush({ id: 31, number: 'FV-0031', changeGiven: null });
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/sales/invoices', 31]);
  });
});
