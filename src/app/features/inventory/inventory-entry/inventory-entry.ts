import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, max, min, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { localToday } from '../../../core/utils/dates';
import { serverErrors } from '../../../core/utils/errors';
import { MovementType } from '../../../entities';
import { InventoryMovementService } from '../../../services/inventory-movement.service';
import { SupplierService } from '../../../services/supplier.service';
import { SupplyService } from '../../../services/supply.service';
import { QtyPipe } from '../../../shared/pipes/format.pipes';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';

interface MovementFormModel {
  type: MovementType;
  supplyId: string;
  quantity: number;
  supplierId: string;
  movementDate: string;
  location: string;
  expirationDate: string;
  notes: string;
}

/** Pantalla 03.3 · Registrar entrada (y salida) de insumo, con el antes y el después del stock. */
@Component({
  selector: 'app-inventory-entry',
  imports: [RouterLink, FormField, FieldError, FormErrors, QtyPipe],
  templateUrl: './inventory-entry.html',
  styleUrl: './inventory-entry.scss',
})
export default class InventoryEntry {
  private readonly movements = inject(InventoryMovementService);
  private readonly supplyApi = inject(SupplyService);
  private readonly supplierApi = inject(SupplierService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Query params: ?type=In|Out&supplyId=3 */
  readonly type = input<string>();
  readonly supplyId = input<string>();

  protected readonly supplies = rxResource({ stream: () => this.supplyApi.list({ active: true, pageSize: 100 }) });
  protected readonly suppliers = rxResource({ stream: () => this.supplierApi.list({ active: true, pageSize: 100 }) });
  protected readonly today = localToday();

  protected readonly model = linkedSignal<MovementFormModel>(() => ({
    type: this.type() === 'Out' ? 'Out' : 'In',
    supplyId: this.supplyId() ?? '',
    quantity: 1,
    supplierId: '',
    movementDate: this.today,
    location: '',
    expirationDate: '',
    notes: '',
  }));

  protected readonly isEntry = computed(() => this.model().type === 'In');

  protected readonly selected = computed(() =>
    this.supplies.value()?.items.find((s) => String(s.id) === this.model().supplyId),
  );

  protected readonly form = form(this.model, (p) => {
    required(p.supplyId, { message: 'Elige el insumo.' });
    required(p.quantity, { message: 'Escribe la cantidad.' });
    min(p.quantity, 0.01, { message: 'La cantidad debe ser mayor que cero.' });
    // Una salida no puede dejar el stock en negativo (la API también lo valida).
    max(p.quantity, () => (this.isEntry() ? undefined : this.selected()?.currentStock), {
      message: 'No hay tanto en bodega: stock insuficiente.',
    });
    required(p.movementDate, { message: 'Escribe la fecha.' });
    validate(p.movementDate, ({ value }) =>
      value() > this.today ? { kind: 'maxDate', message: 'La fecha no puede ser futura.' } : undefined,
    );
    validate(p.expirationDate, ({ value }) =>
      value() && value() < this.model().movementDate
        ? { kind: 'minDate', message: 'El vencimiento no puede ser anterior a la llegada.' }
        : undefined,
    );
  });

  /** "Había antes · Entran ahora · Nuevo total" con su equivalente en kilos. */
  protected readonly preview = computed(() => {
    const supply = this.selected();
    if (!supply) return null;
    const qty = Number(this.model().quantity) || 0;
    const after = this.isEntry() ? supply.currentStock + qty : supply.currentStock - qty;
    const kg = (n: number) => (supply.unitSizeKg ? n * supply.unitSizeKg : null);
    return { supply, before: supply.currentStock, qty, after, kgBefore: kg(supply.currentStock), kgQty: kg(qty), kgAfter: kg(after) };
  });

  protected setType(type: MovementType): void {
    this.form.type().value.set(type);
  }

  protected step(delta: number): void {
    this.form.quantity().value.update((q) => Math.max(1, (Number(q) || 0) + delta));
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, async () => {
      const m = this.model();
      try {
        const movement = await firstValueFrom(
          this.movements.register({
            supplyId: Number(m.supplyId),
            type: m.type,
            quantity: Number(m.quantity),
            supplierId: this.isEntry() && m.supplierId ? Number(m.supplierId) : null,
            movementDate: m.movementDate || null,
            location: m.location.trim() || null,
            expirationDate: m.expirationDate || null,
            notes: m.notes.trim() || null,
          }),
        );
        this.toast.success(`${this.isEntry() ? 'Entrada' : 'Salida'} registrada. ${movement.supplyName} queda en ${movement.stockAfter}.`);
        await this.router.navigate(['/inventory']);
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }
}
