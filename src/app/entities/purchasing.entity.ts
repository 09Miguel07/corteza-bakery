import { IsoDate, IsoDateTime, PageQuery } from './common.entity';

/** Pendiente → Aprobada (descuenta presupuesto) → Recibida (entra a bodega). Cancelada en cualquier punto activo. */
export type PurchaseOrderStatus = 'Pending' | 'Approved' | 'Received' | 'Cancelled';
export type PurchaseInvoiceStatus = 'Pending' | 'Paid';

export interface PurchaseOrderQuery extends PageQuery {
  code?: string;
  supplierId?: number | null;
  status?: PurchaseOrderStatus | null;
}

export interface PurchaseOrderListItem {
  id: number;
  code: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseOrderStatus;
  expectedDeliveryDate: IsoDate;
  total: number;
  itemsCount: number;
  /** "25 bultos de Harina de trigo y 2 más" */
  itemsSummary: string;
}

/** Contadores de la pantalla 05.1. */
export interface PurchaseOrderSummary {
  pending: number;
  approved: number;
  arrivingToday: number;
  arrivingThisWeek: number;
}

export interface PurchaseOrderItem {
  supplyId: number;
  supplyName: string;
  unitLabel: string;
  unitSizeKg: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOrderDetail {
  id: number;
  code: string;
  status: PurchaseOrderStatus;
  supplierId: number;
  supplierName: string;
  supplierTaxId: string;
  supplierPhone: string;
  supplierAvailableBudget: number;
  expectedDeliveryDate: IsoDate;
  total: number;
  notes: string | null;
  quotationCode: string | null;
  requestedAt: IsoDateTime;
  createdBy: string;
  approvedAt: IsoDateTime | null;
  approvedBy: string | null;
  receivedAt: IsoDateTime | null;
  cancelledAt: IsoDateTime | null;
  cancelReason: string | null;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderLineRequest {
  supplyId: number;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrderCreateRequest {
  supplierId: number;
  expectedDeliveryDate: IsoDate;
  notes: string | null;
  items: PurchaseOrderLineRequest[];
}

export interface PurchaseInvoice {
  id: number;
  supplierInvoiceNumber: string;
  supplierId: number;
  supplierName: string;
  description: string | null;
  issueDate: IsoDate;
  dueDate: IsoDate;
  total: number;
  status: PurchaseInvoiceStatus;
  /** Calculado: pendiente y con fecha de vencimiento pasada. */
  isOverdue: boolean;
}
