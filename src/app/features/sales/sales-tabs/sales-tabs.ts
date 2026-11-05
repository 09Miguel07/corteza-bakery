import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Pestañas del módulo 02: pedidos, mesas y facturas de venta. */
@Component({
  selector: 'app-sales-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="segmented" aria-label="Ventas" style="margin-bottom: 1.25rem">
      <a
        routerLink="/sales"
        routerLinkActive="is-active"
        [routerLinkActiveOptions]="{ exact: true }"
        >Pedidos</a
      >
      <a routerLink="/sales/tables" routerLinkActive="is-active">Mesas</a>
      <a routerLink="/sales/invoices" routerLinkActive="is-active">Facturas</a>
    </nav>
  `,
})
export class SalesTabs {}
