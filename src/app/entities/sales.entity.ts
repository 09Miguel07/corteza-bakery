import { IsoDate, IsoDateTime, PageQuery } from './common.entity';

export type ServiceType = 'DineIn' | 'Takeaway';
export type OrderStatus = 'Received' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Card' | 'Transfer';
export type SalesInvoiceStatus = 'Paid' | 'Voided';
/** Derivado del pedido abierto de la mesa (pantalla 02.4). */
export type TableState = 'Free' | 'Occupied' | 'AwaitingPayment';

export interface OrderQuery extends PageQuery {
  code?: string;
  status?: OrderStatus | null;
  serviceType?: ServiceType | null;
  open?: boolean | null;
}

export interface OrderListItem {
  id: number;
  code: string;
  serviceType: ServiceType;
  tableNumber: number | null;
  customerName: string | null;
  status: OrderStatus;
  total: number;
  itemsCount: number;
  itemsSummary: string;
  createdAt: IsoDateTime;
  billRequested: boolean;
  isClosed: boolean;
  invoiceNumber: string | null;
}

export interface OrderSummary {
  open: number;
  preparing: number;
  ready: number;
  salesToday: number;
  invoicesToday: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderDetail {
  id: number;
  code: string;
  serviceType: ServiceType;
  diningTableId: number | null;
  tableNumber: number | null;
  customerId: number | null;
  customerName: string | null;
  status: OrderStatus;
  total: number;
  servedBy: string;
  createdAt: IsoDateTime;
  preparingAt: IsoDateTime | null;
  readyAt: IsoDateTime | null;
  deliveredAt: IsoDateTime | null;
  billRequestedAt: IsoDateTime | null;
  closedAt: IsoDateTime | null;
  invoiceId: number | null;
  invoiceNumber: string | null;
  items: OrderItem[];
}

export interface OrderCreateRequest {
  serviceType: ServiceType;
  diningTableId: number | null;
  customerId: number | null;
  items: { productId: number; quantity: number }[];
}

export interface CheckoutRequest {
  paymentMethod: PaymentMethod;
  amountReceived: number | null;
}

export interface DiningTableStatus {
  id: number;
  number: number;
  capacity: number;
  state: TableState;
  orderId: number | null;
  orderCode: string | null;
  orderTotal: number | null;
  openedAt: IsoDateTime | null;
}

export interface SalesInvoiceQuery extends PageQuery {
  number?: string;
  status?: SalesInvoiceStatus | null;
  paymentMethod?: PaymentMethod | null;
  from?: IsoDate | null;
  to?: IsoDate | null;
}

export interface SalesInvoiceListItem {
  id: number;
  number: string;
  orderId: number;
  orderCode: string;
  customerName: string | null;
  total: number;
  paymentMethod: PaymentMethod;
  status: SalesInvoiceStatus;
  issuedAt: IsoDateTime;
}

export interface SalesInvoiceDetail extends SalesInvoiceListItem {
  serviceType: ServiceType;
  tableNumber: number | null;
  customerDocument: string | null;
  amountReceived: number | null;
  changeGiven: number | null;
  issuedBy: string;
  voidReason: string | null;
  voidedAt: IsoDateTime | null;
  items: OrderItem[];
}
