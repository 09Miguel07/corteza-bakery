import { PAYROLL_STATUS, payrollActions, periodPreset } from './payroll';

describe('payroll rules (UI)', () => {
  it('proposes the whole month for a monthly payroll', () => {
    expect(periodPreset('2026-11-04', 'Monthly')).toEqual({
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      paymentDate: '2026-11-30',
    });
    expect(periodPreset('2026-02-10', 'Monthly').endDate).toBe('2026-02-28');
  });

  it('proposes the current fortnight for a biweekly payroll', () => {
    expect(periodPreset('2026-11-04', 'Biweekly')).toEqual({
      startDate: '2026-11-01',
      endDate: '2026-11-15',
      paymentDate: '2026-11-15',
    });
    expect(periodPreset('2026-10-20', 'Biweekly')).toEqual({
      startDate: '2026-10-16',
      endDate: '2026-10-31',
      paymentDate: '2026-10-31',
    });
  });

  it('shows the action that matches the status', () => {
    expect(payrollActions('Draft', 0)).toEqual({ generate: true, approve: false, pay: false });
    expect(payrollActions('Draft', 5)).toEqual({ generate: true, approve: true, pay: false });
    expect(payrollActions('Approved', 5)).toEqual({ generate: false, approve: false, pay: true });
    expect(payrollActions('Paid', 5)).toEqual({ generate: false, approve: false, pay: false });
  });

  it('labels the statuses in Spanish', () => {
    expect(PAYROLL_STATUS.Draft.label).toBe('Borrador');
    expect(PAYROLL_STATUS.Paid.tone).toBe('success');
  });
});
