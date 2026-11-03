import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { RFQ_STATUS } from '../../../core/utils/purchasing';
import { RfqQuery, RfqStatus } from '../../../entities';
import { QuotationRequestService } from '../../../services/quotation-request.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { PurchasesTabs } from '../purchases-tabs/purchases-tabs';

/** Solicitudes de cotización: se piden precios a varios proveedores y se elige el mejor. */
@Component({
  selector: 'app-quotation-requests-list',
  imports: [RouterLink, PageHeader, Pagination, StatusBadge, CopPipe, PurchasesTabs],
  templateUrl: './quotation-requests-list.html',
})
export default class QuotationRequestsList {
  private readonly requests = inject(QuotationRequestService);

  protected readonly status = RFQ_STATUS;
  protected readonly statuses = Object.keys(RFQ_STATUS) as RfqStatus[];

  private readonly query = signal<RfqQuery>({ page: 1, pageSize: 8 });
  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.requests.list(params),
  });
  protected readonly rows = computed(() => this.result.value()?.items ?? []);

  protected filter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as RfqStatus | '';
    this.query.set({ page: 1, pageSize: 8, status: value || null });
  }

  protected goTo(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }
}
