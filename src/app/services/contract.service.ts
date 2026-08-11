import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContractRequest, ContractResponse, DailyPaymentReport, InstallmentResponse, PaymentBreakdown, PayInstallmentRequest } from '../models/contract.model';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly base = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  createContract(req: ContractRequest): Observable<ContractResponse> {
    return this.http.post<ContractResponse>(`${this.base}/contracts`, req);
  }

  getAllContracts(): Observable<ContractResponse[]> {
    return this.http.get<ContractResponse[]>(`${this.base}/contracts`);
  }

  getContractById(id: number): Observable<ContractResponse> {
    return this.http.get<ContractResponse>(`${this.base}/contracts/${id}`);
  }

  getContractsByCustomer(customerId: number): Observable<ContractResponse[]> {
    return this.http.get<ContractResponse[]>(`${this.base}/contracts/customer/${customerId}`);
  }

  payInstallment(id: number, req: PayInstallmentRequest): Observable<InstallmentResponse> {
    return this.http.put<InstallmentResponse>(`${this.base}/installments/${id}/pay`, req);
  }

  getOverdueInstallments(): Observable<InstallmentResponse[]> {
    return this.http.get<InstallmentResponse[]>(`${this.base}/installments/overdue`);
  }

  getUnpaidByCustomer(customerId: number): Observable<InstallmentResponse[]> {
    return this.http.get<InstallmentResponse[]>(`${this.base}/installments/customer/${customerId}/unpaid`);
  }

  getDailyPaymentReport(date: string): Observable<DailyPaymentReport> {
    return this.http.get<DailyPaymentReport>(`${this.base}/installments/report/daily`, { params: { date } });
  }

  getPaymentBreakdown(groupId: string): Observable<PaymentBreakdown> {
    return this.http.get<PaymentBreakdown>(`${this.base}/installments/payment-groups/${groupId}`);
  }
}
