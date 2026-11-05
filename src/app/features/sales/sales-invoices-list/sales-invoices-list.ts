import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PAYMENT_METHOD } from '../../../core/utils/sales';
import { PaymentMethod, SalesInvoiceQuery, SalesInvoiceStatus } from '../../../entities';
import { SalesInvoiceService } from '../../../services/sales-invoice.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { SalesTabs } from '../sales-tabs/sales-tabs';

/** Pantalla 02.6 · Facturas de venta. */
@Component({
  selector: 'app-sales-invoices-list',
  imports: [RouterLink, DatePipe, PageHeader, Pagination, StatusBadge, CopPipe, SalesTabs],
  template: `
    <app-page-header
      eyebrow="Módulo 02 · Facturación y Ventas"
      title="Facturas de venta"
      subtitle="Lo que se cobró y cómo se pagó"
    />
    <app-sales-tabs />

    <section class="card card--flush">
      <div class="filters">
        <div class="field">
          <label for="f-number">Número</label>
          <input
            id="f-number"
            class="input"
            placeholder="Ej. FV-0231"
            (change)="patch({ number: $any($event.target).value })"
          />
        </div>
        <div class="field field--narrow">
          <label for="f-from">Desde</label>
          <input
            id="f-from"
            class="input"
            type="date"
            (change)="patch({ from: $any($event.target).value || null })"
          />
        </div>
        <div class="field field--narrow">
          <label for="f-to">Hasta</label>
          <input
            id="f-to"
            class="input"
            type="date"
            (change)="patch({ to: $any($event.target).value || null })"
          />
        </div>
        <div class="field field--narrow">
          <label for="f-method">Medio de pago</label>
          <select
            id="f-method"
            class="select"
            (change)="patch({ paymentMethod: $any($event.target).value || null })"
          >
            <option value="">Todos</option>
            @for (m of methods; track m) {
              <option [value]="m">{{ method[m].label }}</option>
            }
          </select>
        </div>
        <div class="field field--narrow">
          <label for="f-status">Estado</label>
          <select
            id="f-status"
            class="select"
            (change)="patch({ status: $any($event.target).value || null })"
          >
            <option value="">Todas</option>
            <option value="Paid">Pagadas</option>
            <option value="Voided">Anuladas</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Pago</th>
              <th class="num">Total</th>
              <th>Estado</th>
              <th class="actions"></th>
            </tr>
          </thead>
          <tbody>
            @for (i of rows(); track i.id) {
              <tr [class.is-inactive]="i.status === 'Voided'">
                <td>
                  <strong>{{ i.number }}</strong>
                </td>
                <td>{{ i.orderCode }}</td>
                <td>{{ i.customerName ?? 'Ocasional' }}</td>
                <td>{{ i.issuedAt | date: 'short' }}</td>
                <td>{{ method[i.paymentMethod].label }}</td>
                <td class="num">{{ i.total | cop }}</td>
                <td>
                  <app-status-badge
                    [label]="i.status === 'Paid' ? 'Pagada' : 'Anulada'"
                    [tone]="i.status === 'Paid' ? 'success' : 'danger'"
                  />
                </td>
                <td class="actions"><a class="btn btn--link" [routerLink]="[i.id]">Ver</a></td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="table-state">
                  {{
                    result.isLoading() ? 'Cargando facturas…' : 'No hay facturas con esos filtros.'
                  }}
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
          (pageChange)="patch({ page: $event })"
        />
      }
    </section>
  `,
})
export default class SalesInvoicesList {
  private readonly invoices = inject(SalesInvoiceService);
  protected readonly method = PAYMENT_METHOD;
  protected readonly methods = Object.keys(PAYMENT_METHOD) as PaymentMethod[];

  private readonly query = signal<SalesInvoiceQuery>({ page: 1, pageSize: 10 });
  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params }) => this.invoices.list(params),
  });
  protected readonly rows = computed(() => this.result.value()?.items ?? []);

  protected patch(
    change: Partial<SalesInvoiceQuery> & { status?: SalesInvoiceStatus | null },
  ): void {
    this.query.update((q) => ({ ...q, page: 1, ...change }));
  }
}
