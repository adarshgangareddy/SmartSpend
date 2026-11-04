export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  user_id?: string | null;
  type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  currency: string;
  transaction_date: string;
  created_at: string;
}

export interface TransactionCreate {
  type: TransactionType;
  amount: number;
  category: string;
  description?: string | null;
  currency: string;
  transaction_date: string;
}

export interface TransactionUpdate {
  type?: TransactionType;
  amount?: number;
  category?: string;
  description?: string | null;
  currency?: string;
  transaction_date?: string;
}

export interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  balance: number;
  currency: string;
}

export interface TransactionFilters {
  type?: TransactionType | '';
  category?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  full_name?: string | null;
  preferred_currency?: string;
}
