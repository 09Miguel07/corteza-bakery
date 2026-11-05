import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  PagedResult,
  SupplierDetail,
  SupplierListItem,
  SupplierQuery,
  SupplierUpsertRequest,
} from '../entities';

/** Peticiones del módulo 04 · Proveedores. */
@Service()
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/suppliers`;

  list(query: SupplierQuery): Observable<PagedResult<SupplierListItem>> {
    return this.http.get<PagedResult<SupplierListItem>>(this.url, { params: toHttpParams(query) });
  }

  get(id: number): Observable<SupplierDetail> {
    return this.http.get<SupplierDetail>(`${this.url}/${id}`);
  }

  create(request: SupplierUpsertRequest): Observable<SupplierDetail> {
    return this.http.post<SupplierDetail>(this.url, request);
  }

  update(id: number, request: SupplierUpsertRequest): Observable<SupplierDetail> {
    return this.http.put<SupplierDetail>(`${this.url}/${id}`, request);
  }

  /** Falla con 422 si el proveedor tiene órdenes de compra activas. */
  setActive(id: number, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/${active ? 'activate' : 'deactivate'}`, null);
  }
}
