import { DocumentType } from './employee.entity';
import { IsoDate, IsoDateTime } from './common.entity';

export type PayrollStatus = 'Draft' | 'Approved' | 'Paid';

export interface PayrollPeriodListItem {
  id: number;
  startDate: IsoDate;
  endDate: IsoDate;
  paymentDate: IsoDate;
  status: PayrollStatus;
  employeesCount: number;
  totalNet: number;
}

export interface PayslipListItem {
  id: number;
  code: string;
  employeeId: number;
  employeeName: string;
  position: string;
  daysWorked: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  status: PayrollStatus;
}

export interface PayrollPeriodDetail {
  id: number;
  startDate: IsoDate;
  endDate: IsoDate;
  paymentDate: IsoDate;
  status: PayrollStatus;
  days: number;
  totalEarnings: number;
  totalDeductions: number;
  totalNet: number;
  payslips: PayslipListItem[];
}

export interface PayslipLine {
  concept: string;
  description: string | null;
  amount: number;
}

/** Pantalla 06.3 · Comprobante de nómina. */
export interface PayslipDetail {
  id: number;
  code: string;
  status: PayrollStatus;
  periodId: number;
  periodStart: IsoDate;
  periodEnd: IsoDate;
  paymentDate: IsoDate;
  employeeName: string;
  documentType: DocumentType;
  documentNumber: string;
  position: string;
  department: string;
  monthlySalary: number;
  eps: string;
  pensionFund: string;
  bankName: string;
  bankAccountMasked: string;
  daysWorked: number;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  paidAt: IsoDateTime | null;
}

export interface PayrollPeriodCreateRequest {
  startDate: IsoDate;
  endDate: IsoDate;
  paymentDate: IsoDate;
}
