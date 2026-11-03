import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../ui/toast.service';
import { API_URL } from '../utils/api';

/** Agrega el JWT a las peticiones de la API y cierra la sesión si el servidor responde 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  const isApi = req.url.startsWith(API_URL);
  const isLogin = req.url.endsWith('/auth/login');
  const token = auth.token();

  const request = isApi && token && !isLogin ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApi && !isLogin) {
        toast.info('Tu sesión terminó. Inicia sesión de nuevo.');
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
