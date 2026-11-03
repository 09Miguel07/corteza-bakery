import { PurchaseOrderStatus, QuotationStatus, RfqStatus } from '../../entities';
import { BadgeTone } from '../../shared/ui/status-badge';

interface StatusView {
  label: string;
  tone: BadgeTone;
}

export const PURCHASE_ORDER_STATUS: Record<PurchaseOrderStatus, StatusView> = {
  Pending: { label: 'Pendiente', tone: 'warning' },
  Approved: { label: 'Aprobada', tone: 'success' },
  Received: { label: 'Recibida', tone: 'neutral' },
  Cancelled: { label: 'Cancelada', tone: 'danger' },
};

export const RFQ_STATUS: Record<RfqStatus, StatusView> = {
  Open: { label: 'Abierta', tone: 'warning' },
  Closed: { label: 'Cerrada', tone: 'success' },
  Cancelled: { label: 'Cancelada', tone: 'danger' },
};

export const QUOTATION_STATUS: Record<QuotationStatus, StatusView> = {
  Received: { label: 'Recibida', tone: 'neutral' },
  Selected: { label: 'Seleccionada', tone: 'success' },
  Rejected: { label: 'Rechazada', tone: 'danger' },
};

/** Mismo texto que InvalidAmountException del dominio. */
export const INVALID_AMOUNT = 'Monto inválido: debe ser mayor que cero.';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Total de una orden en edición. Las líneas a medio escribir no suman. */
export function linesTotal(lines: { quantity: number | null; unitPrice: number | null }[]): number {
  return round2(lines.reduce((sum, l) => sum + (l.quantity ?? 0) * (l.unitPrice ?? 0), 0));
}

/** La misma regla que PurchaseOrder.Approve: el total no puede pasar del presupuesto disponible. */
export function budgetCheck(available: number, total: number): { ok: boolean; remaining: number; shortBy: number } {
  const ok = total <= available;
  return { ok, remaining: ok ? round2(available - total) : available, shortBy: ok ? 0 : round2(total - available) };
}

/** Qué botones muestra el detalle de la orden (05.3) según su estado. */
export function orderActions(status: PurchaseOrderStatus): { approve: boolean; cancel: boolean; receive: boolean } {
  return {
    approve: status === 'Pending',
    cancel: status === 'Pending' || status === 'Approved',
    receive: status === 'Approved',
  };
}

/** Total de una cotización: cantidades de la solicitud × precios que ofrece el proveedor. */
export function quotationTotal(items: { supplyId: number; quantity: number }[], prices: Record<number, number | null>): number {
  return round2(items.reduce((sum, i) => sum + i.quantity * (prices[i.supplyId] ?? 0), 0));
}

/** Validación previa en pantalla; la API responde lo mismo (422). */
export function invalidPriceMessage(prices: Record<number, number | null>): string | null {
  return Object.values(prices).some((p) => p == null || p <= 0) ? INVALID_AMOUNT : null;
}
