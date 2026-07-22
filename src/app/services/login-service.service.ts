import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  username: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private readonly url = `${environment.apiUrl}/api/auth/login`;

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.url, request);
  }

  persistSession(response: LoginResponse): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem('token', response.accessToken);
    window.localStorage.setItem('tokenType', response.tokenType || 'Bearer');
    window.localStorage.setItem('username', response.username);

    const firstRole = response.roles?.[0]?.replace(/^ROLE_/, '') ?? '';
    if (firstRole) {
      window.localStorage.setItem('role', firstRole);
    } else {
      window.localStorage.removeItem('role');
    }

    const fullName = [response.firstName, response.lastName].filter(Boolean).join(' ');
    if (fullName) {
      window.localStorage.setItem('fullName', fullName);
    } else {
      window.localStorage.removeItem('fullName');
    }
  }
}