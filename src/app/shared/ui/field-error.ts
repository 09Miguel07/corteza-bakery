import { Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

/** Muestra el primer error de un campo de Signal Forms cuando el usuario ya pasó por él. */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="field-error" role="alert">{{ text }}</p>
    }
  `,
})
export class FieldError {
  readonly field = input.required<FieldTree<unknown>>();

  protected readonly message = computed(() => {
    const state = this.field()();
    if (!state.touched() || !state.invalid()) return null;
    return state.errors()[0]?.message ?? 'Revisa este campo.';
  });
}

/** Errores generales del formulario (409, 422 o red), los que no pertenecen a un campo. */
@Component({
  selector: 'app-form-errors',
  template: `
    @for (error of rootErrors(); track $index) {
      <div class="alert alert--danger" role="alert">
        <span class="material-symbols-outlined">error</span>{{ error.message }}
      </div>
    }
  `,
})
export class FormErrors {
  readonly form = input.required<FieldTree<unknown>>();

  protected readonly rootErrors = computed(() =>
    this.form()().errors().filter((e) => e.kind === 'server' && e.fieldTree === this.form()),
  );
}
