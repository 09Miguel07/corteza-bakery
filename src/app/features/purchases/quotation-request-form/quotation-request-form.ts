import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required, submit, validate } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { localToday } from '../../../core/utils/dates';
import { serverErrors } from '../../../core/utils/errors';
import { QuotationRequestService } from '../../../services/quotation-request.service';
import { SupplyService } from '../../../services/supply.service';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';
import { EditableLine, emptyLine, LineEditor, linesProblem } from '../line-editor/line-editor';

/** Nueva solicitud de cotización: insumos, cantidades y fecha límite para responder. */
@Component({
  selector: 'app-quotation-request-form',
  imports: [RouterLink, FormField, FieldError, FormErrors, LineEditor],
  templateUrl: './quotation-request-form.html',
})
export default class QuotationRequestForm {
  private readonly requests = inject(QuotationRequestService);
  private readonly supplyApi = inject(SupplyService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly supplies = rxResource({
    stream: () => this.supplyApi.list({ active: true, pageSize: 100 }),
  });
  protected readonly today = localToday();

  protected readonly model = signal({ description: '', responseDeadline: this.today });
  protected readonly form = form(this.model, (p) => {
    required(p.responseDeadline, { message: 'Escribe hasta cuándo reciben cotizaciones.' });
    validate(p.responseDeadline, ({ value }) =>
      value() < this.today
        ? { kind: 'minDate', message: 'La fecha límite no puede ser en el pasado.' }
        : undefined,
    );
  });

  protected readonly lines = signal<EditableLine[]>([emptyLine()]);
  protected readonly linesTouched = signal(false);
  protected readonly linesError = computed(() => linesProblem(this.lines(), false));

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    this.linesTouched.set(true);
    if (this.linesError()) return;

    await submit(this.form, async () => {
      try {
        const m = this.model();
        const created = await firstValueFrom(
          this.requests.create({
            description: m.description.trim() || null,
            responseDeadline: m.responseDeadline,
            items: this.lines().map((l) => ({
              supplyId: Number(l.supplyId),
              quantity: l.quantity!,
            })),
          }),
        );
        this.toast.success(
          `Solicitud ${created.code} creada. Registra las cotizaciones a medida que lleguen.`,
        );
        await this.router.navigate(['/purchases/quotations', created.id]);
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }
}
