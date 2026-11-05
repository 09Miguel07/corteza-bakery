import {
  budgetCheck,
  invalidPriceMessage,
  linesTotal,
  orderActions,
  PURCHASE_ORDER_STATUS,
  QUOTATION_STATUS,
  quotationTotal,
  RFQ_STATUS,
  dueLabel,
} from './purchasing';

describe('purchasing rules (UI)', () => {
  describe('linesTotal', () => {
    it('adds quantity × unit price of every line', () => {
      expect(
        linesTotal([
          { quantity: 25, unitPrice: 50_000 },
          { quantity: 2.5, unitPrice: 18_000 },
        ]),
      ).toBe(1_295_000);
    });

    it('is zero for an empty order', () => {
      expect(linesTotal([])).toBe(0);
    });

    it('ignores lines still being typed (empty quantity or price)', () => {
      expect(
        linesTotal([
          { quantity: 10, unitPrice: null },
          { quantity: null, unitPrice: 5 },
        ]),
      ).toBe(0);
    });
  });

  describe('budgetCheck', () => {
    it('allows approving when the supplier budget covers the order', () => {
      expect(budgetCheck(10_000_000, 1_250_000)).toEqual({
        ok: true,
        remaining: 8_750_000,
        shortBy: 0,
      });
    });

    it('allows the exact budget (limit case)', () => {
      expect(budgetCheck(1_250_000, 1_250_000).ok).toBe(true);
    });

    it('blocks and says how much is missing when the order exceeds the budget', () => {
      expect(budgetCheck(1_000_000, 1_250_000)).toEqual({
        ok: false,
        remaining: 1_000_000,
        shortBy: 250_000,
      });
    });
  });

  describe('orderActions', () => {
    it('lets a pending order be approved or cancelled, not received', () => {
      expect(orderActions('Pending')).toEqual({ approve: true, cancel: true, receive: false });
    });

    it('lets an approved order be received or cancelled', () => {
      expect(orderActions('Approved')).toEqual({ approve: false, cancel: true, receive: true });
    });

    it.each(['Received', 'Cancelled'] as const)('closes every action on a %s order', (status) => {
      expect(orderActions(status)).toEqual({ approve: false, cancel: false, receive: false });
    });
  });

  describe('quotations', () => {
    it('totals a quotation from the requested quantities and the offered unit prices', () => {
      const items = [
        { supplyId: 1, quantity: 25 },
        { supplyId: 2, quantity: 10 },
      ];

      expect(quotationTotal(items, { 1: 50_000, 2: 7_500 })).toBe(1_325_000);
    });

    it('rejects zero or negative prices with the domain message', () => {
      expect(invalidPriceMessage({ 1: 50_000, 2: 0 })).toBe(
        'Monto inválido: debe ser mayor que cero.',
      );
      expect(invalidPriceMessage({ 1: -100 })).toBe('Monto inválido: debe ser mayor que cero.');
    });

    it('accepts positive prices', () => {
      expect(invalidPriceMessage({ 1: 50_000 })).toBeNull();
    });
  });

  describe('labels', () => {
    it('speaks the same Spanish as the scenarios', () => {
      expect(PURCHASE_ORDER_STATUS.Pending.label).toBe('Pendiente');
      expect(PURCHASE_ORDER_STATUS.Approved.tone).toBe('success');
      expect(RFQ_STATUS.Closed.label).toBe('Cerrada');
      expect(QUOTATION_STATUS.Selected.label).toBe('Seleccionada');
    });
  });
});

describe('dueLabel (facturas de compra)', () => {
  const today = '2026-11-04';

  it('describes how far the due date is', () => {
    expect(dueLabel({ status: 'Pending', dueDate: '2026-11-04' }, today)).toEqual({
      text: 'Vence hoy',
      tone: 'warning',
    });
    expect(dueLabel({ status: 'Pending', dueDate: '2026-11-07' }, today)).toEqual({
      text: 'Vence en 3 días',
      tone: 'neutral',
    });
    expect(dueLabel({ status: 'Pending', dueDate: '2026-11-05' }, today)).toEqual({
      text: 'Vence mañana',
      tone: 'warning',
    });
    expect(dueLabel({ status: 'Pending', dueDate: '2026-11-02' }, today)).toEqual({
      text: 'Vencida hace 2 días',
      tone: 'danger',
    });
    expect(dueLabel({ status: 'Paid', dueDate: '2026-11-02' }, today)).toEqual({
      text: 'Pagada',
      tone: 'success',
    });
  });
});
