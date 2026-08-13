export interface DebtorCallListEntry {
  customerId: number;
  customerFullName: string;
  phoneNumber: string | null;
  contractId: number;
  installmentOrdinal: number;
  maturityDate: string;
  daysOverdue: number;
  remainingAmount: number;
}

export interface BucketStat {
  label: string;
  count: number;
  amount: number;
}

export interface PeriodStat {
  label: string;
  fromDate: string;
  toDate: string;
  count: number;
  amount: number;
}

export interface StatisticsOverview {
  totalUnpaidCount: number;
  totalUnpaidAmount: number;
  overdueCount: number;
  overdueAmount: number;
  overdueBuckets: BucketStat[];
  notYetDueCount: number;
  notYetDueAmount: number;
  litigationContractsCount: number;
  litigationAmount: number;
  expectedInflow: PeriodStat[];
}
