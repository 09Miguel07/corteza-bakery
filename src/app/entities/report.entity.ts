import { IsoDate } from './common.entity';
import { PaymentMethod } from './sales.entity';
import { StockStatus } from './supply.entity';

export type ReportRange = 'Today' | 'Week' | 'Month';

/** Pantalla 07.1 · ¿Cómo va la panadería? */
export interface ReportOverview {
  range: ReportRange;
  from: IsoDate;
  to: IsoDate;
  salesTotal: number;
  invoicesCount: number;
  averageTicket: number;
  ordersDelivered: number;
  ordersCancelled: number;
  byPaymentMethod: { method: PaymentMethod; count: number; total: number }[];
  last7Days: { date: IsoDate; total: number }[];
  topProducts: { productName: string; quantity: number; revenue: number }[];
  criticalSupplies: { id: number; name: string; currentStock: number; minStock: number; unitLabel: string; status: StockStatus }[];
  purchaseInvoicesPending: number;
  purchaseInvoicesPendingTotal: number;
  purchaseInvoicesOverdue: number;
  activeEmployees: number;
  lastPayrollNet: number | null;
}
