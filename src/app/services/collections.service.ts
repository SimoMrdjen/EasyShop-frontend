import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DebtorCallGroup, StatisticsOverview } from '../models/collections.model';

@Injectable({ providedIn: 'root' })
export class CollectionsService {
  private readonly base = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) {}

  getDebtorCallList(fromDays: number, toDays: number, minAmount?: number | null): Observable<DebtorCallGroup[]> {
    let params = new HttpParams().set('fromDays', fromDays).set('toDays', toDays);
    if (minAmount !== null && minAmount !== undefined) {
      params = params.set('minAmount', minAmount);
    }
    return this.http.get<DebtorCallGroup[]>(`${this.base}/debtors/call-list`, { params });
  }

  getStatisticsOverview(inflowPeriods: number = 9): Observable<StatisticsOverview> {
    const params = new HttpParams().set('inflowPeriods', inflowPeriods);
    return this.http.get<StatisticsOverview>(`${this.base}/statistics/overview`, { params });
  }
}
