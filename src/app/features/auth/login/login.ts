import { Component, inject, isDevMode, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { serverErrors } from '../../../core/utils/errors';
import { LoginRequest } from '../../../entities';
import { AuthService } from '../../../services/auth.service';
import { FieldError, FormErrors } from '../../../shared/ui/field-error';

/** Pantalla 00.1 · Iniciar sesión. */
@Component({
  selector: 'app-login',
  imports: [FormField, FieldError, FormErrors],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export default class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly isDev = isDevMode();

  protected readonly model = signal<LoginRequest>({ username: '', password: '' });
  protected readonly form = form(this.model, (p) => {
    required(p.username, { message: 'Escribe tu usuario o correo.' });
    required(p.password, { message: 'Escribe tu contraseña.' });
  });

  /** Usuarios de demostración del seed (solo se muestran en desarrollo). */
  protected readonly demoUsers = [
    { username: 'laura.gomez', role: 'Administrador' },
    { username: 'andres.pardo', role: 'CRM' },
    { username: 'ana.torres', role: 'Inventarios' },
    { username: 'camila.ortiz', role: 'Proveedores' },
    { username: 'paula.gomez', role: 'Talento Humano' },
    { username: 'sofia.diaz', role: 'Ventas' },
    { username: 'diego.rojas', role: 'Compras' },
  ];

  protected async signIn(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.form, async () => {
      try {
        await firstValueFrom(this.auth.login(this.model()));
        await this.router.navigateByUrl(this.auth.homeRoute());
        return undefined;
      } catch (error) {
        return serverErrors(this.form, error);
      }
    });
  }

  protected useDemo(username: string): void {
    this.model.set({ username, password: 'Corteza2026*' });
  }
}
