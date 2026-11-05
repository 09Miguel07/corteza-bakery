import { toHttpParams } from './api';

describe('toHttpParams', () => {
  it('skips empty filters so the API applies no condition', () => {
    const params = toHttpParams({
      name: 'ana',
      taxId: '',
      categoryId: null,
      active: undefined,
      page: 2,
    });

    expect(params.keys()).toEqual(['name', 'page']);
    expect(params.get('page')).toBe('2');
  });

  it('keeps false because "inactive" is a real filter', () => {
    expect(toHttpParams({ active: false }).get('active')).toBe('false');
  });
});
