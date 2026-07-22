import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IdCardData {
  firstName: string | null;
  lastName: string | null;
  jmbg: string | null;
  address: string | null;
  idCardNumber: string | null;
  issuingAuthority: string | null;
}

@Injectable({ providedIn: 'root' })
export class IdCardService {
  private readonly base = `${environment.apiUrl}/api/id-card`;

  constructor(private http: HttpClient) {}

  read(): Observable<IdCardData> {
    return this.http.post<IdCardData>(`${this.base}/read`, {});
  }
}
