import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  PagedResult,
  SalesInvoiceDetail,
  SalesInvoiceListItem,
  SalesInvoiceQuery,
} from '../entities';

/** Pantalla 02.6 · Facturas de venta. */
@Service()
export class SalesInvoiceService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/sales-invoices`;

  list(query: SalesInvoiceQuery): Observable<PagedResult<SalesInvoiceListItem>> {
    return this.http.get<PagedResult<SalesInvoiceListItem>>(this.url, {
      params: toHttpParams(query),
    });
  }

  get(id: number): Observable<SalesInvoiceDetail> {
    return this.http.get<SalesInvoiceDetail>(`${this.url}/${id}`);
  }

  void(id: number, reason: string): Observable<SalesInvoiceDetail> {
    return this.http.post<SalesInvoiceDetail>(`${this.url}/${id}/void`, { reason });
  }
}
