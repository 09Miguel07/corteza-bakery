import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../core/utils/api';
import { ReportOverview, ReportRange } from '../entities';

/** Pantalla 07.1 · Reportes del administrador. */
@Service()
export class ReportService {
  private readonly http = inject(HttpClient);

  overview(range: ReportRange): Observable<ReportOverview> {
    return this.http.get<ReportOverview>(`${API_URL}/reports/overview`, { params: { range } });
  }
}
