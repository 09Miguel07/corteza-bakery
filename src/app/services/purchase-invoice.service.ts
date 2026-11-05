import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  PagedResult,
  PurchaseInvoice,
  PurchaseInvoiceCreateRequest,
  PurchaseInvoiceQuery,
  PurchaseInvoiceSummary,
} from '../entities';

/** Pantalla 05.4 · Facturas de compra. */
@Service()
export class PurchaseInvoiceService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/purchase-invoices`;

  list(query: PurchaseInvoiceQuery): Observable<PagedResult<PurchaseInvoice>> {
    return this.http.get<PagedResult<PurchaseInvoice>>(this.url, { params: toHttpParams(query) });
  }

  summary(): Observable<PurchaseInvoiceSummary> {
    return this.http.get<PurchaseInvoiceSummary>(`${this.url}/summary`);
  }

  /** 409 si el proveedor ya tiene registrada esa factura. */
  create(request: PurchaseInvoiceCreateRequest): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(this.url, request);
  }

  pay(id: number): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(`${this.url}/${id}/pay`, null);
  }
}
