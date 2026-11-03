import { Component, input } from '@angular/core';

/** Encabezado de página: antetítulo, título, descripción y acciones (ng-content). */
@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div>
        @if (eyebrow()) {
          <p class="eyebrow">{{ eyebrow() }}</p>
        }
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions"><ng-content /></div>
    </header>
  `,
})
export class PageHeader {
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
