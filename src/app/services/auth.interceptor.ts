import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof window === 'undefined') {
    return next(req);
  }

  const token = window.localStorage.getItem('token');
  const tokenType = window.localStorage.getItem('tokenType') || 'Bearer';

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `${tokenType} ${token}`,
      },
    })
  );
};