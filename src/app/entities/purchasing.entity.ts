// Contratos de la fase 4 (Compras). La API de este módulo todavía no existe.
import { IsoDate, IsoDateTime } from './common.entity';

export type PurchaseOrderStatus = 'Draft' | 'Requested' | 'Confirmed' | 'Received' | 'Cancelled';
export type PurchaseInvoiceStatus = 'Pending' | 'Paid';

export interface PurchaseOrderItem {
  supplyId: number;
  supplyName: string;
  quantity: number;
  unitLabel: string;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: number;
  code: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseOrderStatus;
  expectedDeliveryAt: IsoDateTime;
  total: number;
  items: PurchaseOrderItem[];
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
