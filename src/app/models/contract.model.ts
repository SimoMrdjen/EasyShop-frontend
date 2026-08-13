export type InstallmentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'CHECK' | 'CARD' | 'BANK_PAYMENT' | 'GOTOVINA' | 'UPLATA_TR' | 'KARTICA' | 'DRUGO';

export interface InstallmentResponse {
  id: number;
  contractId: number;
  installmentOrdinal: number;
  installmentAmount: number;
  maturityDate: string;
  status: InstallmentStatus;
  paidAmount?: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  lastPaymentGroupId?: string;
}

export interface PaymentBreakdownEntry {
  installmentId: number;
  installmentOrdinal: number;
  installmentAmount: number;
  remainingBefore: number;
  amountApplied: number;
  remainingAfter: number;
}

export interface PaymentBreakdown {
  contractId: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  totalPaid: number;
  entries: PaymentBreakdownEntry[];
}

export interface ContractResponse {
  id: number;
  customerId: number;
  customerFullName: string;
  contractAmount: number;
  participation: number;
  financeAmount: number;
  contractDate: string;
  numberOfInstallments: number;
  installmentAmount: number;
  sentToLitigation: boolean;
  litigationDate?: string;
  litigationNote?: string;
  installments: InstallmentResponse[];
}

export interface LitigationRequest {
  date: string;
  note?: string;
}

export interface ContractRequest {
  customerId: number;
  contractAmount: number;
  participation: number;
  contractDate: string;
  numberOfInstallments: number;
}

export interface PayInstallmentRequest {
  paidAmount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Gotovina',
  CHECK: 'Ček',
  CARD: 'Kartica',
  BANK_PAYMENT: 'Bankovna uplata',
  GOTOVINA: 'Gotovina',
  UPLATA_TR: 'Uplata na TR',
  KARTICA: 'Kartica',
  DRUGO: 'Drugo',
};

export const STATUS_LABELS: Record<InstallmentStatus, string> = {
  PENDING: 'Na čekanju',
  PAID: 'Plaćeno',
  PARTIAL: 'Delimično',
  OVERDUE: 'Dospelo',
};

export const STATUS_COLORS: Record<InstallmentStatus, string> = {
  PENDING: 'blue',
  PAID: 'green',
  PARTIAL: 'orange',
  OVERDUE: 'red',
};

export interface PaymentEntry {
  paymentId: number;
  contractId: number;
  customerFullName: string;
  installmentOrdinal: number;
  amount: number;
  paymentMethod: PaymentMethod;
  recordedAt: string;
  recordedBy: string;
}

export interface DailyPaymentReport {
  date: string;
  grandTotal: number;
  totalsByMethod: Partial<Record<PaymentMethod, number>>;
  payments: PaymentEntry[];
}
