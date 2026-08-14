import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window === 'undefined') {
    return next(req);
  }

  const router = inject(Router);
  const notification = inject(NzNotificationService);

  const token = window.localStorage.getItem('token');
  const tokenType = window.localStorage.getItem('tokenType') || 'Bearer';

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `${tokenType} ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      const isAuthEndpoint = req.url.includes('/api/auth/');
      if (error?.status === 401 && !isAuthEndpoint) {
        window.localStorage.clear();
        notification.warning('Sesija je istekla', 'Prijavite se ponovo da nastavite.');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};