import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { disabled, email, form, FormField, maxLength, pattern, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { localToday } from '../../../core/utils/dates';
import { serverErrors } from '../../../core/utils/errors';
import { CustomerCreateRequest, CustomerDetail } from '../../../entities';
import { CustomerService } from '../../../services/customer.service';
import { CopPipe, DocumentPipe, InitialsPipe } from '../../../shared/pipes/format.pipes';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';

interface CustomerFormModel {
  documentNumber: string;
  firstNames: string;
  lastNames: string;
  phone: string;
  email: string;
  birthday: string; // yyyy-MM-dd o vacío
}

const PHONE = /^\+?[\d\s]{7,20}$/;

function toModel(c: CustomerDetail | undefined): CustomerFormModel {
  return {
    documentNumber: c?.documentNumber ?? '',
    firstNames: c?.firstNames ?? '',
    lastNames: c?.lastNames ?? '',
    phone: c?.phone ?? '',
    email: c?.email ?? '',
    birthday: c?.birthday ?? '',
  };
}

/** Pantallas 01.2 (crear) y 01.3 (editar) · CRM. El mismo formulario sirve para ambas. */
@Component({
  selector: 'app-customer-form',
  imports: [RouterLink, FormField, FieldError, FormErrors, DocumentPipe, InitialsPipe, CopPipe, DatePipe],
  templateUrl: './customer-form.html',
})
export default class CustomerForm {
  private readonly customers = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Viene de la ruta `:id/edit` (withComponentInputBinding). */
  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());

  protected readonly customer = rxResource({
    params: () => (this.id() ? Number(this.id()) : undefined),
    stream: ({ params }) => this.customers.get(params),
  });

  /** El modelo se reinicia cuando llega el cliente a editar. */
  protected readonly model = linkedSignal<CustomerFormModel>(() => toModel(this.customer.value()));

  protected readonly form = form(this.model, (p) => {
    required(p.documentNumber, { message: 'La cédula es obligatoria.' });
    pattern(p.documentNumber, /^[\d.\s]{5,20}$/, { message: 'La cédula solo puede tener números.' });
    disabled(p.documentNumber, () => (this.isEdit() ? 'La cédula no se puede modificar.' : false));

    required(p.firstNames, { message: 'Los nombres son obligatorios.' });
    maxLength(p.firstNames, 80);
    required(p.lastNames, { message: 'Los apellidos son obligatorios.' });
    maxLength(p.lastNames, 80);

    required(p.phone, { message: 'El teléfono celular es obligatorio.' });
    pattern(p.phone, PHONE, { message: 'Escribe un teléfono válido, por ejemplo 312 458 9012.' });

    email(p.email, { message: 'Escribe un correo válido, por ejemplo maria.lopez@gmail.com.' });
    validate(p.birthday, ({ value }) =>
      value() && value() > localToday() ? { kind: 'maxDate', message: 'La fecha de cumpleaños no puede ser futura.' } : undefined,
    );
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, async () => {
      const m = this.model();
      const request: CustomerCreateRequest = {
        documentNumber: m.documentNumber,
        firstNames: m.firstNames,
        lastNames: m.lastNames,
        phone: m.phone,
        email: m.email.trim() || null,
        birthday: m.birthday || null,
      };

      try {
        const id = this.id();
        const saved = id
          ? await firstValueFrom(this.customers.update(Number(id), request))
          : await firstValueFrom(this.customers.create(request));
        this.toast.success(id ? 'Cambios guardados.' : `Cliente ${saved.code} registrado.`);
        await this.router.navigate(['/customers']);
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }

  protected reset(): void {
    this.model.set(toModel(this.customer.value()));
    this.form().reset();
  }
}
