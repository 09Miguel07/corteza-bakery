import { HttpErrorResponse } from '@angular/common/http';
import { FieldTree, ValidationError } from '@angular/forms/signals';
import { ProblemDetails } from '../../entities';

/** Mensaje legible para el usuario a partir de un error HTTP (ProblemDetails de la API). */
export function problemMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Ocurrió un error inesperado.';
  if (error.status === 0)
    return 'No hay conexión con el servidor. Revisa que la API esté encendida.';
  if (error.status === 403) return 'No tienes permiso para hacer esta acción.';

  const problem = error.error as ProblemDetails | null;
  if (problem?.errors) {
    const first = Object.values(problem.errors).flat()[0];
    if (first) return first;
  }
  return problem?.detail ?? problem?.title ?? `Error ${error.status}.`;
}

/**
 * Convierte la respuesta de error de la API en errores de Signal Forms.
 * Los errores por campo ("FirstNames": [...]) se pegan al campo del formulario;
 * el resto (409, 422) queda como error general del formulario.
 * Se devuelve desde la acción de `submit()`.
 */
export function serverErrors(
  form: FieldTree<unknown>,
  error: unknown,
): ValidationError.WithOptionalFieldTree[] {
  const result: ValidationError.WithOptionalFieldTree[] = [];
  const problem =
    error instanceof HttpErrorResponse ? (error.error as ProblemDetails | null) : null;
  const fields = form as unknown as Record<string, FieldTree<unknown> | undefined>;

  for (const [key, messages] of Object.entries(problem?.errors ?? {})) {
    const name = key.replace(/^\$\./, '');
    const field = fields[name.charAt(0).toLowerCase() + name.slice(1)];
    for (const message of messages) {
      result.push(
        field ? { kind: 'server', message, fieldTree: field } : { kind: 'server', message },
      );
    }
  }

  if (result.length === 0) result.push({ kind: 'server', message: problemMessage(error) });
  return result;
}
