import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, min, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { serverErrors } from '../../../core/utils/errors';
import { STOCK_STATUS_LABEL, StockStatus, Supply, SupplyCreateRequest } from '../../../entities';
import { SupplierService } from '../../../services/supplier.service';
import { SupplyCategoryService } from '../../../services/supply-category.service';
import { SupplyService } from '../../../services/supply.service';
import { QtyPipe } from '../../../shared/pipes/format.pipes';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';
import { BadgeTone, StatusBadge } from '../../../shared/ui/status-badge';

/** Los <select> trabajan con texto; se convierte a número al enviar. */
interface SupplyFormModel {
  name: string;
  categoryId: string;
  purchaseUnit: string;
  unitLabel: string;
  unitSizeKg: number | null;
  initialStock: number;
  minStock: number;
  mainSupplierId: string;
}

function toModel(s: Supply | undefined): SupplyFormModel {
  return {
    name: s?.name ?? '',
    categoryId: s ? String(s.categoryId) : '',
    purchaseUnit: s?.purchaseUnit ?? '',
    unitLabel: s?.unitLabel ?? '',
    unitSizeKg: s?.unitSizeKg ?? null,
    initialStock: s?.currentStock ?? 0,
    minStock: s?.minStock ?? 0,
    mainSupplierId: s?.mainSupplierId ? String(s.mainSupplierId) : '',
  };
}

const TONE: Record<StockStatus, BadgeTone> = { Ok: 'success', Low: 'warning', Out: 'danger' };

/** Pantalla 03.2 · Agregar / editar insumo, con vista previa de cómo queda en el inventario. */
@Component({
  selector: 'app-supply-form',
  imports: [RouterLink, FormField, FieldError, FormErrors, StatusBadge, QtyPipe],
  templateUrl: './supply-form.html',
})
export default class SupplyForm {
  private readonly supplies = inject(SupplyService);
  private readonly suppliersApi = inject(SupplierService);
  private readonly categoryService = inject(SupplyCategoryService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());

  protected readonly categories = rxResource({ stream: () => this.categoryService.list() });
  protected readonly suppliers = rxResource({ stream: () => this.suppliersApi.list({ active: true, pageSize: 100 }) });
  protected readonly supply = rxResource({
    params: () => (this.id() ? Number(this.id()) : undefined),
    stream: ({ params }) => this.supplies.get(params),
  });

  protected readonly model = linkedSignal<SupplyFormModel>(() => toModel(this.supply.value()));

  protected readonly form = form(this.model, (p) => {
    required(p.name, { message: 'El nombre del insumo es obligatorio.' });
    required(p.categoryId, { message: 'Elige la categoría.' });
    required(p.purchaseUnit, { message: 'Escribe la unidad de compra, por ejemplo "Bulto de 50 kg".' });
    required(p.unitLabel, { message: 'Escribe cómo se cuenta, por ejemplo "bultos".' });
    min(p.unitSizeKg, 0.001, { message: 'El peso debe ser mayor que cero.' });
    min(p.initialStock, 0, { message: 'La cantidad no puede ser negativa.' });
    required(p.minStock, { message: 'Escribe la cantidad mínima.' });
    min(p.minStock, 0, { message: 'La cantidad mínima no puede ser negativa.' });
  });

  /** Vista previa "Así se verá en el inventario". */
  protected readonly preview = computed(() => {
    const m = this.model();
    const current = this.isEdit() ? (this.supply.value()?.currentStock ?? 0) : (m.initialStock ?? 0);
    const minStock = m.minStock ?? 0;
    const status: StockStatus = current <= 0 ? 'Out' : current < minStock ? 'Low' : 'Ok';
    const category = this.categories.value()?.find((c) => String(c.id) === m.categoryId)?.name;
    const supplier = this.suppliers.value()?.items.find((s) => String(s.id) === m.mainSupplierId)?.name;
    return { current, minStock, status, category, supplier, label: m.unitLabel || 'unidades' };
  });

  protected readonly statusLabel = STOCK_STATUS_LABEL;
  protected readonly tone = TONE;

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, async () => {
      const m = this.model();
      const request: SupplyCreateRequest = {
        name: m.name,
        categoryId: Number(m.categoryId),
        purchaseUnit: m.purchaseUnit,
        unitLabel: m.unitLabel,
        unitSizeKg: m.unitSizeKg || null,
        minStock: m.minStock,
        mainSupplierId: m.mainSupplierId ? Number(m.mainSupplierId) : null,
        initialStock: m.initialStock ?? 0,
      };
      try {
        const id = this.id();
        if (id) await firstValueFrom(this.supplies.update(Number(id), request));
        else await firstValueFrom(this.supplies.create(request));
        this.toast.success(id ? 'Insumo actualizado.' : `"${m.name}" quedó en el inventario.`);
        await this.router.navigate(['/inventory']);
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }
}
