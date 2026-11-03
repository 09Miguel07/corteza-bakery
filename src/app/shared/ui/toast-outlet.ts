import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-toast-outlet',
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.tone">
          <span class="material-symbols-outlined">
            {{ toast.tone === 'success' ? 'check_circle' : toast.tone === 'error' ? 'error' : 'info' }}
          </span>
          <span>{{ toast.message }}</span>
          <button type="button" class="toast__close" aria-label="Cerrar" (click)="toasts.dismiss(toast.id)">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastOutlet {
  protected readonly toasts = inject(ToastService);
}
