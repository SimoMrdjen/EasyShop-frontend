import { Routes } from '@angular/router';
import { adminGuard, authGuard, employeeOrAdminGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./login-form/login-form.component').then(m => m.LoginFormComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./account/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./account/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'account/change-password',
    loadComponent: () => import('./account/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./admin/admin-users.component').then(m => m.AdminUsersComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'customers/find',
    loadComponent: () => import('./admin/find-customer.component').then(m => m.FindCustomerComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'contracts',
    loadComponent: () => import('./contracts/contract-list.component').then(m => m.ContractListComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'contracts/new',
    loadComponent: () => import('./contracts/contract-new.component').then(m => m.ContractNewComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'contracts/:id/print',
    loadComponent: () => import('./contracts/contract-print.component').then(m => m.ContractPrintComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'contracts/:id/installments/:installmentId/receipt',
    loadComponent: () => import('./contracts/installment-receipt.component').then(m => m.InstallmentReceiptComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'contracts/:id',
    loadComponent: () => import('./contracts/contract-detail.component').then(m => m.ContractDetailComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'installments/overdue',
    loadComponent: () => import('./contracts/installments-overdue.component').then(m => m.InstallmentsOverdueComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'reports/daily',
    loadComponent: () => import('./contracts/daily-report.component').then(m => m.DailyReportComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'bank-statements/import',
    loadComponent: () => import('./contracts/bank-statement-import.component').then(m => m.BankStatementImportComponent),
    canActivate: [employeeOrAdminGuard]
  },
  {
    path: 'admin/sms-rules',
    loadComponent: () => import('./admin/sms-reminder-rules.component').then(m => m.SmsReminderRulesComponent),
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: 'login' },
];
