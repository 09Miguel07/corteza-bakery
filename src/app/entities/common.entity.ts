/** Respuesta paginada de la API: `{ items, total, page, pageSize, totalPages }`. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

/** Filtro de estado de las listas: true = activos, false = inactivos, null = todos. */
export type ActiveFilter = boolean | null;

/** Error estándar de la API (RFC 7807). `errors` trae los mensajes por campo cuando hay validación. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

/** Fecha sin hora tal como la manda .NET (`DateOnly`): "2026-10-31". */
export type IsoDate = string;

/** Fecha con hora en UTC (`DateTime`): "2026-10-31T14:05:00Z". */
export type IsoDateTime = string;
