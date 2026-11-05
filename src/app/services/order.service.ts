import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL, toHttpParams } from '../core/utils/api';
import {
  CheckoutRequest,
  DiningTableStatus,
  OrderCreateRequest,
  OrderDetail,
  OrderListItem,
  OrderQuery,
  OrderStatus,
  OrderSummary,
  PagedResult,
  SalesInvoiceDetail,
} from '../entities';

/** Peticiones del módulo 02: pedidos, mesas y cobro. */
@Service()
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/orders`;

  list(query: OrderQuery): Observable<PagedResult<OrderListItem>> {
    return this.http.get<PagedResult<OrderListItem>>(this.url, { params: toHttpParams(query) });
  }

  summary(): Observable<OrderSummary> {
    return this.http.get<OrderSummary>(`${this.url}/summary`);
  }

  get(id: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.url}/${id}`);
  }

  /** 422 si la mesa está ocupada o un producto no está a la venta. */
  create(request: OrderCreateRequest): Observable<OrderDetail> {
    return this.http.post<OrderDetail>(this.url, request);
  }

  /** Siguiente paso de cocina o 'Cancelled'. */
  advance(id: number, status: OrderStatus): Observable<OrderDetail> {
    return this.http.patch<OrderDetail>(`${this.url}/${id}/status`, { status });
  }

  requestBill(id: number): Observable<OrderDetail> {
    return this.http.post<OrderDetail>(`${this.url}/${id}/request-bill`, null);
  }

  /** 422 "Efectivo insuficiente" si lo recibido no cubre el total. */
  checkout(id: number, request: CheckoutRequest): Observable<SalesInvoiceDetail> {
    return this.http.post<SalesInvoiceDetail>(`${this.url}/${id}/checkout`, request);
  }

  tables(): Observable<DiningTableStatus[]> {
    return this.http.get<DiningTableStatus[]>(`${API_URL}/dining-tables/status`);
  }
}
