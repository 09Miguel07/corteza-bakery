import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  IsoDate,
  PagedResult,
  PurchaseOrderCreateRequest,
  PurchaseOrderDetail,
  PurchaseOrderListItem,
  PurchaseOrderQuery,
  PurchaseOrderSummary,
} from '../entities';

/** Peticiones del módulo 05 · Compras (órdenes de compra). */
@Service()
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/purchase-orders`;

  list(query: PurchaseOrderQuery): Observable<PagedResult<PurchaseOrderListItem>> {
    return this.http.get<PagedResult<PurchaseOrderListItem>>(this.url, { params: toHttpParams(query) });
  }

  summary(): Observable<PurchaseOrderSummary> {
    return this.http.get<PurchaseOrderSummary>(`${this.url}/summary`);
  }

  get(id: number): Observable<PurchaseOrderDetail> {
    return this.http.get<PurchaseOrderDetail>(`${this.url}/${id}`);
  }

  /** 422 si el proveedor está inactivo o una línea es inválida. */
  create(request: PurchaseOrderCreateRequest): Observable<PurchaseOrderDetail> {
    return this.http.post<PurchaseOrderDetail>(this.url, request);
  }

  /** 422 "Presupuesto insuficiente" o "ya está aprobada". */
  approve(id: number): Observable<PurchaseOrderDetail> {
    return this.http.post<PurchaseOrderDetail>(`${this.url}/${id}/approve`, null);
  }

  cancel(id: number, reason: string): Observable<PurchaseOrderDetail> {
    return this.http.post<PurchaseOrderDetail>(`${this.url}/${id}/cancel`, { reason });
  }

  /** Suma cada línea al stock de su insumo. */
  receive(id: number, receivedDate: IsoDate | null): Observable<PurchaseOrderDetail> {
    return this.http.post<PurchaseOrderDetail>(`${this.url}/${id}/receive`, { receivedDate });
  }
}
