export type TransactionType = 'debit' | 'credit';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchant: string;
  date: string; // ISO String
  rawSms?: string;
  isManual: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  budget: number;
  alertsEnabled?: boolean;
  spent: number;
}

export interface BudgetStatus {
  categoryId: string;
  spent: number;
  limit: number;
  percentage: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}

export interface CategorySpending {
  name: string;
  value: number;
  color: string;
}