import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  IsoDate,
  PagedResult,
  QuotationCreateRequest,
  RfqCreateRequest,
  RfqDetail,
  RfqListItem,
  RfqQuery,
  SelectQuotationResult,
} from '../entities';

/** Peticiones de solicitudes de cotización y cotizaciones de proveedores. */
@Service()
export class QuotationRequestService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/quotation-requests`;

  list(query: RfqQuery): Observable<PagedResult<RfqListItem>> {
    return this.http.get<PagedResult<RfqListItem>>(this.url, { params: toHttpParams(query) });
  }

  get(id: number): Observable<RfqDetail> {
    return this.http.get<RfqDetail>(`${this.url}/${id}`);
  }

  create(request: RfqCreateRequest): Observable<RfqDetail> {
    return this.http.post<RfqDetail>(this.url, request);
  }

  /** 422 "Monto inválido" o si el proveedor ya cotizó la solicitud. */
  registerQuotation(id: number, request: QuotationCreateRequest): Observable<RfqDetail> {
    return this.http.post<RfqDetail>(`${this.url}/${id}/quotations`, request);
  }

  /** Cierra la solicitud, rechaza las demás cotizaciones y crea la orden de compra pendiente. */
  select(id: number, quotationId: number, expectedDeliveryDate: IsoDate | null): Observable<SelectQuotationResult> {
    return this.http.post<SelectQuotationResult>(`${this.url}/${id}/quotations/${quotationId}/select`, { expectedDeliveryDate });
  }

  cancel(id: number): Observable<void> {
    return this.http.post<void>(`${this.url}/${id}/cancel`, null);
  }
}
