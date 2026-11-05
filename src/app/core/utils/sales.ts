import { OrderStatus, PaymentMethod, ServiceType, TableState } from '../../entities';
import { BadgeTone } from '../../shared/ui/status-badge';

interface StatusView {
  label: string;
  tone: BadgeTone;
}

export const ORDER_STATUS: Record<OrderStatus, StatusView> = {
  Received: { label: 'Recibido', tone: 'neutral' },
  Preparing: { label: 'En preparación', tone: 'warning' },
  Ready: { label: 'Listo', tone: 'success' },
  Delivered: { label: 'Entregado', tone: 'neutral' },
  Cancelled: { label: 'Cancelado', tone: 'danger' },
};

export const TABLE_STATE: Record<TableState, StatusView> = {
  Free: { label: 'Libre', tone: 'success' },
  Occupied: { label: 'Ocupada', tone: 'warning' },
  AwaitingPayment: { label: 'Por cobrar', tone: 'danger' },
};

export const PAYMENT_METHOD: Record<PaymentMethod, { label: string; icon: string }> = {
  Cash: { label: 'Efectivo', icon: 'payments' },
  Card: { label: 'Tarjeta', icon: 'credit_card' },
  Transfer: { label: 'Transferencia', icon: 'qr_code_2' },
};

export const SERVICE_TYPE: Record<ServiceType, string> = {
  DineIn: 'En mesa',
  Takeaway: 'Para llevar',
};

/** Texto del botón que avanza el pedido al siguiente paso de cocina. */
export const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  Received: 'Empezar a preparar',
  Preparing: 'Marcar listo',
  Ready: 'Marcar entregado',
};

const FLOW: Partial<Record<OrderStatus, OrderStatus>> = {
  Received: 'Preparing',
  Preparing: 'Ready',
  Ready: 'Delivered',
};

/** Mismo flujo que Order.AdvanceTo en el dominio: no se salta pasos. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  return FLOW[status] ?? null;
}

export function canCancel(order: { status: OrderStatus; isClosed: boolean }): boolean {
  return !order.isClosed && order.status !== 'Delivered' && order.status !== 'Cancelled';
}

export interface CartLine {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

export function addToCart(
  cart: CartLine[],
  product: { id: number; name: string; price: number },
): CartLine[] {
  const existing = cart.find((l) => l.productId === product.id);
  return existing
    ? cart.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l))
    : [
        ...cart,
        { productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 },
      ];
}

/** Cantidad 0 o menos quita el producto. */
export function setQuantity(cart: CartLine[], productId: number, quantity: number): CartLine[] {
  return quantity <= 0
    ? cart.filter((l) => l.productId !== productId)
    : cart.map((l) => (l.productId === productId ? { ...l, quantity } : l));
}

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
}

/** Cambio a devolver, o null si el efectivo no alcanza (la API responde lo mismo con 422). */
export function changeFor(total: number, received: number | null): number | null {
  return received == null || received < total ? null : received - total;
}

const BILLS = [5_000, 10_000, 20_000, 50_000, 100_000];

/** Botones rápidos de efectivo: el valor exacto y los billetes que lo cubren (máximo 3). */
export function quickCash(total: number): number[] {
  const rounded = [5_000, 10_000].map((step) => Math.ceil(total / step) * step);
  const roundUp = [...rounded, ...BILLS].filter((v) => v > total);
  return [total, ...[...new Set(roundUp)].sort((a, b) => a - b).slice(0, 3)];
}

export const PRODUCT_CATEGORY: Record<'Bakery' | 'Pastry' | 'Drink' | 'Dessert', string> = {
  Bakery: 'Panadería',
  Pastry: 'Pastelería',
  Drink: 'Bebidas',
  Dessert: 'Postres',
};
