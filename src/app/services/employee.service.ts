import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  EmployeeDetail,
  EmployeeListItem,
  EmployeeQuery,
  EmployeeSummary,
  EmployeeUpsertRequest,
  PagedResult,
} from '../entities';

/** Peticiones del módulo 06 · Talento Humano: empleados. */
@Service()
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/employees`;

  list(query: EmployeeQuery): Observable<PagedResult<EmployeeListItem>> {
    return this.http.get<PagedResult<EmployeeListItem>>(this.url, { params: toHttpParams(query) });
  }

  summary(): Observable<EmployeeSummary> {
    return this.http.get<EmployeeSummary>(`${this.url}/summary`);
  }

  positions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/positions`);
  }

  get(id: number): Observable<EmployeeDetail> {
    return this.http.get<EmployeeDetail>(`${this.url}/${id}`);
  }

  create(request: EmployeeUpsertRequest): Observable<EmployeeDetail> {
    return this.http.post<EmployeeDetail>(this.url, request);
  }

  update(id: number, request: EmployeeUpsertRequest): Observable<EmployeeDetail> {
    return this.http.put<EmployeeDetail>(`${this.url}/${id}`, request);
  }

  /** Desactivar también le quita el acceso a su usuario (RF-RH-006). */
  setActive(id: number, active: boolean): Observable<void> {
    return this.http.patch<void>(`${this.url}/${id}/${active ? 'activate' : 'deactivate'}`, null);
  }
}
