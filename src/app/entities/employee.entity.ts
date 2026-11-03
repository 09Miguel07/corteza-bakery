import { ActiveFilter, IsoDate, IsoDateTime, PageQuery } from './common.entity';

export type DocumentType = 'CC' | 'CE' | 'PP' | 'TI';
export type ContractType = 'Indefinite' | 'FixedTerm' | 'Services' | 'Apprenticeship';
export type WorkShift = 'Morning' | 'Afternoon' | 'Night';
export type BankAccountType = 'Savings' | 'Checking';
export type PayFrequency = 'Biweekly' | 'Monthly';

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía (CC)',
  CE: 'Cédula de extranjería (CE)',
  PP: 'Pasaporte (PP)',
  TI: 'Tarjeta de identidad (TI)',
};

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  Indefinite: 'Término indefinido',
  FixedTerm: 'Término fijo',
  Services: 'Prestación de servicios',
  Apprenticeship: 'Aprendizaje',
};

export const SHIFT_LABEL: Record<WorkShift, string> = {
  Morning: 'Mañana',
  Afternoon: 'Tarde',
  Night: 'Noche',
};

export const BANK_ACCOUNT_TYPE_LABEL: Record<BankAccountType, string> = {
  Savings: 'Cuenta de ahorros',
  Checking: 'Cuenta corriente',
};

export const PAY_FREQUENCY_LABEL: Record<PayFrequency, string> = {
  Biweekly: 'Quincenal (días 15 y 30)',
  Monthly: 'Mensual',
};

export interface EmployeeQuery extends PageQuery {
  search?: string;
  position?: string | null;
  shift?: WorkShift | null;
  active?: ActiveFilter;
}

export interface EmployeeListItem {
  id: number;
  firstNames: string;
  lastNames: string;
  documentType: DocumentType;
  documentNumber: string;
  position: string;
  shift: WorkShift;
  isActive: boolean;
  hasUser: boolean;
}

export interface EmployeeSummary {
  total: number;
  active: number;
  inactive: number;
  activePercentage: number;
}

interface EmployeeFields {
  firstNames: string;
  lastNames: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: IsoDate;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  position: string;
  department: string;
  workSite: string;
  contractType: ContractType;
  hireDate: IsoDate;
  monthlySalary: number;
  shift: WorkShift;
  eps: string;
  pensionFund: string;
  arl: string;
  compensationFund: string;
  bankName: string;
  bankAccountType: BankAccountType;
  payFrequency: PayFrequency;
}

export interface EmployeeDetail extends EmployeeFields {
  id: number;
  /** Solo los últimos 4 dígitos: "****4521". */
  bankAccountMasked: string;
  isActive: boolean;
  username: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime | null;
}

export interface EmployeeUpsertRequest extends EmployeeFields {
  /** Obligatorio al crear. Al editar, vacío = conservar el actual. */
  bankAccountNumber: string | null;
}
