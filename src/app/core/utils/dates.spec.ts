import { localToday } from './dates';

describe('localToday', () => {
  afterEach(() => vi.useRealTimers());

  it('uses the local calendar day, not UTC (Colombia at night is already tomorrow in UTC)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 2, 23, 30)); // 2 de noviembre, 11:30 p. m. hora local

    expect(localToday()).toBe('2026-11-02');
  });
});
