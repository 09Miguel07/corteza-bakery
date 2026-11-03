import { IsoDate, IsoDateTime, PageQuery } from './common.entity';

/** Solicitud de cotización (SC-001): se cierra al elegir la cotización ganadora. */
export type RfqStatus = 'Open' | 'Closed' | 'Cancelled';
export type QuotationStatus = 'Received' | 'Selected' | 'Rejected';

export interface RfqQuery extends PageQuery {
  code?: string;
  status?: RfqStatus | null;
}

export interface RfqListItem {
  id: number;
  code: string;
  description: string | null;
  status: RfqStatus;
  responseDeadline: IsoDate;
  itemsCount: number;
  quotationsCount: number;
  lowestTotal: number | null;
  createdAt: IsoDateTime;
}

export interface RfqItem {
  supplyId: number;
  supplyName: string;
  unitLabel: string;
  quantity: number;
}

export interface QuotationItem {
  supplyId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Quotation {
  id: number;
  supplierId: number;
  supplierName: string;
  status: QuotationStatus;
  deliveryDays: number;
  total: number;
  notes: string | null;
  receivedAt: IsoDateTime;
  items: QuotationItem[];
}

export interface RfqDetail {
  id: number;
  code: string;
  description: string | null;
  status: RfqStatus;
  responseDeadline: IsoDate;
  createdAt: IsoDateTime;
  closedAt: IsoDateTime | null;
  createdBy: string;
  items: RfqItem[];
  quotations: Quotation[];
  lowestQuotationId: number | null;
  purchaseOrderId: number | null;
  purchaseOrderCode: string | null;
}

export interface RfqCreateRequest {
  description: string | null;
  responseDeadline: IsoDate;
  items: { supplyId: number; quantity: number }[];
}

export interface QuotationCreateRequest {
  supplierId: number;
  deliveryDays: number;
  notes: string | null;
  prices: { supplyId: number; unitPrice: number }[];
}

export interface SelectQuotationResult {
  purchaseOrderId: number;
  purchaseOrderCode: string;
}
