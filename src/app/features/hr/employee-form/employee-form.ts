import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  email,
  form,
  FormField,
  min,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { serverErrors } from '../../../core/utils/errors';
import {
  BANK_ACCOUNT_TYPE_LABEL,
  CONTRACT_TYPE_LABEL,
  DOCUMENT_TYPE_LABEL,
  EmployeeDetail,
  EmployeeUpsertRequest,
  PAY_FREQUENCY_LABEL,
  SHIFT_LABEL,
} from '../../../entities';
import { EmployeeService } from '../../../services/employee.service';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';

type EmployeeFormModel = Omit<EmployeeUpsertRequest, 'bankAccountNumber'> & {
  bankAccountNumber: string;
};

function toModel(e: EmployeeDetail | undefined): EmployeeFormModel {
  return {
    firstNames: e?.firstNames ?? '',
    lastNames: e?.lastNames ?? '',
    documentType: e?.documentType ?? 'CC',
    documentNumber: e?.documentNumber ?? '',
    birthDate: e?.birthDate ?? '',
    phone: e?.phone ?? '',
    email: e?.email ?? '',
    address: e?.address ?? '',
    emergencyContact: e?.emergencyContact ?? '',
    position: e?.position ?? '',
    department: e?.department ?? '',
    workSite: e?.workSite ?? 'Sede principal Chía',
    contractType: e?.contractType ?? 'Indefinite',
    hireDate: e?.hireDate ?? '',
    monthlySalary: e?.monthlySalary ?? 0,
    shift: e?.shift ?? 'Morning',
    eps: e?.eps ?? '',
    pensionFund: e?.pensionFund ?? '',
    arl: e?.arl ?? '',
    compensationFund: e?.compensationFund ?? '',
    bankName: e?.bankName ?? '',
    bankAccountType: e?.bankAccountType ?? 'Savings',
    bankAccountNumber: '', // nunca llega del servidor: solo se escribe para crear o cambiar
    payFrequency: e?.payFrequency ?? 'Biweekly',
  };
}

const entries = <K extends string>(labels: Record<K, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value: value as K, label: label as string }));

/** Pantalla 06.2 · Nuevo empleado (y edición). Cuatro secciones como en el mockup. */
@Component({
  selector: 'app-employee-form',
  imports: [RouterLink, FormField, FieldError, FormErrors],
  templateUrl: './employee-form.html',
})
export default class EmployeeForm {
  private readonly employees = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());

  protected readonly employee = rxResource({
    params: () => (this.id() ? Number(this.id()) : undefined),
    stream: ({ params }) => this.employees.get(params),
  });

  protected readonly model = linkedSignal<EmployeeFormModel>(() => toModel(this.employee.value()));

  protected readonly documentTypes = entries(DOCUMENT_TYPE_LABEL);
  protected readonly contractTypes = entries(CONTRACT_TYPE_LABEL);
  protected readonly shifts = entries(SHIFT_LABEL);
  protected readonly accountTypes = entries(BANK_ACCOUNT_TYPE_LABEL);
  protected readonly payFrequencies = entries(PAY_FREQUENCY_LABEL);

  protected readonly form = form(this.model, (p) => {
    const req = (path: Parameters<typeof required>[0], message: string) =>
      required(path, { message });

    // 1. Datos personales
    req(p.firstNames, 'Los nombres son obligatorios.');
    req(p.lastNames, 'Los apellidos son obligatorios.');
    req(p.documentNumber, 'El número de documento es obligatorio.');
    pattern(p.documentNumber, /^[\dA-Za-z.\s]{5,20}$/, {
      message: 'El número de documento no es válido.',
    });
    req(p.birthDate, 'La fecha de nacimiento es obligatoria.');
    req(p.phone, 'El teléfono es obligatorio.');
    pattern(p.phone, /^\+?[\d\s()-]{7,25}$/, { message: 'Escribe un teléfono válido.' });
    req(p.email, 'El correo es obligatorio.');
    email(p.email, { message: 'Escribe un correo válido.' });
    req(p.address, 'La dirección es obligatoria.');
    req(p.emergencyContact, 'El contacto de emergencia es obligatorio.');

    // 2. Contrato
    req(p.position, 'El cargo es obligatorio.');
    req(p.department, 'El área es obligatoria.');
    req(p.workSite, 'La sede es obligatoria.');
    req(p.hireDate, 'La fecha de ingreso es obligatoria.');
    min(p.monthlySalary, 1, { message: 'El salario debe ser mayor que cero.' });

    // 3. Seguridad social
    req(p.eps, 'La EPS es obligatoria.');
    req(p.pensionFund, 'El fondo de pensiones es obligatorio.');
    req(p.arl, 'La ARL es obligatoria.');
    req(p.compensationFund, 'La caja de compensación es obligatoria.');

    // 4. Pago de nómina
    req(p.bankName, 'La entidad bancaria es obligatoria.');
    validate(p.bankAccountNumber, ({ value }) => {
      const v = value().trim();
      if (!v && !this.isEdit())
        return {
          kind: 'required',
          message: 'El número de cuenta es obligatorio para pagar la nómina.',
        };
      if (v && !/^[\d\s-]{6,30}$/.test(v))
        return { kind: 'pattern', message: 'Solo números y guiones.' };
      return undefined;
    });
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, async () => {
      const m = this.model();
      const request: EmployeeUpsertRequest = {
        ...m,
        bankAccountNumber: m.bankAccountNumber.trim() || null,
      };
      try {
        const id = this.id();
        if (id) await firstValueFrom(this.employees.update(Number(id), request));
        else await firstValueFrom(this.employees.create(request));
        this.toast.success(
          id ? 'Datos del empleado actualizados.' : `${m.firstNames} quedó registrado.`,
        );
        await this.router.navigate(['/hr/employees']);
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }
}
