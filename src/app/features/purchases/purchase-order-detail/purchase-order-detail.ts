import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';
import { localToday } from '../../../core/utils/dates';
import { problemMessage } from '../../../core/utils/errors';
import { budgetCheck, orderActions, PURCHASE_ORDER_STATUS } from '../../../core/utils/purchasing';
import { PurchaseOrderDetail as Order } from '../../../entities';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { CopPipe, QtyPipe } from '../../../shared/pipes/format.pipes';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Pantalla 05.3 · Detalle de la orden: aprobar (descuenta presupuesto), cancelar o recibir (entra a bodega). */
@Component({
  selector: 'app-purchase-order-detail',
  imports: [RouterLink, StatusBadge, CopPipe, QtyPipe],
  templateUrl: './purchase-order-detail.html',
})
export default class PurchaseOrderDetail {
  private readonly orders = inject(PurchaseOrderService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  protected readonly order = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.orders.get(params),
  });

  protected readonly status = PURCHASE_ORDER_STATUS;
  protected readonly actions = computed(() => {
    const o = this.order.value();
    return o ? orderActions(o.status) : { approve: false, cancel: false, receive: false };
  });
  protected readonly budget = computed(() => {
    const o = this.order.value();
    return o ? budgetCheck(o.supplierAvailableBudget, o.total) : null;
  });

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly cancelling = signal(false);
  protected readonly reason = signal('');
  protected readonly receivedDate = signal(localToday());

  protected async approve(o: Order): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Aprobar la orden ${o.code}?`,
      message: `Se descuentan ${new CopPipe().transform(o.total)} del presupuesto de ${o.supplierName}.`,
      confirmText: 'Sí, aprobar',
      tone: 'primary',
    });
    if (ok)
      await this.run(
        this.orders.approve(o.id),
        'Orden aprobada. Ya se le puede avisar al proveedor.',
      );
  }

  protected async cancel(o: Order): Promise<void> {
    const reason = this.reason().trim();
    if (!reason) {
      this.error.set('Indica el motivo de la cancelación.');
      return;
    }
    await this.run(this.orders.cancel(o.id, reason), 'Orden cancelada.');
    this.cancelling.set(false);
  }

  protected async receive(o: Order): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Llegó la mercancía de ${o.code}?`,
      message: 'Cada insumo de la orden se suma al stock de la bodega.',
      confirmText: 'Sí, recibir',
      tone: 'primary',
    });
    if (ok)
      await this.run(
        this.orders.receive(o.id, this.receivedDate()),
        'Mercancía recibida y sumada al inventario.',
      );
  }

  protected setReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  protected setReceivedDate(event: Event): void {
    this.receivedDate.set((event.target as HTMLInputElement).value);
  }

  private async run(request: Observable<Order>, success: string): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(request);
      this.order.set(updated);
      this.toast.success(success);
    } catch (error) {
      // 422 "Presupuesto insuficiente", "ya está aprobada"…: se muestra tal cual lo dice el dominio.
      this.error.set(problemMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
