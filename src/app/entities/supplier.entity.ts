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
  categoryIds: number[];
}
