import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { email, form, FormField, pattern, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { serverErrors } from '../../../core/utils/errors';
import { SupplierDetail, SupplierUpsertRequest } from '../../../entities';
import { SupplierService } from '../../../services/supplier.service';
import { SupplyCategoryService } from '../../../services/supply-category.service';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';

function toModel(s: SupplierDetail | undefined): SupplierUpsertRequest {
  return {
    name: s?.name ?? '',
    taxId: s?.taxId ?? '',
    contactName: s?.contactName ?? '',
    phone: s?.phone ?? '',
    email: s?.email ?? '',
    categoryIds: s?.categories.map((c) => c.id) ?? [],
  };
}

/** Pantalla 04.2 · Añadir / editar proveedor. */
@Component({
  selector: 'app-supplier-form',
  imports: [RouterLink, FormField, FieldError, FormErrors],
  templateUrl: './supplier-form.html',
})
export default class SupplierForm {
  private readonly suppliers = inject(SupplierService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());

  private readonly categoryService = inject(SupplyCategoryService);
  protected readonly categories = rxResource({ stream: () => this.categoryService.list() });
  protected readonly supplier = rxResource({
    params: () => (this.id() ? Number(this.id()) : undefined),
    stream: ({ params }) => this.suppliers.get(params),
  });

  protected readonly model = linkedSignal<SupplierUpsertRequest>(() => toModel(this.supplier.value()));

  protected readonly form = form(this.model, (p) => {
    required(p.name, { message: 'El nombre del proveedor es obligatorio.' });
    required(p.taxId, { message: 'El NIT es obligatorio.' });
    pattern(p.taxId, /^[\d.\s]{6,15}(-\d)?$/, { message: 'Escribe un NIT válido, por ejemplo 900.123.456-7.' });
    required(p.contactName, { message: 'La persona de contacto es obligatoria.' });
    required(p.phone, { message: 'El teléfono es obligatorio.' });
    pattern(p.phone, /^\+?[\d\s]{7,20}$/, { message: 'Escribe un teléfono válido, por ejemplo 310 987 6543.' });
    required(p.email, { message: 'El correo es obligatorio: ahí se envían las órdenes de compra.' });
    email(p.email, { message: 'Escribe un correo válido, por ejemplo ventas@empresa.com.' });
    validate(p.categoryIds, ({ value }) =>
      value().length === 0 ? { kind: 'required', message: 'Marca al menos una categoría de lo que nos vende.' } : undefined,
    );
  });

  protected isSelected(categoryId: number): boolean {
    return this.model().categoryIds.includes(categoryId);
  }

  protected toggleCategory(categoryId: number): void {
    const field = this.form.categoryIds;
    field().value.update((ids) => (ids.includes(categoryId) ? ids.filter((id) => id !== categoryId) : [...ids, categoryId]));
    field().markAsTouched();
  }

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, async () => {
      try {
        const id = this.id();
        const request = this.model();
        if (id) await firstValueFrom(this.suppliers.update(Number(id), request));
        else await firstValueFrom(this.suppliers.create(request));
        this.toast.success(id ? 'Proveedor actualizado.' : 'Proveedor registrado. Ya puede recibir pedidos.');
        await this.router.navigate(['/suppliers']);
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }
}
