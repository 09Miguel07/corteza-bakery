import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { API_URL } from '../core/utils/api';
import { CategoryRef } from '../entities';

/** Categorías de insumo (Harinas, Lácteos…). Casi no cambian: se piden una vez por sesión. */
@Service()
export class SupplyCategoryService {
  private readonly http = inject(HttpClient);
  private readonly categories$ = this.http
    .get<CategoryRef[]>(`${API_URL}/supply-categories`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  list(): Observable<CategoryRef[]> {
    return this.categories$;
  }
}
