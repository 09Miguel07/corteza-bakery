import { emptyLine, linesProblem } from './line-editor';

const line = (supplyId: string, quantity: number | null, unitPrice: number | null = 1000) => ({
  supplyId,
  quantity,
  unitPrice,
});

describe('linesProblem', () => {
  it('requires at least one supply', () => {
    expect(linesProblem([], true)).toBe('Agrega al menos un insumo.');
  });

  it('requires choosing the supply of every line', () => {
    expect(linesProblem([emptyLine()], false)).toBe('Elige el insumo de cada línea.');
  });

  it('does not allow the same supply twice', () => {
    expect(linesProblem([line('1', 5), line('1', 3)], true)).toContain('aparece dos veces');
  });

  it('rejects zero or negative quantities', () => {
    expect(linesProblem([line('1', 0)], false)).toBe('La cantidad debe ser mayor que cero.');
    expect(linesProblem([line('1', -5)], false)).toBe('La cantidad debe ser mayor que cero.');
  });

  it('rejects a zero price only on purchase orders', () => {
    expect(linesProblem([line('1', 5, 0)], true)).toBe('Monto inválido: debe ser mayor que cero.');
    expect(linesProblem([line('1', 5, null)], false)).toBeNull();
  });

  it('accepts complete lines', () => {
    expect(linesProblem([line('1', 25, 50_000), line('2', 10, 7_500)], true)).toBeNull();
  });
});
