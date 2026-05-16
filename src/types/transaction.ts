export type TransactionType = 'debit' | 'credit' | 'transfer';
export type TransactionStatus = 'pending' | 'cleared' | 'failed';

export interface Transaction {
  id: string;
  transaction_date: string;
  type: TransactionType;
  amount: number;
  currency: string;
  merchant: string;
  bank_name: string;
  payment_method: string;
  category: string;
  tags: string[];
  is_recurring: boolean;
  status: TransactionStatus;
}

export type DateFilter = 'current_month' | 'last_month' | 'all_time';

export interface Metrics {
  totalOutflow: number;
  totalInflow: number;
  topCategory: string;
}
