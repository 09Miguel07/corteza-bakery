import { addToCart, canCancel, cartTotal, changeFor, nextStatus, ORDER_STATUS, quickCash, setQuantity, TABLE_STATE } from './sales';

const bread = { id: 1, name: 'Pan francés', price: 1_500 };
const coffee = { id: 2, name: 'Café con leche', price: 3_800 };

describe('sales rules (UI)', () => {
  it('follows the kitchen flow one step at a time', () => {
    expect(nextStatus('Received')).toBe('Preparing');
    expect(nextStatus('Preparing')).toBe('Ready');
    expect(nextStatus('Ready')).toBe('Delivered');
    expect(nextStatus('Delivered')).toBeNull();
    expect(nextStatus('Cancelled')).toBeNull();
  });

  it('only cancels open orders that were not delivered', () => {
    expect(canCancel({ status: 'Preparing', isClosed: false })).toBe(true);
    expect(canCancel({ status: 'Delivered', isClosed: false })).toBe(false);
    expect(canCancel({ status: 'Ready', isClosed: true })).toBe(false);
  });

  it('adds products to the cart, joining repeated ones', () => {
    let cart = addToCart([], bread);
    cart = addToCart(cart, coffee);
    cart = addToCart(cart, bread);

    expect(cart).toEqual([
      { productId: 1, name: 'Pan francés', unitPrice: 1_500, quantity: 2 },
      { productId: 2, name: 'Café con leche', unitPrice: 3_800, quantity: 1 },
    ]);
    expect(cartTotal(cart)).toBe(6_800);
  });

  it('removes a product when its quantity reaches zero', () => {
    const cart = addToCart([], bread);
    expect(setQuantity(cart, 1, 0)).toEqual([]);
    expect(setQuantity(cart, 1, 4)[0].quantity).toBe(4);
  });

  it('computes the change only when the cash covers the total', () => {
    expect(changeFor(13_600, 20_000)).toBe(6_400);
    expect(changeFor(13_600, 13_600)).toBe(0);
    expect(changeFor(13_600, 10_000)).toBeNull();
    expect(changeFor(13_600, null)).toBeNull();
  });

  it('suggests the usual bills for a cash payment', () => {
    expect(quickCash(13_600)).toEqual([13_600, 15_000, 20_000, 50_000]);
    expect(quickCash(50_000)).toEqual([50_000, 100_000]);
  });

  it('speaks Spanish in labels', () => {
    expect(ORDER_STATUS.Preparing.label).toBe('En preparación');
    expect(TABLE_STATE.AwaitingPayment.label).toBe('Por cobrar');
    expect(TABLE_STATE.Free.tone).toBe('success');
  });
});
