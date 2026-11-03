import { HttpParams } from '@angular/common/http';

/** Prefijo de la API. En desarrollo lo atiende el proxy de Angular (proxy.conf.json). */
export const API_URL = '/api';

/** Convierte un objeto de filtros en query params, omitiendo vacíos: { name: 'ana', active: null } → ?name=ana */
export function toHttpParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    params = params.set(key, String(value));
  }
  return params;
}
