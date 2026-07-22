import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (typeof window === 'undefined') {
    return false;
  }

  const role = window.localStorage.getItem('role');
  if (role === 'ADMIN') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const employeeOrAdminGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (typeof window === 'undefined') {
    return false;
  }

  const role = window.localStorage.getItem('role');
  if (role === 'ADMIN' || role === 'EMPLOYEE') {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (typeof window === 'undefined') {
    return false;
  }

  const token = window.localStorage.getItem('token');
  if (token) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};