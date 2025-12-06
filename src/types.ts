export type TransactionType = 'debit' | 'credit';

export type AccountType = 'bank' | 'cash' | 'credit_card' | 'wallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  merchant: string;
  date: string; // ISO String
  rawSms?: string;
  isManual: boolean;
  accountId?: string; // The account this transaction affects
  transferAccountId?: string; // For transfers: the destination account
  isTransfer?: boolean;
  isPending?: boolean; // If true, requires user review
}

export interface BudgetConfig {
  period: 'monthly' | 'weekly' | 'yearly';
  rollover: boolean;
  alerts: {
    enabled: boolean;
    threshold: number; // e.g., 80%
  };
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  budget: number;
  alertsEnabled?: boolean;
  budgetConfig?: BudgetConfig;
  rolloverAmount?: number; // Amount carried from previous period
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

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  isCompleted: boolean;
}

// Bill Splitting Types
export interface SplitParticipant {
  id: string;
  name: string;
  phone?: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
}

export type SplitType = 'equal' | 'custom' | 'percentage';

export interface SplitExpense {
  id: string;
  transactionId: string;
  totalAmount: number;
  paidBy: string; // 'me' or participant id
  splitType: SplitType;
  participants: SplitParticipant[];
  createdDate: string;
  settledDate?: string;
  isSettled: boolean;
  notes?: string;
}

export interface Friend {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalOwed: number; // they owe you
  totalOwing: number; // you owe them
  addedDate: string;
}