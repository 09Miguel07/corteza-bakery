import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { localToday } from '../../../core/utils/dates';
import { serverErrors } from '../../../core/utils/errors';
import { INVALID_AMOUNT } from '../../../core/utils/purchasing';
import { PurchaseInvoiceService } from '../../../services/purchase-invoice.service';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { SupplierService } from '../../../services/supplier.service';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';

/** Registrar la factura que mandó un proveedor (05.4), opcionalmente ligada a su orden de compra. */
@Component({
  selector: 'app-purchase-invoice-form',
  imports: [RouterLink, FormField, FieldError, FormErrors],
  template: `
    <a routerLink="/purchases/invoices" class="back-link"
      ><span class="material-symbols-outlined">arrow_back</span> Volver a facturas</a
    >
    <header class="page-header">
      <div>
        <h1>Registrar factura de compra</h1>
        <p class="page-header__subtitle">Copia los datos de la factura que mandó el proveedor.</p>
      </div>
    </header>

    <form class="card" (submit)="save($event)" novalidate>
      <app-form-errors [form]="form" />
      <div class="form-grid">
        <div class="field">
          <label for="supplierId">Proveedor</label>
          <select id="supplierId" class="select" [formField]="form.supplierId">
            <option value="">Elige el proveedor…</option>
            @for (s of suppliers.value()?.items; track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
          <app-field-error [field]="form.supplierId" />
        </div>
        <div class="field">
          <label for="number">Número de la factura</label>
          <input
            id="number"
            class="input"
            [formField]="form.supplierInvoiceNumber"
            placeholder="Ej. FC-9921"
          />
          <app-field-error [field]="form.supplierInvoiceNumber" />
        </div>
        <div class="field">
          <label for="order">Orden de compra <span class="optional">(opcional)</span></label>
          <select id="order" class="select" [formField]="form.purchaseOrderId">
            <option value="">Sin orden</option>
            @for (o of supplierOrders(); track o.id) {
              <option [value]="o.id">{{ o.code }} · {{ o.itemsSummary }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="total">Total (COP)</label>
          <input id="total" class="input" type="number" step="100" [formField]="form.total" />
          <app-field-error [field]="form.total" />
        </div>
        <div class="field">
          <label for="issueDate">Fecha de emisión</label>
          <input id="issueDate" class="input" type="date" [formField]="form.issueDate" />
          <app-field-error [field]="form.issueDate" />
        </div>
        <div class="field">
          <label for="dueDate">Fecha de vencimiento</label>
          <input id="dueDate" class="input" type="date" [formField]="form.dueDate" />
          <app-field-error [field]="form.dueDate" />
        </div>
        <div class="field span-2">
          <label for="description">Descripción <span class="optional">(opcional)</span></label>
          <input
            id="description"
            class="input"
            [formField]="form.description"
            placeholder="Ej. Harina de noviembre"
          />
        </div>
      </div>
      <div class="form-actions">
        <a routerLink="/purchases/invoices" class="btn btn--ghost">Cancelar</a>
        <button type="submit" class="btn btn--primary" [disabled]="form().submitting()">
          <span class="material-symbols-outlined">save</span> Registrar
        </button>
      </div>
    </form>
  `,
})
export default class PurchaseInvoiceForm {
  private readonly invoices = inject(PurchaseInvoiceService);
  private readonly supplierApi = inject(SupplierService);
  private readonly orderApi = inject(PurchaseOrderService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly today = localToday();

  protected readonly suppliers = rxResource({
    stream: () => this.supplierApi.list({ pageSize: 100 }),
  });
  protected readonly model = signal({
    supplierId: '',
    supplierInvoiceNumber: '',
    purchaseOrderId: '',
    total: 0,
    issueDate: this.today,
    dueDate: this.today,
    description: '',
  });
  protected readonly orders = rxResource({
    params: () => this.model().supplierId || undefined,
    stream: ({ params }) => this.orderApi.list({ supplierId: Number(params), pageSize: 50 }),
  });
  protected readonly supplierOrders = computed(() =>
    (this.orders.value()?.items ?? []).filter((o) => o.status !== 'Cancelled'),
  );

  protected readonly form = form(this.model, (p) => {
    required(p.supplierId, { message: 'Elige el proveedor.' });
    required(p.supplierInvoiceNumber, {
      message: 'Escribe el número de la factura del proveedor.',
    });
    validate(p.total, ({ value }) =>
      !value() || value() <= 0 ? { kind: 'min', message: INVALID_AMOUNT } : undefined,
    );
    required(p.issueDate, { message: 'Escribe la fecha de emisión.' });
    validate(p.dueDate, ({ value }) =>
      value() < this.model().issueDate
        ? {
            kind: 'minDate',
            message: 'La fecha de vencimiento no puede ser anterior a la de emisión.',
          }
        : undefined,
    );
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, async () => {
      try {
        const m = this.model();
        const created = await firstValueFrom(
          this.invoices.create({
            supplierId: Number(m.supplierId),
            supplierInvoiceNumber: m.supplierInvoiceNumber.trim(),
            purchaseOrderId: m.purchaseOrderId ? Number(m.purchaseOrderId) : null,
            description: m.description.trim() || null,
            issueDate: m.issueDate,
            dueDate: m.dueDate,
            total: m.total,
          }),
        );
        this.toast.success(`Factura ${created.supplierInvoiceNumber} registrada.`);
        await this.router.navigate(['/purchases/invoices']);
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }
}
