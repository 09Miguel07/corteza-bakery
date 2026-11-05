import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import {
  canCancel,
  changeFor,
  NEXT_ACTION,
  nextStatus,
  ORDER_STATUS,
  PAYMENT_METHOD,
  quickCash,
  SERVICE_TYPE,
} from '../../../core/utils/sales';
import { OrderDetail as Order, PaymentMethod } from '../../../entities';
import { OrderService } from '../../../services/order.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Pantallas 02.3 (detalle del pedido) y 02.5 (cuenta y cobro). */
@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DatePipe, StatusBadge, CopPipe],
  templateUrl: './order-detail.html',
})
export default class OrderDetail {
  private readonly orders = inject(OrderService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly order = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.orders.get(params),
  });

  protected readonly status = ORDER_STATUS;
  protected readonly serviceType = SERVICE_TYPE;
  protected readonly nextAction = NEXT_ACTION;
  protected readonly methods = Object.entries(PAYMENT_METHOD) as [
    PaymentMethod,
    { label: string; icon: string },
  ][];

  protected readonly method = signal<PaymentMethod>('Cash');
  protected readonly received = signal<number | null>(null);
  protected readonly change = computed(() =>
    changeFor(this.order.value()?.total ?? 0, this.received()),
  );
  protected readonly suggestions = computed(() => quickCash(this.order.value()?.total ?? 0));
  protected readonly canCancel = computed(() => {
    const o = this.order.value();
    return !!o && canCancel({ status: o.status, isClosed: !!o.closedAt });
  });

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected setReceived(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.received.set(raw === '' ? null : Number(raw));
  }

  protected advance(o: Order): Promise<void> {
    const next = nextStatus(o.status)!;
    return this.run(
      this.orders.advance(o.id, next),
      `Pedido ${ORDER_STATUS[next].label.toLowerCase()}.`,
    );
  }

  protected requestBill(o: Order): Promise<void> {
    return this.run(this.orders.requestBill(o.id), `La mesa ${o.tableNumber} quedó por cobrar.`);
  }

  protected async cancel(o: Order): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Cancelar el pedido ${o.code}?`,
      message: 'Se cierra sin cobrar y la mesa queda libre.',
      confirmText: 'Sí, cancelar',
    });
    if (ok) await this.run(this.orders.advance(o.id, 'Cancelled'), 'Pedido cancelado.');
  }

  protected async checkout(o: Order): Promise<void> {
    const cash = this.method() === 'Cash';
    if (cash && this.change() === null) {
      this.error.set(`Efectivo insuficiente: el pedido vale ${new CopPipe().transform(o.total)}.`);
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      const invoice = await firstValueFrom(
        this.orders.checkout(o.id, {
          paymentMethod: this.method(),
          amountReceived: cash ? this.received() : null,
        }),
      );
      this.toast.success(
        cash && invoice.changeGiven
          ? `Factura ${invoice.number}. Cambio: ${new CopPipe().transform(invoice.changeGiven)}.`
          : `Factura ${invoice.number} emitida.`,
      );
      await this.router.navigate(['/sales/invoices', invoice.id]);
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  private async run(request: Observable<Order>, success: string): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      this.order.set(await firstValueFrom(request));
      this.toast.success(success);
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
