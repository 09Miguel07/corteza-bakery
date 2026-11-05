import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import { NEXT_ACTION, nextStatus, ORDER_STATUS, SERVICE_TYPE } from '../../../core/utils/sales';
import { OrderListItem, OrderQuery, OrderStatus } from '../../../entities';
import { OrderService } from '../../../services/order.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { SalesTabs } from '../sales-tabs/sales-tabs';

/** Pantalla 02.1 · Pedidos del día: lo que hay en cocina y lo que falta por cobrar. */
@Component({
  selector: 'app-orders-list',
  imports: [RouterLink, DatePipe, PageHeader, Pagination, StatusBadge, CopPipe, SalesTabs],
  templateUrl: './orders-list.html',
})
export default class OrdersList {
  private readonly orders = inject(OrderService);
  private readonly toast = inject(ToastService);

  protected readonly status = ORDER_STATUS;
  protected readonly serviceType = SERVICE_TYPE;
  protected readonly nextAction = NEXT_ACTION;
  protected readonly statuses = Object.keys(ORDER_STATUS) as OrderStatus[];

  protected readonly summary = rxResource({ stream: () => this.orders.summary() });
  protected readonly query = signal<OrderQuery>({ page: 1, pageSize: 10, open: true });
  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.orders.list(params),
  });
  protected readonly rows = computed(() => this.result.value()?.items ?? []);
  protected readonly busyId = signal<number | null>(null);

  protected setOpen(open: boolean | null): void {
    this.query.update((q) => ({ ...q, page: 1, open }));
  }

  protected setStatus(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as OrderStatus | '';
    this.query.update((q) => ({ ...q, page: 1, status: value || null }));
  }

  protected goTo(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }

  protected async advance(order: OrderListItem): Promise<void> {
    const next = nextStatus(order.status);
    if (!next) return;
    this.busyId.set(order.id);
    try {
      await firstValueFrom(this.orders.advance(order.id, next));
      this.toast.success(`${order.code}: ${ORDER_STATUS[next].label.toLowerCase()}.`);
      this.result.reload();
      this.summary.reload();
    } catch (error) {
      this.toast.error(problemMessage(error));
    } finally {
      this.busyId.set(null);
    }
  }
}
