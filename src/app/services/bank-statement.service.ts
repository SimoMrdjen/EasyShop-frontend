import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type BankTransactionStatus =
  'PROPOSED_MATCH' | 'CONFIRMED' | 'NO_REFERENCE' | 'INVALID_REFERENCE' | 'UNKNOWN_CONTRACT' | 'ALREADY_PAID';

export type PayerNameCheck = 'MATCH' | 'PARTIAL' | 'MISMATCH';

export interface BankImportRow {
  id: number;
  bankName: string;
  transactionDate: string;
  amount: number;
  description: string;
  status: BankTransactionStatus;
  contractId?: number;
  installmentOrdinal?: number;
  customerFullName?: string;
  payerNameCheck?: PayerNameCheck;
}

export const PAYER_NAME_CHECK_LABELS: Record<PayerNameCheck, string> = {
  MATCH: 'Ime se poklapa',
  PARTIAL: 'Delimično poklapanje imena',
  MISMATCH: 'Ime se ne poklapa - proveri!',
};

export const PAYER_NAME_CHECK_COLORS: Record<PayerNameCheck, string> = {
  MATCH: 'green',
  PARTIAL: 'orange',
  MISMATCH: 'red',
};

export const BANK_TRANSACTION_STATUS_LABELS: Record<BankTransactionStatus, string> = {
  PROPOSED_MATCH: 'Predlog za evidentiranje',
  CONFIRMED: 'Evidentirano',
  NO_REFERENCE: 'Nema poziv na broj',
  INVALID_REFERENCE: 'Nevažeći poziv na broj',
  UNKNOWN_CONTRACT: 'Ugovor/rata ne postoji',
  ALREADY_PAID: 'Rata je već plaćena',
};

export const BANK_TRANSACTION_STATUS_COLORS: Record<BankTransactionStatus, string> = {
  PROPOSED_MATCH: 'blue',
  CONFIRMED: 'green',
  NO_REFERENCE: 'default',
  INVALID_REFERENCE: 'orange',
  UNKNOWN_CONTRACT: 'orange',
  ALREADY_PAID: 'default',
};

@Injectable({ providedIn: 'root' })
export class BankStatementService {
  private readonly base = `${environment.apiUrl}/api/bank-statements`;

  constructor(private http: HttpClient) {}

  preview(file: File): Observable<BankImportRow[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<BankImportRow[]>(`${this.base}/preview`, formData);
  }

  confirm(transactionIds: number[]): Observable<BankImportRow[]> {
    return this.http.post<BankImportRow[]>(`${this.base}/confirm`, { transactionIds });
  }
}
