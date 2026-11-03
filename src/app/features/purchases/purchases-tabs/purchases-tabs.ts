import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Pestañas del módulo 05: órdenes de compra y solicitudes de cotización. */
@Component({
  selector: 'app-purchases-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="segmented" aria-label="Compras" style="margin-bottom: 1.25rem">
      <a
        routerLink="/purchases"
        routerLinkActive="is-active"
        [routerLinkActiveOptions]="{ exact: true }"
        >Órdenes de compra</a
      >
      <a routerLink="/purchases/quotations" routerLinkActive="is-active"
        >Solicitudes de cotización</a
      >
    </nav>
  `,
})
export class PurchasesTabs {}
