// Contratos de la fase 3 (Facturación y Ventas). La API de estos módulos todavía no existe:
// se dejan definidos para que el front y el back los implementen sobre la misma forma.
import { IsoDateTime } from './common.entity';

export type ServiceType = 'DineIn' | 'Takeaway';
export type OrderStatus = 'Received' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Card' | 'Transfer';
export type SalesInvoiceStatus = 'Paid' | 'Voided';
export type TableState = 'Free' | 'Occupied' | 'BillRequested';

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  code: string;
  customerId: number | null;
  customerName: string | null;
  serviceType: ServiceType;
  tableNumber: number | null;
  status: OrderStatus;
  servedBy: string;
  total: number;
  createdAt: IsoDateTime;
  items: OrderItem[];
}

export interface DiningTableStatus {
  id: number;
  number: number;
  capacity: number;
  state: TableState;
  openOrderId: number | null;
  customerName: string | null;
  total: number | null;
}

export interface SalesInvoice {
  id: number;
  number: string;
  orderCode: string;
  customerName: string | null;
  customerDocument: string | null;
  serviceType: ServiceType;
  tableNumber: number | null;
  total: number;
  paymentMethod: PaymentMethod;
  status: SalesInvoiceStatus;
  issuedAt: IsoDateTime;
}
