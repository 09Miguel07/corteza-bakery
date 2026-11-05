import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TABLE_STATE } from '../../../core/utils/sales';
import { OrderService } from '../../../services/order.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { SalesTabs } from '../sales-tabs/sales-tabs';

/** Pantalla 02.4 · Mesas: libre, ocupada o por cobrar. Una mesa libre abre un pedido nuevo. */
@Component({
  selector: 'app-tables-board',
  imports: [RouterLink, DatePipe, PageHeader, StatusBadge, CopPipe, SalesTabs],
  template: `
    <app-page-header
      eyebrow="Módulo 02 · Facturación y Ventas"
      title="Mesas"
      subtitle="Toca una mesa libre para tomar el pedido"
    >
      <button type="button" class="btn btn--ghost" (click)="tables.reload()">
        <span class="material-symbols-outlined">refresh</span> Actualizar
      </button>
    </app-page-header>
    <app-sales-tabs />

    <section class="stats" aria-label="Resumen de mesas">
      @for (s of counts(); track s.state) {
        <div class="stat">
          <span class="eyebrow">{{ label[s.state].label }}</span>
          <div class="stat__value">{{ s.count }}</div>
        </div>
      }
    </section>

    <section class="tables-grid">
      @for (t of tables.value(); track t.id) {
        <a
          class="table-card"
          [class]="'table-card table-card--' + t.state"
          [routerLink]="t.orderId ? ['/sales', t.orderId] : ['/sales/new']"
          [queryParams]="t.orderId ? {} : { tableId: t.id }"
        >
          <span class="table-card__number">{{ t.number }}</span>
          <app-status-badge [label]="label[t.state].label" [tone]="label[t.state].tone" />
          <span class="subtle">{{ t.capacity }} puestos</span>
          @if (t.orderId) {
            <strong>{{ t.orderTotal | cop }}</strong>
            <span class="subtle"
              >{{ t.orderCode }} · desde {{ t.openedAt | date: 'shortTime' }}</span
            >
          }
        </a>
      } @empty {
        <p class="subtle">
          {{ tables.isLoading() ? 'Cargando mesas…' : 'No hay mesas registradas.' }}
        </p>
      }
    </section>
  `,
  styles: `
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 1rem;
    }
    .table-card {
      display: grid;
      gap: 0.35rem;
      justify-items: start;
      padding: 1.1rem;
      text-decoration: none;
      color: inherit;
      background: var(--color-surface);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      &:hover {
        box-shadow: var(--shadow-sm);
      }
      &--Free {
        border-color: var(--color-success-bg);
      }
      &--Occupied {
        border-color: var(--color-warning-bg);
      }
      &--AwaitingPayment {
        border-color: var(--color-danger);
      }
    }
    .table-card__number {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
    }
  `,
})
export default class TablesBoard {
  private readonly orders = inject(OrderService);
  protected readonly label = TABLE_STATE;
  protected readonly tables = rxResource({ stream: () => this.orders.tables() });
  protected readonly counts = computed(() =>
    (['Free', 'Occupied', 'AwaitingPayment'] as const).map((state) => ({
      state,
      count: (this.tables.value() ?? []).filter((t) => t.state === state).length,
    })),
  );
}
