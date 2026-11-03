import { Component, input } from '@angular/core';
import { PageHeader } from '../../shared/ui/page-header';

/** Módulos de fases siguientes del plan. Los datos llegan por `data` de la ruta. */
@Component({
  selector: 'app-coming-soon',
  imports: [PageHeader],
  template: `
    <app-page-header [eyebrow]="'Fase ' + phase() + ' del plan'" [title]="module()" />
    <section class="card soon">
      <span class="material-symbols-outlined">construction</span>
      <h2>Este módulo llega en la fase {{ phase() }}</h2>
      <p class="muted">Pantallas del mockup: {{ screens() }}.</p>
      <p class="subtle">
        El modelo de datos ya existe en la base. Faltan los endpoints de la API y estas pantallas
        (ver <code>docs/plan-implementacion.md</code>, sección 7).
      </p>
    </section>
  `,
  styles: `
    .soon { display: grid; justify-items: center; gap: 0.6rem; padding: 3rem 1.5rem; text-align: center; }
    .soon .material-symbols-outlined { font-size: 44px; color: var(--color-primary); }
  `,
})
export default class ComingSoon {
  readonly module = input('');
  readonly phase = input(0);
  readonly screens = input('');
}
