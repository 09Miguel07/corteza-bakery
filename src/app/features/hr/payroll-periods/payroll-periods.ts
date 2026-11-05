import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/ui/toast.service';
import { localToday } from '../../../core/utils/dates';
import { problemMessage } from '../../../core/utils/errors';
import { PAYROLL_STATUS, periodPreset } from '../../../core/utils/payroll';
import { PayFrequency } from '../../../entities';
import { PayrollService } from '../../../services/payroll.service';
import { CopPipe } from '../../../shared/pipes/format.pipes';
import { PageHeader } from '../../../shared/ui/page-header';
import { StatusBadge } from '../../../shared/ui/status-badge';

/** Pantalla 06.0 · Calendario de pagos: periodos de nómina y su estado. */
@Component({
  selector: 'app-payroll-periods',
  imports: [RouterLink, DatePipe, PageHeader, StatusBadge, CopPipe],
  template: `
    <app-page-header
      eyebrow="Módulo 06 · Talento Humano"
      title="Nómina"
      subtitle="Calendario de pagos del año"
    >
      <a routerLink="/hr/employees" class="btn btn--ghost"
        ><span class="material-symbols-outlined">badge</span> Empleados</a
      >
    </app-page-header>

    <div class="layout-2col">
      <section class="card card--flush">
        <div class="filters">
          <div class="field field--narrow">
            <label for="year">Año</label>
            <select
              id="year"
              class="select"
              [value]="year()"
              (change)="year.set(+$any($event.target).value)"
            >
              @for (y of years; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Pago</th>
                <th class="num">Empleados</th>
                <th class="num">Neto a pagar</th>
                <th>Estado</th>
                <th class="actions"></th>
              </tr>
            </thead>
            <tbody>
              @for (p of periods.value(); track p.id) {
                <tr>
                  <td>
                    <strong
                      >{{ p.startDate | date: 'd MMM' }} – {{ p.endDate | date: 'd MMM y' }}</strong
                    >
                  </td>
                  <td>{{ p.paymentDate | date: 'EEE d MMM' }}</td>
                  <td class="num">{{ p.employeesCount }}</td>
                  <td class="num">{{ p.totalNet | cop }}</td>
                  <td>
                    <app-status-badge
                      [label]="status[p.status].label"
                      [tone]="status[p.status].tone"
                    />
                  </td>
                  <td class="actions"><a class="btn btn--link" [routerLink]="[p.id]">Abrir</a></td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="table-state">
                    {{ periods.isLoading() ? 'Cargando…' : 'No hay periodos en ' + year() + '.' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <aside class="card">
        <div class="card__title">
          <span class="material-symbols-outlined">event</span>
          <h2>Nuevo periodo</h2>
        </div>
        <div class="segmented" role="group" aria-label="Frecuencia" style="margin-top: 0.75rem">
          <button
            type="button"
            [class.is-selected]="frequency() === 'Biweekly'"
            (click)="usePreset('Biweekly')"
          >
            Quincena
          </button>
          <button
            type="button"
            [class.is-selected]="frequency() === 'Monthly'"
            (click)="usePreset('Monthly')"
          >
            Mes
          </button>
        </div>
        <div class="field" style="margin-top: 0.75rem">
          <label for="start">Desde</label>
          <input
            id="start"
            class="input"
            type="date"
            [value]="draft().startDate"
            (input)="patch('startDate', $event)"
          />
        </div>
        <div class="field" style="margin-top: 0.75rem">
          <label for="end">Hasta</label>
          <input
            id="end"
            class="input"
            type="date"
            [value]="draft().endDate"
            (input)="patch('endDate', $event)"
          />
        </div>
        <div class="field" style="margin-top: 0.75rem">
          <label for="pay">Fecha de pago</label>
          <input
            id="pay"
            class="input"
            type="date"
            [value]="draft().paymentDate"
            (input)="patch('paymentDate', $event)"
          />
        </div>
        @if (error(); as message) {
          <p class="field-error" role="alert">{{ message }}</p>
        }
        <button
          type="button"
          class="btn btn--primary btn--block"
          style="margin-top: 1rem"
          [disabled]="busy()"
          (click)="create()"
        >
          Crear periodo
        </button>
        <p class="subtle" style="margin-top: 0.75rem">
          Salud y pensión 4 % c/u; auxilio de transporte hasta 2 salarios mínimos (valores 2026).
        </p>
      </aside>
    </div>
  `,
})
export default class PayrollPeriods {
  private readonly payroll = inject(PayrollService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly today = localToday();

  protected readonly status = PAYROLL_STATUS;
  protected readonly year = signal(Number(this.today.slice(0, 4)));
  protected readonly years = [this.year() - 1, this.year(), this.year() + 1];
  protected readonly periods = rxResource({
    params: () => this.year(),
    stream: ({ params }) => this.payroll.list(params),
  });

  protected readonly frequency = signal<PayFrequency>('Biweekly');
  protected readonly draft = signal(periodPreset(this.today, 'Biweekly'));
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly hasPeriods = computed(() => (this.periods.value() ?? []).length > 0);

  protected usePreset(frequency: PayFrequency): void {
    this.frequency.set(frequency);
    this.draft.set(periodPreset(this.today, frequency));
  }

  protected patch(key: 'startDate' | 'endDate' | 'paymentDate', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  protected async create(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const period = await firstValueFrom(this.payroll.create(this.draft()));
      this.toast.success('Periodo creado. Ahora genera los comprobantes.');
      await this.router.navigate(['/hr/payroll', period.id]);
    } catch (error) {
      this.error.set(problemMessage(error)); // 409 si se cruza con otro periodo
    } finally {
      this.busy.set(false);
    }
  }
}
