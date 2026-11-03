import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { navFor } from '../../core/navigation';
import { AuthService } from '../../services/auth.service';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ToastOutlet } from '../../shared/ui/toast-outlet';

/** Marco de la app: menú lateral por rol + barra superior (mockups "Shell · Menú" y "Shell · Barra"). */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialog, ToastOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly nav = computed(() => navFor(this.auth.role()));
  protected readonly menuOpen = signal(false);

  constructor() {
    // Si el usuario fue desactivado mientras tenía la sesión abierta, la API responde 401 y el interceptor lo saca.
    this.auth.me().pipe(takeUntilDestroyed()).subscribe({ error: () => undefined });

    // En celular el menú se cierra al navegar.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }
}
