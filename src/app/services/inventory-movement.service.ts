import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../core/utils/api';
import { InventoryMovement, MovementCreateRequest } from '../entities';

/** Entradas y salidas de bodega (pantalla 03.3). */
@Service()
export class InventoryMovementService {
  private readonly http = inject(HttpClient);

  /** Falla con 422 "Stock insuficiente" si una salida supera la existencia. */
  register(request: MovementCreateRequest): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(`${API_URL}/inventory-movements`, request);
  }
}
