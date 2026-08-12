export interface SmsReminderRule {
  id: number;
  daysOffset: number;
  messageTemplate: string;
  active: boolean;
}

export interface SmsReminderRuleRequest {
  daysOffset: number;
  messageTemplate: string;
  active: boolean;
}

export interface SmsReminderLogEntry {
  id: number;
  customerName: string | null;
  phoneNumber: string | null;
  contractId: number | null;
  installmentOrdinal: number | null;
  message: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  errorMessage: string | null;
  sentAt: string;
}

export interface SmsReminderSettings {
  sendingEnabled: boolean;
}

export interface ExcludedCustomer {
  customerId: number;
  fullName: string;
  phoneNumber: string | null;
}
