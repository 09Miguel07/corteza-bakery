import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import { SupplierListItem, SupplierQuery } from '../../../entities';
import { SupplierService } from '../../../services/supplier.service';
import { SupplyCategoryService } from '../../../services/supply-category.service';
import { CopPipe, DocumentPipe, InitialsPipe, PhonePipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Pantalla 04.1 · Lista de proveedores. */
@Component({
  selector: 'app-suppliers-list',
  imports: [RouterLink, FormField, PageHeader, Pagination, StatusBadge, DocumentPipe, PhonePipe, InitialsPipe, CopPipe],
  templateUrl: './suppliers-list.html',
})
export default class SuppliersList {
  private readonly suppliers = inject(SupplierService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  private readonly categoryService = inject(SupplyCategoryService);
  protected readonly categories = rxResource({ stream: () => this.categoryService.list() });

  protected readonly filterModel = signal({ taxId: '', name: '', categoryId: '', status: 'all' });
  protected readonly filterForm = form(this.filterModel);

  private readonly query = signal<SupplierQuery>({ page: 1, pageSize: 8 });
  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.suppliers.list(params),
  });
  protected readonly rows = computed(() => this.result.value()?.items ?? []);
  protected readonly busyId = signal<number | null>(null);

  protected search(event?: Event): void {
    event?.preventDefault();
    const { taxId, name, categoryId, status } = this.filterModel();
    this.query.set({
      page: 1,
      pageSize: 8,
      taxId: taxId.trim(),
      name: name.trim(),
      categoryId: categoryId ? Number(categoryId) : null,
      active: status === 'all' ? null : status === 'active',
    });
  }

  protected clear(): void {
    this.filterModel.set({ taxId: '', name: '', categoryId: '', status: 'all' });
    this.search();
  }

  protected goTo(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }

  protected categoryNames(s: SupplierListItem): string {
    return s.categories.map((c) => c.name).join(', ') || '—';
  }

  protected async toggleActive(s: SupplierListItem): Promise<void> {
    if (s.isActive) {
      const accepted = await this.confirm.ask({
        title: `¿Desactivar a ${s.name}?`,
        message: 'No aparecerá al crear órdenes de compra, pero conserva su historial.',
        detail: `NIT: ${s.taxId}`,
        confirmText: 'Sí, desactivar',
      });
      if (!accepted) return;
    }

    this.busyId.set(s.id);
    try {
      await firstValueFrom(this.suppliers.setActive(s.id, !s.isActive));
      this.toast.success(s.isActive ? 'Proveedor desactivado.' : 'Proveedor activado.');
      this.result.reload();
    } catch (error) {
      // Regla del Sprint 2: "No se puede desactivar: el proveedor tiene órdenes activas".
      this.toast.error(problemMessage(error));
    } finally {
      this.busyId.set(null);
    }
  }
}
