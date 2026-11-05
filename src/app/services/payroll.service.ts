import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../core/utils/api';
import { PayrollPeriodCreateRequest, PayrollPeriodDetail, PayrollPeriodListItem, PayslipDetail } from '../entities';

/** Módulo 06 · Nómina: periodos (06.0) y comprobantes (06.3). */
@Service()
export class PayrollService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/payroll-periods`;

  list(year: number | null): Observable<PayrollPeriodListItem[]> {
    const params = year ? new HttpParams().set('year', year) : undefined;
    return this.http.get<PayrollPeriodListItem[]>(this.url, { params });
  }

  get(id: number): Observable<PayrollPeriodDetail> {
    return this.http.get<PayrollPeriodDetail>(`${this.url}/${id}`);
  }

  /** 409 si el periodo se cruza con otro. */
  create(request: PayrollPeriodCreateRequest): Observable<PayrollPeriodDetail> {
    return this.http.post<PayrollPeriodDetail>(this.url, request);
  }

  generate(id: number): Observable<PayrollPeriodDetail> {
    return this.http.post<PayrollPeriodDetail>(`${this.url}/${id}/generate`, null);
  }

  approve(id: number): Observable<PayrollPeriodDetail> {
    return this.http.post<PayrollPeriodDetail>(`${this.url}/${id}/approve`, null);
  }

  pay(id: number): Observable<PayrollPeriodDetail> {
    return this.http.post<PayrollPeriodDetail>(`${this.url}/${id}/pay`, null);
  }

  payslip(id: number): Observable<PayslipDetail> {
    return this.http.get<PayslipDetail>(`${API_URL}/payslips/${id}`);
  }
}
