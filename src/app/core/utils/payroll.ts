import { PayFrequency, PayrollPeriodCreateRequest, PayrollStatus } from '../../entities';
import { BadgeTone } from '../../shared/ui/status-badge';

export const PAYROLL_STATUS: Record<PayrollStatus, { label: string; tone: BadgeTone }> = {
  Draft: { label: 'Borrador', tone: 'warning' },
  Approved: { label: 'Aprobada', tone: 'neutral' },
  Paid: { label: 'Pagada', tone: 'success' },
};

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** Periodo sugerido según la fecha de hoy: el mes completo o la quincena en curso. */
export function periodPreset(today: string, frequency: PayFrequency): PayrollPeriodCreateRequest {
  const [y, m, d] = today.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  if (frequency === 'Monthly') return { startDate: iso(y, m, 1), endDate: iso(y, m, lastDay), paymentDate: iso(y, m, lastDay) };
  return d <= 15
    ? { startDate: iso(y, m, 1), endDate: iso(y, m, 15), paymentDate: iso(y, m, 15) }
    : { startDate: iso(y, m, 16), endDate: iso(y, m, lastDay), paymentDate: iso(y, m, lastDay) };
}

/** Qué botones muestra el periodo (06.0): mismas reglas que PayrollPeriod en el dominio. */
export function payrollActions(status: PayrollStatus, payslips: number): { generate: boolean; approve: boolean; pay: boolean } {
  return { generate: status === 'Draft', approve: status === 'Draft' && payslips > 0, pay: status === 'Approved' };
}
