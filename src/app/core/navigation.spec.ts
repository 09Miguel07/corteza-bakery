import { navFor } from './navigation';

describe('navFor', () => {
  it('shows every module to the administrator', () => {
    expect(navFor('ADMIN').length).toBe(8);
  });

  it('shows the purchasing officer only Compras', () => {
    expect(navFor('PURCHASES').map((i) => i.route)).toEqual(['/purchases']);
  });

  it('shows nothing without a session', () => {
    expect(navFor(null)).toEqual([]);
  });
});
