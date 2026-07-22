import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordRequest {
  userName: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly base = `${environment.apiUrl}/api/account`;

  constructor(private http: HttpClient) {}

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/password`, request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/reset-password`, request);
  }
}
