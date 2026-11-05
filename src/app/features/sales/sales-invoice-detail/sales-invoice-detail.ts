import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import { PAYMENT_METHOD, SERVICE_TYPE } from '../../../core/utils/sales';
import { SalesInvoiceService } from '../../../services/sales-invoice.service';
import { CopPipe, DocumentPipe } from '../../../shared/pipes/format.pipes';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Factura de venta: comprobante imprimible y anulación con motivo. */
@Component({
  selector: 'app-sales-invoice-detail',
  imports: [RouterLink, DatePipe, StatusBadge, CopPipe, DocumentPipe],
  template: `
    <a routerLink="/sales/invoices" class="back-link no-print"
      ><span class="material-symbols-outlined">arrow_back</span> Volver a facturas</a
    >

    @if (invoice.value(); as i) {
      <div class="layout-2col">
        <article class="card receipt">
          <p class="eyebrow">Panadería La Espiga · Factura de venta</p>
          <h1>
            {{ i.number }}
            <app-status-badge
              [label]="i.status === 'Paid' ? 'Pagada' : 'Anulada'"
              [tone]="i.status === 'Paid' ? 'success' : 'danger'"
            />
          </h1>
          <dl class="facts" style="margin: 1rem 0">
            <dt>Fecha</dt>
            <dd>{{ i.issuedAt | date: 'medium' }}</dd>
            <dt>Pedido</dt>
            <dd>
              <a [routerLink]="['/sales', i.orderId]">{{ i.orderCode }}</a> ·
              {{ i.tableNumber ? 'Mesa ' + i.tableNumber : service[i.serviceType] }}
            </dd>
            <dt>Cliente</dt>
            <dd>
              {{ i.customerName ?? 'Cliente ocasional' }}
              @if (i.customerDocument) {
                · {{ i.customerDocument | document }}
              }
            </dd>
            <dt>Atendió</dt>
            <dd>{{ i.issuedBy }}</dd>
          </dl>
          <table class="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="num">Cant.</th>
                <th class="num">Precio</th>
                <th class="num">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              @for (l of i.items; track l.productId) {
                <tr>
                  <td>{{ l.productName }}</td>
                  <td class="num">{{ l.quantity }}</td>
                  <td class="num">{{ l.unitPrice | cop }}</td>
                  <td class="num">{{ l.lineTotal | cop }}</td>
                </tr>
              }
            </tbody>
          </table>
          <div class="totals">
            <span class="muted">Total</span><strong>{{ i.total | cop }}</strong>
          </div>
          <dl class="facts" style="margin-top: 0.75rem">
            <dt>Pago</dt>
            <dd>{{ method[i.paymentMethod].label }}</dd>
            @if (i.amountReceived != null) {
              <dt>Recibido</dt>
              <dd>{{ i.amountReceived | cop }}</dd>
              <dt>Cambio</dt>
              <dd>{{ i.changeGiven | cop }}</dd>
            }
            @if (i.voidReason) {
              <dt>Anulada</dt>
              <dd>{{ i.voidReason }} · {{ i.voidedAt | date: 'short' }}</dd>
            }
          </dl>
        </article>

        <aside class="card no-print">
          <button type="button" class="btn btn--ghost btn--block" (click)="print()">
            <span class="material-symbols-outlined">print</span> Imprimir
          </button>
          @if (i.status === 'Paid') {
            <label class="field" for="reason" style="margin-top: 1.25rem">
              <span>Motivo para anular</span>
              <textarea
                id="reason"
                class="textarea"
                [value]="reason()"
                (input)="reason.set($any($event.target).value)"
              ></textarea>
            </label>
            @if (error(); as message) {
              <p class="field-error" role="alert">{{ message }}</p>
            }
            <button
              type="button"
              class="btn btn--danger btn--block"
              style="margin-top: 0.75rem"
              [disabled]="busy()"
              (click)="voidInvoice(i.id)"
            >
              Anular factura
            </button>
          }
        </aside>
      </div>
    } @else if (invoice.error()) {
      <div class="alert alert--danger">
        <span class="material-symbols-outlined">error</span> No se encontró la factura.
      </div>
    } @else {
      <section class="card"><div class="skeleton"></div></section>
    }
  `,
  styles: `
    @media print {
      .no-print {
        display: none !important;
      }
      .receipt {
        border: 0;
        box-shadow: none;
      }
    }
  `,
})
export default class SalesInvoiceDetail {
  private readonly invoices = inject(SalesInvoiceService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  protected readonly invoice = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.invoices.get(params),
  });
  protected readonly method = PAYMENT_METHOD;
  protected readonly service = SERVICE_TYPE;
  protected readonly reason = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected print(): void {
    window.print();
  }

  protected async voidInvoice(id: number): Promise<void> {
    if (!this.reason().trim()) {
      this.error.set('Indica el motivo de la anulación.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      this.invoice.set(await firstValueFrom(this.invoices.void(id, this.reason().trim())));
      this.toast.success('Factura anulada.');
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
