import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PAYROLL_STATUS } from '../../../core/utils/payroll';
import { PayrollService } from '../../../services/payroll.service';
import { CopPipe, DocumentPipe } from '../../../shared/pipes/format.pipes';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Pantalla 06.3 · Comprobante de nómina (imprimible). */
@Component({
  selector: 'app-payslip',
  imports: [RouterLink, DatePipe, StatusBadge, CopPipe, DocumentPipe],
  template: `
    @if (slip.value(); as s) {
      <div
        class="no-print"
        style="display: flex; justify-content: space-between; align-items: center"
      >
        <a [routerLink]="['/hr/payroll', s.periodId]" class="back-link"
          ><span class="material-symbols-outlined">arrow_back</span> Volver al periodo</a
        >
        <button type="button" class="btn btn--ghost" (click)="print()">
          <span class="material-symbols-outlined">print</span> Imprimir
        </button>
      </div>

      <article class="card">
        <p class="eyebrow">Panadería La Espiga · Comprobante de nómina</p>
        <h1>
          {{ s.code }}
          <app-status-badge [label]="status[s.status].label" [tone]="status[s.status].tone" />
        </h1>
        <p class="page-header__subtitle">
          Periodo {{ s.periodStart | date: 'd MMM' }} – {{ s.periodEnd | date: 'd MMM y' }} · pago
          {{ s.paymentDate | date: 'd MMM y' }}
        </p>

        <div class="form-grid" style="margin-top: 1.25rem">
          <dl class="facts">
            <dt>Empleado</dt>
            <dd>{{ s.employeeName }}</dd>
            <dt>Documento</dt>
            <dd>{{ s.documentType }} {{ s.documentNumber | document }}</dd>
            <dt>Cargo</dt>
            <dd>{{ s.position }} · {{ s.department }}</dd>
            <dt>Salario</dt>
            <dd>{{ s.monthlySalary | cop }} / mes</dd>
          </dl>
          <dl class="facts">
            <dt>EPS</dt>
            <dd>{{ s.eps }}</dd>
            <dt>Pensión</dt>
            <dd>{{ s.pensionFund }}</dd>
            <dt>Cuenta</dt>
            <dd>{{ s.bankName }} {{ s.bankAccountMasked }}</dd>
            <dt>Días</dt>
            <dd>{{ s.daysWorked }}</dd>
          </dl>
        </div>

        <div class="form-grid" style="margin-top: 1.5rem">
          <section>
            <h2 class="eyebrow">Devengado</h2>
            <table class="table">
              <tbody>
                @for (l of s.earnings; track l.concept) {
                  <tr>
                    <td>
                      {{ l.concept }}
                      <div class="subtle">{{ l.description }}</div>
                    </td>
                    <td class="num">{{ l.amount | cop }}</td>
                  </tr>
                }
                <tr>
                  <td><strong>Total devengado</strong></td>
                  <td class="num">
                    <strong>{{ s.totalEarnings | cop }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
          <section>
            <h2 class="eyebrow">Deducciones</h2>
            <table class="table">
              <tbody>
                @for (l of s.deductions; track l.concept) {
                  <tr>
                    <td>
                      {{ l.concept }}
                      <div class="subtle">{{ l.description }}</div>
                    </td>
                    <td class="num">{{ l.amount | cop }}</td>
                  </tr>
                }
                <tr>
                  <td><strong>Total deducciones</strong></td>
                  <td class="num">
                    <strong>{{ s.totalDeductions | cop }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <div class="totals">
          <span class="muted">Neto a pagar</span><strong>{{ s.netPay | cop }}</strong>
        </div>
        @if (s.paidAt) {
          <p class="subtle" style="margin-top: 0.5rem">Pagado el {{ s.paidAt | date: 'medium' }}</p>
        }
      </article>
    } @else if (slip.error()) {
      <div class="alert alert--danger">
        <span class="material-symbols-outlined">error</span> No se encontró el comprobante.
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
    }
  `,
})
export default class Payslip {
  private readonly payroll = inject(PayrollService);
  readonly id = input.required<string>();
  protected readonly slip = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.payroll.payslip(params),
  });
  protected readonly status = PAYROLL_STATUS;

  protected print(): void {
    window.print();
  }
}
