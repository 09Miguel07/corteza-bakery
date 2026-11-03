import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { PURCHASE_ORDER_STATUS } from '../../../core/utils/purchasing';
import { PurchaseOrderQuery, PurchaseOrderStatus } from '../../../entities';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { PurchasesTabs } from '../purchases-tabs/purchases-tabs';

/** Pantalla 05.1 · Pedidos a proveedores. */
@Component({
  selector: 'app-purchase-orders-list',
  imports: [RouterLink, FormField, PageHeader, Pagination, StatusBadge, CopPipe, PurchasesTabs],
  templateUrl: './purchase-orders-list.html',
})
export default class PurchaseOrdersList {
  private readonly orders = inject(PurchaseOrderService);

  protected readonly status = PURCHASE_ORDER_STATUS;
  protected readonly statuses = Object.keys(PURCHASE_ORDER_STATUS) as PurchaseOrderStatus[];

  protected readonly summary = rxResource({ stream: () => this.orders.summary() });

  protected readonly filterModel = signal({ code: '', status: '' });
  protected readonly filterForm = form(this.filterModel);

  private readonly query = signal<PurchaseOrderQuery>({ page: 1, pageSize: 8 });
  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.orders.list(params),
  });
  protected readonly rows = computed(() => this.result.value()?.items ?? []);

  protected search(event?: Event): void {
    event?.preventDefault();
    const { code, status } = this.filterModel();
    this.query.set({
      page: 1,
      pageSize: 8,
      code: code.trim(),
      status: (status || null) as PurchaseOrderStatus | null,
    });
  }

  protected clear(): void {
    this.filterModel.set({ code: '', status: '' });
    this.search();
  }

  protected goTo(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }
}
