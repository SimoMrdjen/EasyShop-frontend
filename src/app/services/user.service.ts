import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UpdateUserRequest, UserRequest, UserResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly base = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  create(request: UserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.base, request);
  }

  getAllCustomers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/customers`);
  }

  searchCustomers(q: string): Observable<UserResponse[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<UserResponse[]>(`${this.base}/customers/search`, { params });
  }

  getAllEmployees(): Observable<UserResponse[]> {
    const params = new HttpParams().set('q', '');
    return this.http.get<UserResponse[]>(`${this.base}/employees/search`, { params });
  }

  searchEmployees(q: string): Observable<UserResponse[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<UserResponse[]>(`${this.base}/employees/search`, { params });
  }

  getCustomerById(profileId: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/customers/${profileId}`);
  }

  findCustomerByJmbg(jmbg: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.base}/customers/by-jmbg/${jmbg}`);
  }

  updateCustomer(userId: number, data: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.base}/customers/${userId}`, data);
  }
}
