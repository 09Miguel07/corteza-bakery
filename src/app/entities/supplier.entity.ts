import { ActiveFilter, IsoDateTime, PageQuery } from './common.entity';

export interface CategoryRef {
  id: number;
  name: string;
}

export interface SupplierQuery extends PageQuery {
  taxId?: string;
  name?: string;
  categoryId?: number | null;
  active?: ActiveFilter;
}

export interface SupplierListItem {
  id: number;
  name: string;
  taxId: string;
  contactName: string;
  phone: string;
  email: string;
  /** Se descuenta al aprobar una orden de compra. */
  availableBudget: number;
  isActive: boolean;
  categories: CategoryRef[];
}

export interface SupplierDetail extends SupplierListItem {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime | null;
  activePurchaseOrders: number;
}

export interface SupplierUpsertRequest {
  name: string;
  taxId: string;
  contactName: string;
  phone: string;
  email: string;
  availableBudget: number;
  categoryIds: number[];
}
