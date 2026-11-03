import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { localToday } from '../../../core/utils/dates';
import { serverErrors } from '../../../core/utils/errors';
import { budgetCheck, linesTotal } from '../../../core/utils/purchasing';
import { SupplierService } from '../../../services/supplier.service';
import { SupplyService } from '../../../services/supply.service';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';
import { EditableLine, emptyLine, LineEditor, linesProblem } from '../line-editor/line-editor';

/** Pantalla 05.2 · Nueva orden de compra. Queda pendiente hasta que el jefe de compras la apruebe. */
@Component({
  selector: 'app-purchase-order-form',
  imports: [RouterLink, FormField, FieldError, FormErrors, LineEditor, CopPipe],
  templateUrl: './purchase-order-form.html',
})
export default class PurchaseOrderForm {
  private readonly orders = inject(PurchaseOrderService);
  private readonly supplierApi = inject(SupplierService);
  private readonly supplyApi = inject(SupplyService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly suppliers = rxResource({
    stream: () => this.supplierApi.list({ active: true, pageSize: 100 }),
  });
  protected readonly supplies = rxResource({
    stream: () => this.supplyApi.list({ active: true, pageSize: 100 }),
  });
  protected readonly today = localToday();

  protected readonly model = signal({
    supplierId: '',
    expectedDeliveryDate: this.today,
    notes: '',
  });
  protected readonly form = form(this.model, (p) => {
    required(p.supplierId, { message: 'Elige el proveedor.' });
    required(p.expectedDeliveryDate, { message: 'Escribe cuándo debe llegar.' });
    validate(p.expectedDeliveryDate, ({ value }) =>
      value() < this.today
        ? { kind: 'minDate', message: 'La entrega no puede ser en el pasado.' }
        : undefined,
    );
  });

  protected readonly lines = signal<EditableLine[]>([emptyLine()]);
  protected readonly linesTouched = signal(false);
  protected readonly linesError = computed(() => linesProblem(this.lines(), true));
  protected readonly total = computed(() => linesTotal(this.lines()));

  protected readonly supplier = computed(() =>
    this.suppliers.value()?.items.find((s) => String(s.id) === this.model().supplierId),
  );
  /** Aviso temprano: la API vuelve a validar el presupuesto al aprobar. */
  protected readonly budget = computed(() => {
    const s = this.supplier();
    return s ? budgetCheck(s.availableBudget, this.total()) : null;
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.linesTouched.set(true);
    if (this.linesError()) {
      this.form().markAsTouched();
      return;
    }

    await submit(this.form, async () => {
      try {
        const m = this.model();
        const order = await firstValueFrom(
          this.orders.create({
            supplierId: Number(m.supplierId),
            expectedDeliveryDate: m.expectedDeliveryDate,
            notes: m.notes.trim() || null,
            items: this.lines().map((l) => ({
              supplyId: Number(l.supplyId),
              quantity: l.quantity!,
              unitPrice: l.unitPrice!,
            })),
          }),
        );
        this.toast.success(`Orden ${order.code} creada. Queda pendiente de aprobación.`);
        await this.router.navigate(['/purchases/orders', order.id]);
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }
}
