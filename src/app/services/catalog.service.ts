import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../core/utils/api';
import { DashboardSummary, Product } from '../entities';

/** Productos de venta y contadores del administrador. */
@Service()
export class CatalogService {
  private readonly http = inject(HttpClient);

  products(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_URL}/products`);
  }

  dashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${API_URL}/dashboard/summary`);
  }
}
