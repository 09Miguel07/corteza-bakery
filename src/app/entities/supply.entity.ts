import { IsoDate, IsoDateTime, PageQuery } from './common.entity';

export type StockStatus = 'Ok' | 'Low' | 'Out';

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  Ok: 'Suficiente',
  Low: 'Por acabarse',
  Out: 'Agotado',
};

export interface SupplyQuery extends PageQuery {
  search?: string;
  categoryId?: number | null;
  stock?: StockStatus | null;
  active?: boolean | null;
}

export interface Supply {
  id: number;
  /** INS-001, lo genera la base de datos. */
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  purchaseUnit: string;
  unitLabel: string;
  unitSizeKg: number | null;
  currentStock: number;
  minStock: number;
  status: StockStatus;
  mainSupplierId: number | null;
  mainSupplierName: string | null;
  isActive: boolean;
}

export interface SupplyUpdateRequest {
  name: string;
  categoryId: number;
  purchaseUnit: string;
  unitLabel: string;
  unitSizeKg: number | null;
  minStock: number;
  mainSupplierId: number | null;
}

export interface SupplyCreateRequest extends SupplyUpdateRequest {
  /** "Cantidad que hay ahora" (pantalla 03.2). */
  initialStock: number;
}

export type MovementType = 'In' | 'Out' | 'Adjustment';

export interface MovementCreateRequest {
  supplyId: number;
  type: MovementType;
  quantity: number;
  supplierId: number | null;
  movementDate: IsoDate | null;
  location: string | null;
  expirationDate: IsoDate | null;
  notes: string | null;
}

export interface InventoryMovement {
  id: number;
  supplyId: number;
  supplyName: string;
  type: MovementType;
  quantity: number;
  stockAfter: number;
  supplierId: number | null;
  supplierName: string | null;
  movementDate: IsoDate;
  location: string | null;
  expirationDate: IsoDate | null;
  notes: string | null;
  createdBy: string;
  createdAt: IsoDateTime;
}
