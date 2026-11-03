import { ActiveFilter, IsoDate, IsoDateTime, PageQuery } from './common.entity';

export interface CustomerQuery extends PageQuery {
  document?: string;
  name?: string;
  active?: ActiveFilter;
}

export interface CustomerListItem {
  id: number;
  code: string;
  documentNumber: string;
  firstNames: string;
  lastNames: string;
  phone: string;
  email: string | null;
  isActive: boolean;
}

export interface CustomerDetail extends CustomerListItem {
  birthday: IsoDate | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime | null;
  ordersCount: number;
  totalPurchased: number;
}

/** La cédula no se edita después de crear (pantalla 01.3). */
export interface CustomerUpdateRequest {
  firstNames: string;
  lastNames: string;
  phone: string;
  email: string | null;
  birthday: IsoDate | null;
}

export interface CustomerCreateRequest extends CustomerUpdateRequest {
  documentNumber: string;
}
