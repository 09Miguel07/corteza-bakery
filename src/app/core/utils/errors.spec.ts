import { HttpErrorResponse } from '@angular/common/http';
import { problemMessage } from './errors';

const httpError = (status: number, error: unknown = null) =>
  new HttpErrorResponse({ status, error });

describe('problemMessage', () => {
  it('explains that the API is down when there is no connection', () => {
    expect(problemMessage(httpError(0))).toContain('No hay conexión');
  });

  it('uses the domain message of a 422 (business rule)', () => {
    const error = httpError(422, {
      title: 'Regla de negocio',
      detail: 'Stock insuficiente: hay 40 bultos y se intentan sacar 50.',
    });

    expect(problemMessage(error)).toBe('Stock insuficiente: hay 40 bultos y se intentan sacar 50.');
  });

  it('prefers the first field validation message', () => {
    const error = httpError(400, { title: 'Validación', errors: { TaxId: ['NIT inválido'] } });

    expect(problemMessage(error)).toBe('NIT inválido');
  });

  it('hides technical errors that are not HTTP', () => {
    expect(problemMessage(new Error('boom'))).toBe('Ocurrió un error inesperado.');
  });
});
