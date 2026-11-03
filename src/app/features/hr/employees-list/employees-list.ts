import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import { EmployeeListItem, EmployeeQuery, SHIFT_LABEL, WorkShift } from '../../../entities';
import { EmployeeService } from '../../../services/employee.service';
import { DocumentPipe, InitialsPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Pantalla 06.1 · Empleados. */
@Component({
  selector: 'app-employees-list',
  imports: [RouterLink, FormField, PageHeader, Pagination, StatusBadge, DocumentPipe, InitialsPipe],
  templateUrl: './employees-list.html',
})
export default class EmployeesList {
  private readonly employees = inject(EmployeeService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly summary = rxResource({ stream: () => this.employees.summary() });
  protected readonly positions = rxResource({ stream: () => this.employees.positions() });

  protected readonly filterModel = signal({ search: '', position: '', shift: '', status: 'all' });
  protected readonly filterForm = form(this.filterModel);

  private readonly query = signal<EmployeeQuery>({ page: 1, pageSize: 8 });
  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.employees.list(params),
  });
  protected readonly rows = computed(() => this.result.value()?.items ?? []);
  protected readonly busyId = signal<number | null>(null);
  protected readonly shiftLabel = SHIFT_LABEL;

  protected search(event?: Event): void {
    event?.preventDefault();
    const { search, position, shift, status } = this.filterModel();
    this.query.set({
      page: 1,
      pageSize: 8,
      search: search.trim(),
      position: position || null,
      shift: (shift || null) as WorkShift | null,
      active: status === 'all' ? null : status === 'active',
    });
  }

  protected clear(): void {
    this.filterModel.set({ search: '', position: '', shift: '', status: 'all' });
    this.search();
  }

  protected goTo(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }

  protected async toggleActive(e: EmployeeListItem): Promise<void> {
    const name = `${e.firstNames} ${e.lastNames}`;
    if (e.isActive) {
      const accepted = await this.confirm.ask({
        title: `¿Desactivar a ${name}?`,
        message: e.hasUser
          ? 'Queda fuera de los turnos y su usuario pierde el acceso a Corteza de inmediato.'
          : 'Queda fuera de los turnos y de la próxima nómina. Su historial se conserva.',
        detail: `Cédula: ${e.documentNumber} · ${e.position}`,
        confirmText: 'Sí, desactivar',
      });
      if (!accepted) return;
    }

    this.busyId.set(e.id);
    try {
      await firstValueFrom(this.employees.setActive(e.id, !e.isActive));
      this.toast.success(e.isActive ? `${name} quedó desactivado.` : `${name} está activo de nuevo.`);
      this.result.reload();
      this.summary.reload();
    } catch (error) {
      this.toast.error(problemMessage(error));
    } finally {
      this.busyId.set(null);
    }
  }
}
