import { Component, computed, input, output } from '@angular/core';

/** "Mostrando 8 de 46 clientes · Página 1 de 6" + Anterior / números / Siguiente. */
@Component({
  selector: 'app-pagination',
  template: `
    <nav class="pagination" aria-label="Paginación">
      <p class="pagination__info">
        Mostrando {{ shown() }} de {{ total() }} {{ noun() }} · Página {{ page() }} de {{ pages() || 1 }}
      </p>
      @if (pages() > 1) {
        <div class="pagination__controls">
          <button type="button" class="btn btn--ghost btn--sm" [disabled]="page() <= 1" (click)="go(page() - 1)">Anterior</button>
          @for (p of numbers(); track p) {
            <button type="button" class="pagination__page" [class.is-current]="p === page()" (click)="go(p)">{{ p }}</button>
          }
          <button type="button" class="btn btn--ghost btn--sm" [disabled]="page() >= pages()" (click)="go(page() + 1)">Siguiente</button>
        </div>
      }
    </nav>
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pages = input.required<number>();
  readonly total = input.required<number>();
  readonly shown = input.required<number>();
  readonly noun = input('registros');
  readonly pageChange = output<number>();

  /** Hasta 5 números alrededor de la página actual. */
  protected readonly numbers = computed(() => {
    const total = this.pages();
    const start = Math.max(1, Math.min(this.page() - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i);
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.pages() && page !== this.page()) this.pageChange.emit(page);
  }
}
