import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SmsReminderLogEntry, SmsReminderRule, SmsReminderRuleRequest } from '../models/sms-reminder.model';

@Injectable({ providedIn: 'root' })
export class SmsReminderService {
  private readonly base = `${environment.apiUrl}/api/admin/sms-rules`;

  constructor(private http: HttpClient) {}

  getRules(): Observable<SmsReminderRule[]> {
    return this.http.get<SmsReminderRule[]>(this.base);
  }

  createRule(req: SmsReminderRuleRequest): Observable<SmsReminderRule> {
    return this.http.post<SmsReminderRule>(this.base, req);
  }

  updateRule(id: number, req: SmsReminderRuleRequest): Observable<SmsReminderRule> {
    return this.http.put<SmsReminderRule>(`${this.base}/${id}`, req);
  }

  deleteRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getLog(): Observable<SmsReminderLogEntry[]> {
    return this.http.get<SmsReminderLogEntry[]>(`${this.base}/log`);
  }

  runNow(): Observable<void> {
    return this.http.post<void>(`${this.base}/run-now`, {});
  }
}
