import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  CustomerCreateRequest,
  CustomerDetail,
  CustomerListItem,
  CustomerQuery,
  CustomerUpdateRequest,
  PagedResult,
} from '../entities';

/** Peticiones del módulo 01 · CRM (Clientes). */
@Service()
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/customers`;

  list(query: CustomerQuery): Observable<PagedResult<CustomerListItem>> {
    return this.http.get<PagedResult<CustomerListItem>>(this.url, { params: toHttpParams(query) });
  }

  get(id: number): Observable<CustomerDetail> {
    return this.http.get<CustomerDetail>(`${this.url}/${id}`);
  }

  create(request: CustomerCreateRequest): Observable<CustomerDetail> {
    return this.http.post<CustomerDetail>(this.url, request);
  }

  update(id: number, request: CustomerUpdateRequest): Observable<CustomerDetail> {
    return this.http.put<CustomerDetail>(`${this.url}/${id}`, request);
  }

  setActive(id: number, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/${active ? 'activate' : 'deactivate'}`, null);
  }
}
