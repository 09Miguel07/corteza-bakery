import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  InventoryMovement,
  PagedResult,
  PageQuery,
  Supply,
  SupplyCreateRequest,
  SupplyQuery,
  SupplyUpdateRequest,
} from '../entities';

/** Peticiones del módulo 03 · Inventarios: insumos. */
@Service()
export class SupplyService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/supplies`;

  list(query: SupplyQuery): Observable<PagedResult<Supply>> {
    return this.http.get<PagedResult<Supply>>(this.url, { params: toHttpParams(query) });
  }

  lowStock(): Observable<Supply[]> {
    return this.http.get<Supply[]>(`${this.url}/low-stock`);
  }

  get(id: number): Observable<Supply> {
    return this.http.get<Supply>(`${this.url}/${id}`);
  }

  create(request: SupplyCreateRequest): Observable<Supply> {
    return this.http.post<Supply>(this.url, request);
  }

  update(id: number, request: SupplyUpdateRequest): Observable<Supply> {
    return this.http.put<Supply>(`${this.url}/${id}`, request);
  }

  setActive(id: number, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/${active ? 'activate' : 'deactivate'}`, null);
  }

  movements(id: number, query: PageQuery): Observable<PagedResult<InventoryMovement>> {
    return this.http.get<PagedResult<InventoryMovement>>(`${this.url}/${id}/movements`, { params: toHttpParams(query) });
  }
}
