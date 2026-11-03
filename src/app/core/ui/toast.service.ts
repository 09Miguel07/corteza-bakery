import { Service, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

/** Avisos cortos en pantalla. No hace peticiones: es estado de UI. */
@Service()
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message, 7000);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(tone: ToastTone, message: string, duration = 4000): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, tone, message }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
