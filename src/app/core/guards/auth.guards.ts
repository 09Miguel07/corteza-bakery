import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { RoleCode } from '../../entities';
import { AuthService } from '../../services/auth.service';

/** Exige sesión iniciada. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() || inject(Router).parseUrl('/login');
};

/** Si ya hay sesión, el login manda al módulo del usuario. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return !auth.isAuthenticated() || inject(Router).parseUrl(auth.homeRoute());
};

/**
 * Deja entrar solo a los roles indicados (el administrador entra a todo).
 * Solo esconde pantallas: la API valida el rol en cada endpoint.
 */
export const roleGuard =
  (...roles: RoleCode[]): CanMatchFn =>
  () => {
    const auth = inject(AuthService);
    return auth.hasRole(...roles) || inject(Router).parseUrl(auth.homeRoute());
  };
