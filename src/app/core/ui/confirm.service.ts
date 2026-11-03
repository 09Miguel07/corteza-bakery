import { Service, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  detail?: string;
  confirmText?: string;
  tone?: 'danger' | 'primary';
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (accepted: boolean) => void;
}

/** Diálogo de confirmación único (lo pinta el shell). `await confirm.ask({...})` devuelve true/false. */
@Service()
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    this.pending()?.resolve(false);
    return new Promise((resolve) => this.pending.set({ ...options, resolve }));
  }

  close(accepted: boolean): void {
    this.pending()?.resolve(accepted);
    this.pending.set(null);
  }
}
