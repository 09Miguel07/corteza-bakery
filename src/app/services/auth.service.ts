import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { API_URL } from '../core/utils/api';
import { AuthSession, AuthUser, LoginRequest, LoginResponse, RoleCode } from '../entities';

const STORAGE_KEY = 'corteza.session';

/** Ruta de inicio de cada rol: cada persona entra solo a su módulo (pantalla 00.2). */
const HOME_BY_ROLE: Record<RoleCode, string> = {
  ADMIN: '/home',
  CRM: '/customers',
  SALES: '/sales',
  INVENTORY: '/inventory',
  SUPPLIERS: '/suppliers',
  PURCHASES: '/purchases',
  HR: '/hr/employees',
};

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly session = signal<AuthSession | null>(readSession());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly role = computed(() => this.user()?.role ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isAuthenticated = computed(() => {
    const session = this.session();
    return !!session && new Date(session.expiresAt).getTime() > Date.now();
  });

  login(request: LoginRequest): Observable<AuthUser> {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, request).pipe(
      tap(({ token, expiresAt, user }) => this.setSession({ token, expiresAt, user })),
      map((response) => response.user),
    );
  }

  /** Confirma con el servidor que el usuario sigue activo (si fue desvinculado, responde 401). */
  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${API_URL}/auth/me`).pipe(
      tap((user) => {
        const current = this.session();
        if (current) this.setSession({ ...current, user });
      }),
    );
  }

  logout(redirect = true): void {
    this.setSession(null);
    if (redirect) void this.router.navigate(['/login']);
  }

  hasRole(...roles: RoleCode[]): boolean {
    const role = this.role();
    return !!role && (role === 'ADMIN' || roles.includes(role));
  }

  homeRoute(): string {
    const role = this.role();
    return role ? HOME_BY_ROLE[role] : '/login';
  }

  private setSession(session: AuthSession | null): void {
    this.session.set(session);
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Navegador sin almacenamiento disponible: la sesión vive solo en memoria.
    }
  }
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    return new Date(session.expiresAt).getTime() > Date.now() ? session : null;
  } catch {
    return null;
  }
}
