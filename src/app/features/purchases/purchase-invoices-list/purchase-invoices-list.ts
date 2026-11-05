import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';
import { localToday } from '../../../core/utils/dates';
import { problemMessage } from '../../../core/utils/errors';
import { dueLabel } from '../../../core/utils/purchasing';
import { PurchaseInvoice, PurchaseInvoiceQuery, PurchaseInvoiceView } from '../../../entities';
import { PurchaseInvoiceService } from '../../../services/purchase-invoice.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { PurchasesTabs } from '../purchases-tabs/purchases-tabs';

/** Pantalla 05.4 · Facturas de compra: por pagar, vencidas y pagadas. */
@Component({
  selector: 'app-purchase-invoices-list',
  imports: [RouterLink, PageHeader, Pagination, StatusBadge, CopPipe, PurchasesTabs],
  template: `
    <app-page-header
      eyebrow="Módulo 05 · Compras"
      title="Facturas de compra"
      subtitle="Lo que nos cobran los proveedores"
    >
      <a routerLink="new" class="btn btn--primary"
        ><span class="material-symbols-outlined">post_add</span> Registrar factura</a
      >
    </app-page-header>
    <app-purchases-tabs />

    <section class="stats" aria-label="Resumen">
      <div class="stat">
        <span class="eyebrow">Por pagar</span>
        <div class="stat__value">{{ summary.value()?.pendingTotal | cop }}</div>
        <span class="subtle">{{ summary.value()?.pendingCount ?? 0 }} facturas</span>
      </div>
      <div class="stat stat--danger">
        <span class="eyebrow">Vencidas</span>
        <div class="stat__value">{{ summary.value()?.overdueTotal | cop }}</div>
        <span class="subtle">{{ summary.value()?.overdueCount ?? 0 }} facturas</span>
      </div>
      <div class="stat stat--alert">
        <span class="eyebrow">Vencen esta semana</span>
        <div class="stat__value">{{ summary.value()?.dueThisWeekTotal | cop }}</div>
        <span class="subtle">Próximos 7 días</span>
      </div>
    </section>

    <section class="card card--flush">
      <div class="filters">
        <div class="segmented" role="group" aria-label="Ver">
          @for (v of views; track v.value) {
            <button
              type="button"
              [class.is-selected]="query().view === v.value"
              (click)="setView(v.value)"
            >
              {{ v.label }}
            </button>
          }
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Proveedor</th>
              <th>Orden</th>
              <th>Vence</th>
              <th class="num">Total</th>
              <th>Estado</th>
              <th class="actions">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (i of rows(); track i.id) {
              <tr>
                <td>
                  <strong>{{ i.supplierInvoiceNumber }}</strong>
                  <div class="subtle">{{ i.description ?? '—' }}</div>
                </td>
                <td>{{ i.supplierName }}</td>
                <td>
                  @if (i.purchaseOrderId) {
                    <a [routerLink]="['/purchases/orders', i.purchaseOrderId]">{{
                      i.purchaseOrderCode
                    }}</a>
                  } @else {
                    —
                  }
                </td>
                <td>{{ i.dueDate }}</td>
                <td class="num">{{ i.total | cop }}</td>
                <td><app-status-badge [label]="due(i).text" [tone]="due(i).tone" /></td>
                <td class="actions">
                  @if (i.status === 'Pending') {
                    <button
                      type="button"
                      class="btn btn--link"
                      [disabled]="busyId() === i.id"
                      (click)="pay(i)"
                    >
                      Marcar pagada
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="table-state">
                  {{ result.isLoading() ? 'Cargando facturas…' : 'No hay facturas en esta vista.' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (result.value(); as page) {
        <app-pagination
          [page]="page.page"
          [pages]="page.totalPages"
          [total]="page.total"
          [shown]="page.items.length"
          noun="facturas"
          (pageChange)="goTo($event)"
        />
      }
    </section>
  `,
})
export default class PurchaseInvoicesList {
  private readonly invoices = inject(PurchaseInvoiceService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly today = localToday();

  protected readonly views: { value: PurchaseInvoiceView | null; label: string }[] = [
    { value: 'Pending', label: 'Por pagar' },
    { value: 'Overdue', label: 'Vencidas' },
    { value: 'Paid', label: 'Pagadas' },
    { value: null, label: 'Todas' },
  ];

  protected readonly summary = rxResource({ stream: () => this.invoices.summary() });
  protected readonly query = signal<PurchaseInvoiceQuery>({
    page: 1,
    pageSize: 8,
    view: 'Pending',
  });
  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.invoices.list(params),
  });
  protected readonly rows = computed(() => this.result.value()?.items ?? []);
  protected readonly busyId = signal<number | null>(null);

  protected due(i: PurchaseInvoice) {
    return dueLabel(i, this.today);
  }

  protected setView(view: PurchaseInvoiceView | null): void {
    this.query.update((q) => ({ ...q, page: 1, view }));
  }

  protected goTo(page: number): void {
    this.query.update((q) => ({ ...q, page }));
  }

  protected async pay(i: PurchaseInvoice): Promise<void> {
    const ok = await this.confirm.ask({
      title: `¿Marcar pagada la factura ${i.supplierInvoiceNumber}?`,
      message: `${i.supplierName} · ${new CopPipe().transform(i.total)}`,
      confirmText: 'Sí, ya se pagó',
      tone: 'primary',
    });
    if (!ok) return;
    this.busyId.set(i.id);
    try {
      await firstValueFrom(this.invoices.pay(i.id));
      this.toast.success('Factura marcada como pagada.');
      this.result.reload();
      this.summary.reload();
    } catch (error) {
      this.toast.error(problemMessage(error));
    } finally {
      this.busyId.set(null);
    }
  }
}
