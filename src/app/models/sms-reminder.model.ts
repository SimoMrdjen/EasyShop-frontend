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
  status: 'SENT' | 'FAILED';
  errorMessage: string | null;
  sentAt: string;
}
