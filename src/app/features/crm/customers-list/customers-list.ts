import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import { CustomerListItem, CustomerQuery } from '../../../entities';
import { CustomerService } from '../../../services/customer.service';
import { DocumentPipe, InitialsPipe, PhonePipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge';

type StatusFilter = 'all' | 'active' | 'inactive';

/** Pantallas 01.1 (lista) y 01.4 (desactivar) · CRM. */
@Component({
  selector: 'app-customers-list',
  imports: [RouterLink, FormField, PageHeader, Pagination, StatusBadge, DocumentPipe, PhonePipe, InitialsPipe],
  templateUrl: './customers-list.html',
})
export default class CustomersList {
  private readonly customers = inject(CustomerService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  /** Lo que el usuario escribe; se aplica al pulsar Buscar. */
  protected readonly filterModel = signal({ document: '', name: '', status: 'all' as StatusFilter });
  protected readonly filterForm = form(this.filterModel);

  /** Filtros aplicados: cada cambio vuelve a pedir la lista. */
  private readonly query = signal<CustomerQuery>({ page: 1, pageSize: 8 });

  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.customers.list(params),
  });

  protected readonly rows = computed(() => this.result.value()?.items ?? []);
  protected readonly busyId = signal<number | null>(null);

  protected search(event?: Event): void {
    event?.preventDefault();
    const { document, name, status } = this.filterModel();
    this.query.set({
      page: 1,
      pageSize: 8,
      document: document.trim(),
      name: name.trim(),
      active: status === 'all' ? null : status === 'active',
    });
  }

  protected clear(): void {
    this.filterModel.set({ document: '', name: '', status: 'all' });
    this.search();
  }

  protected goTo(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }

  protected async toggleActive(customer: CustomerListItem): Promise<void> {
    const name = `${customer.firstNames} ${customer.lastNames}`;
    if (customer.isActive) {
      const accepted = await this.confirm.ask({
        title: `¿Desactivar a ${name}?`,
        message: 'Ya no aparecerá al crear pedidos. Puedes activarla cuando quieras.',
        detail: `Cédula: ${customer.documentNumber}`,
        confirmText: 'Sí, desactivar',
      });
      if (!accepted) return;
    }

    this.busyId.set(customer.id);
    try {
      await firstValueFrom(this.customers.setActive(customer.id, !customer.isActive));
      this.toast.success(customer.isActive ? `${name} quedó inactivo.` : `${name} está activo de nuevo.`);
      this.result.reload();
    } catch (error) {
      this.toast.error(problemMessage(error));
    } finally {
      this.busyId.set(null);
    }
  }
}
