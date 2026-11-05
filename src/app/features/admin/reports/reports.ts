import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PAYMENT_METHOD } from '../../../core/utils/sales';
import { ReportRange, STOCK_STATUS_LABEL } from '../../../entities';
import { ReportService } from '../../../services/report.service';
import { CopPipe, QtyPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Pantalla 07.1 · ¿Cómo va la panadería? */
@Component({
  selector: 'app-reports',
  imports: [RouterLink, DatePipe, PageHeader, StatusBadge, CopPipe, QtyPipe],
  template: `
    <app-page-header
      eyebrow="Administrador"
      title="¿Cómo va la panadería?"
      subtitle="Ventas, productos, bodega, compras y nómina en un solo lugar"
    >
      <div class="segmented" role="group" aria-label="Periodo">
        @for (r of ranges; track r.value) {
          <button
            type="button"
            [class.is-selected]="range() === r.value"
            (click)="range.set(r.value)"
          >
            {{ r.label }}
          </button>
        }
      </div>
    </app-page-header>

    @if (report.error()) {
      <div class="alert alert--danger">
        <span class="material-symbols-outlined">error</span> No se pudo cargar el reporte.
        <button type="button" class="btn btn--link" (click)="report.reload()">Reintentar</button>
      </div>
    }

    @if (report.value(); as r) {
      <section class="stats">
        <div class="stat">
          <span class="eyebrow">Ventas</span>
          <div class="stat__value">{{ r.salesTotal | cop }}</div>
          <span class="subtle">{{ r.from | date: 'd MMM' }} – {{ r.to | date: 'd MMM' }}</span>
        </div>
        <div class="stat">
          <span class="eyebrow">Facturas</span>
          <div class="stat__value">{{ r.invoicesCount }}</div>
          <span class="subtle">Ticket promedio {{ r.averageTicket | cop }}</span>
        </div>
        <div class="stat">
          <span class="eyebrow">Pedidos entregados</span>
          <div class="stat__value">{{ r.ordersDelivered }}</div>
          <span class="subtle">{{ r.ordersCancelled }} cancelados</span>
        </div>
        <div class="stat" [class.stat--danger]="r.purchaseInvoicesOverdue > 0">
          <span class="eyebrow">Por pagar a proveedores</span>
          <div class="stat__value">{{ r.purchaseInvoicesPendingTotal | cop }}</div>
          <span class="subtle"
            >{{ r.purchaseInvoicesPending }} facturas ·
            {{ r.purchaseInvoicesOverdue }} vencidas</span
          >
        </div>
      </section>

      <div class="layout-2col">
        <section class="card">
          <div class="card__title">
            <span class="material-symbols-outlined">bar_chart</span>
            <h2>Ventas de los últimos 7 días</h2>
          </div>
          <div
            class="bars"
            role="img"
            [attr.aria-label]="'Ventas diarias, máximo ' + (max() | cop)"
          >
            @for (d of r.last7Days; track d.date) {
              <div class="bar">
                <span class="bar__value">{{ d.total ? (d.total | cop) : '' }}</span>
                <span
                  class="bar__fill"
                  [style.height.%]="max() ? (d.total / max()) * 100 : 0"
                ></span>
                <span class="bar__label">{{ d.date | date: 'EEE d' }}</span>
              </div>
            }
          </div>
        </section>

        <section class="card">
          <div class="card__title">
            <span class="material-symbols-outlined">payments</span>
            <h2>Cómo nos pagan</h2>
          </div>
          <dl class="facts" style="margin-top: 0.75rem">
            @for (m of r.byPaymentMethod; track m.method) {
              <dt>{{ method[m.method].label }} ({{ m.count }})</dt>
              <dd>{{ m.total | cop }}</dd>
            } @empty {
              <dt>Sin ventas en el periodo</dt>
              <dd>—</dd>
            }
          </dl>
          <div class="totals">
            <span class="muted">Personas activas</span><strong>{{ r.activeEmployees }}</strong>
          </div>
          @if (r.lastPayrollNet != null) {
            <p class="subtle" style="margin-top: 0.5rem">
              Última nómina aprobada: {{ r.lastPayrollNet | cop }}
            </p>
          }
        </section>
      </div>

      <div class="layout-2col" style="margin-top: 1.25rem">
        <section class="card card--flush">
          <div class="card__title" style="padding: 1rem 1.25rem 0">
            <span class="material-symbols-outlined">trophy</span>
            <h2>Lo más vendido</h2>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="num">Unidades</th>
                <th class="num">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              @for (p of r.topProducts; track p.productName) {
                <tr>
                  <td>{{ p.productName }}</td>
                  <td class="num">{{ p.quantity }}</td>
                  <td class="num">{{ p.revenue | cop }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="table-state">Sin ventas en el periodo.</td>
                </tr>
              }
            </tbody>
          </table>
        </section>

        <section class="card">
          <div class="card__title">
            <span class="material-symbols-outlined">warning</span>
            <h2>Insumos críticos</h2>
          </div>
          @for (s of r.criticalSupplies; track s.id) {
            <div class="low-row">
              <div>
                <strong>{{ s.name }}</strong>
                <p class="subtle">
                  {{ s.currentStock | qty }} {{ s.unitLabel }} · mínimo {{ s.minStock | qty }}
                </p>
              </div>
              <app-status-badge
                [label]="stock[s.status]"
                [tone]="s.status === 'Out' ? 'danger' : 'warning'"
              />
            </div>
          } @empty {
            <p class="subtle" style="margin-top: 0.5rem">
              Todo el inventario está por encima del mínimo.
            </p>
          }
          <a routerLink="/inventory" class="btn btn--link" style="margin-top: 0.75rem"
            >Ir a inventario</a
          >
        </section>
      </div>
    } @else if (report.isLoading()) {
      <section class="card"><div class="skeleton"></div></section>
    }
  `,
  styles: `
    .bars {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.5rem;
      align-items: end;
      height: 220px;
      margin-top: 1rem;
    }
    .bar {
      display: grid;
      grid-template-rows: auto 1fr auto;
      height: 100%;
      align-items: end;
      justify-items: center;
      gap: 0.3rem;
    }
    .bar__fill {
      width: 70%;
      min-height: 2px;
      border-radius: 6px 6px 0 0;
      background: var(--color-primary);
    }
    .bar__value {
      font-size: 0.7rem;
      color: var(--color-text-subtle);
      white-space: nowrap;
    }
    .bar__label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-transform: capitalize;
    }
  `,
})
export default class Reports {
  private readonly reports = inject(ReportService);
  protected readonly ranges: { value: ReportRange; label: string }[] = [
    { value: 'Today', label: 'Hoy' },
    { value: 'Week', label: '7 días' },
    { value: 'Month', label: 'Este mes' },
  ];
  protected readonly range = signal<ReportRange>('Week');
  protected readonly report = rxResource({
    params: () => this.range(),
    stream: ({ params }) => this.reports.overview(params),
  });
  protected readonly max = computed(() =>
    Math.max(0, ...(this.report.value()?.last7Days ?? []).map((d) => d.total)),
  );
  protected readonly method = PAYMENT_METHOD;
  protected readonly stock = STOCK_STATUS_LABEL;
}
