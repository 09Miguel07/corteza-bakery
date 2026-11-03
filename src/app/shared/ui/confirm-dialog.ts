import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../core/ui/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  host: { '(document:keydown.escape)': 'confirm.pending() && confirm.close(false)' },
  template: `
    @if (confirm.pending(); as dialog) {
      <div class="dialog-backdrop" (click)="confirm.close(false)"></div>
      <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{{ dialog.title }}</h2>
        <p>{{ dialog.message }}</p>
        @if (dialog.detail) {
          <p class="dialog__detail">{{ dialog.detail }}</p>
        }
        <div class="dialog__actions">
          <button type="button" class="btn btn--ghost" (click)="confirm.close(false)">Cancelar</button>
          <button
            type="button"
            class="btn"
            [class.btn--danger]="dialog.tone !== 'primary'"
            [class.btn--primary]="dialog.tone === 'primary'"
            (click)="confirm.close(true)"
          >
            {{ dialog.confirmText ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
}
