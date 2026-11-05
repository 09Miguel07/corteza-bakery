import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';
import { problemMessage } from '../../../core/utils/errors';
import { PAYROLL_STATUS, payrollActions } from '../../../core/utils/payroll';
import { PayrollPeriodDetail as Period } from '../../../entities';
import { PayrollService } from '../../../services/payroll.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Periodo de nómina: generar comprobantes, aprobar y marcar pagado. */
@Component({
  selector: 'app-payroll-period-detail',
  imports: [RouterLink, DatePipe, StatusBadge, CopPipe],
  template: `
    <a routerLink="/hr/payroll" class="back-link"
      ><span class="material-symbols-outlined">arrow_back</span> Volver al calendario</a
    >

    @if (period.value(); as p) {
      <header class="page-header">
        <div>
          <p class="eyebrow">Nómina · {{ p.days }} días</p>
          <h1>
            {{ p.startDate | date: 'd MMM' }} – {{ p.endDate | date: 'd MMM y' }}
            <app-status-badge [label]="status[p.status].label" [tone]="status[p.status].tone" />
          </h1>
          <p class="page-header__subtitle">Se paga el {{ p.paymentDate | date: 'EEEE d MMMM' }}</p>
        </div>
        <div class="page-header__actions">
          @if (actions().generate) {
            <button type="button" class="btn btn--ghost" [disabled]="busy()" (click)="generate(p)">
              <span class="material-symbols-outlined">calculate</span>
              {{ p.payslips.length ? 'Recalcular' : 'Generar comprobantes' }}
            </button>
          }
          @if (actions().approve) {
            <button type="button" class="btn btn--primary" [disabled]="busy()" (click)="approve(p)">
              Aprobar nómina
            </button>
          }
          @if (actions().pay) {
            <button type="button" class="btn btn--primary" [disabled]="busy()" (click)="pay(p)">
              Marcar pagada
            </button>
          }
        </div>
      </header>

      @if (error(); as message) {
        <div class="alert alert--danger" role="alert">
          <span class="material-symbols-outlined">error</span>{{ message }}
        </div>
      }

      <section class="stats">
        <div class="stat">
          <span class="eyebrow">Devengado</span>
          <div class="stat__value">{{ p.totalEarnings | cop }}</div>
        </div>
        <div class="stat">
          <span class="eyebrow">Deducciones</span>
          <div class="stat__value">{{ p.totalDeductions | cop }}</div>
        </div>
        <div class="stat stat--alert">
          <span class="eyebrow">Neto a pagar</span>
          <div class="stat__value">{{ p.totalNet | cop }}</div>
        </div>
      </section>

      <section class="card card--flush">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th class="num">Días</th>
                <th class="num">Devengado</th>
                <th class="num">Deducciones</th>
                <th class="num">Neto</th>
                <th class="actions"></th>
              </tr>
            </thead>
            <tbody>
              @for (s of p.payslips; track s.id) {
                <tr>
                  <td>
                    <strong>{{ s.employeeName }}</strong>
                    <div class="subtle">{{ s.position }}</div>
                  </td>
                  <td class="num">{{ s.daysWorked }}</td>
                  <td class="num">{{ s.totalEarnings | cop }}</td>
                  <td class="num">{{ s.totalDeductions | cop }}</td>
                  <td class="num">
                    <strong>{{ s.netPay | cop }}</strong>
                  </td>
                  <td class="actions">
                    <a class="btn btn--link" [routerLink]="['/hr/payslips', s.id]">Comprobante</a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="table-state">
                    Todavía no hay comprobantes. Usa “Generar comprobantes”.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    } @else if (period.error()) {
      <div class="alert alert--danger">
        <span class="material-symbols-outlined">error</span> No se encontró el periodo.
      </div>
    } @else {
      <section class="card"><div class="skeleton"></div></section>
    }
  `,
})
export default class PayrollPeriodDetail {
  private readonly payroll = inject(PayrollService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  protected readonly period = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.payroll.get(params),
  });
  protected readonly status = PAYROLL_STATUS;
  protected readonly actions = computed(() => {
    const p = this.period.value();
    return p
      ? payrollActions(p.status, p.payslips.length)
      : { generate: false, approve: false, pay: false };
  });
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected generate(p: Period): Promise<void> {
    return this.run(this.payroll.generate(p.id), 'Comprobantes calculados.');
  }

  protected async approve(p: Period): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Aprobar la nómina?',
      message: `${p.payslips.length} comprobantes por ${new CopPipe().transform(p.totalNet)}. Después ya no se puede recalcular.`,
      confirmText: 'Sí, aprobar',
      tone: 'primary',
    });
    if (ok) await this.run(this.payroll.approve(p.id), 'Nómina aprobada.');
  }

  protected async pay(p: Period): Promise<void> {
    const ok = await this.confirm.ask({
      title: '¿Ya se pagó la nómina?',
      message: `Se marcan pagados los ${p.payslips.length} comprobantes.`,
      confirmText: 'Sí, marcar pagada',
      tone: 'primary',
    });
    if (ok) await this.run(this.payroll.pay(p.id), 'Nómina pagada.');
  }

  private async run(request: Observable<Period>, success: string): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      this.period.set(await firstValueFrom(request));
      this.toast.success(success);
    } catch (error) {
      this.error.set(problemMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
