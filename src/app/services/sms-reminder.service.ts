import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ExcludedCustomer, SmsReminderLogEntry, SmsReminderRule, SmsReminderRuleRequest, SmsReminderSettings } from '../models/sms-reminder.model';

@Injectable({ providedIn: 'root' })
export class SmsReminderService {
  private readonly base = `${environment.apiUrl}/api/admin/sms-rules`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<{ providerConnected: boolean }> {
    return this.http.get<{ providerConnected: boolean }>(`${this.base}/status`);
  }

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

  getSettings(): Observable<SmsReminderSettings> {
    return this.http.get<SmsReminderSettings>(`${this.base}/settings`);
  }

  updateSettings(settings: SmsReminderSettings): Observable<SmsReminderSettings> {
    return this.http.put<SmsReminderSettings>(`${this.base}/settings`, settings);
  }

  getExcludedCustomers(): Observable<ExcludedCustomer[]> {
    return this.http.get<ExcludedCustomer[]>(`${this.base}/excluded-customers`);
  }

  excludeCustomer(customerId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/excluded-customers/${customerId}`, {});
  }

  includeCustomer(customerId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/excluded-customers/${customerId}`);
  }

  markOldAsNotified(ruleId: number, olderThanDays: number): Observable<{ markedCount: number }> {
    return this.http.post<{ markedCount: number }>(`${this.base}/${ruleId}/mark-old-as-notified?olderThanDays=${olderThanDays}`, {});
  }
}
