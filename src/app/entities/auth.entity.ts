export type RoleCode = 'ADMIN' | 'CRM' | 'SALES' | 'INVENTORY' | 'SUPPLIERS' | 'PURCHASES' | 'HR';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: RoleCode;
  roleName: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

/** Sesión guardada en el navegador. */
export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}
