import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { STOCK_STATUS_LABEL, StockStatus, SupplyQuery } from '../../../entities';
import { SupplyCategoryService } from '../../../services/supply-category.service';
import { SupplyService } from '../../../services/supply.service';
import { QtyPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { BadgeTone, StatusBadge } from '../../../shared/ui/status-badge';

const TONE: Record<StockStatus, BadgeTone> = { Ok: 'success', Low: 'warning', Out: 'danger' };

/** Pantallas 03.0 (inicio) y 03.1 (insumos) · Inventarios. */
@Component({
  selector: 'app-supplies-list',
  imports: [RouterLink, FormField, PageHeader, Pagination, StatusBadge, QtyPipe],
  templateUrl: './supplies-list.html',
})
export default class SuppliesList {
  private readonly supplies = inject(SupplyService);
  private readonly categoryService = inject(SupplyCategoryService);

  protected readonly categories = rxResource({ stream: () => this.categoryService.list() });
  protected readonly lowStock = rxResource({ stream: () => this.supplies.lowStock() });

  protected readonly filterModel = signal({ search: '', categoryId: '', stock: '' });
  protected readonly filterForm = form(this.filterModel);

  private readonly query = signal<SupplyQuery>({ page: 1, pageSize: 8, active: true });
  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.supplies.list(params),
  });
  protected readonly rows = computed(() => this.result.value()?.items ?? []);

  protected readonly label = STOCK_STATUS_LABEL;
  protected readonly tone = TONE;

  protected search(event?: Event): void {
    event?.preventDefault();
    const { search, categoryId, stock } = this.filterModel();
    this.query.set({
      page: 1,
      pageSize: 8,
      active: true,
      search: search.trim(),
      categoryId: categoryId ? Number(categoryId) : null,
      stock: (stock || null) as StockStatus | null,
    });
  }

  protected showLowStock(): void {
    this.filterModel.update((m) => ({ ...m, stock: 'Low' }));
    this.search();
  }

  protected goTo(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }
}
