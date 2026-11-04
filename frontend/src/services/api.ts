import {
  FinancialSummary,
  Transaction,
  TransactionCreate,
  TransactionFilters,
  TransactionUpdate,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Enhanced fetch wrapper with friendly network error extraction
 */
async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err: any) {
    throw new Error(
      'Cannot connect to SmartSpend backend API (port 8000). Please ensure FastAPI is running.'
    );
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 502 || res.status === 504) {
      throw new Error(
        'Backend server is unreachable (502 Bad Gateway). Please make sure the FastAPI backend is running.'
      );
    }

    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        if (typeof errorJson.detail === 'string') {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        }
      }
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  /**
   * Fetch all transactions with optional query filters
   */
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await safeFetch(`${API_BASE}/transactions${query}`);
    return handleResponse<Transaction[]>(res);
  },

  /**
   * Fetch single transaction by ID
   */
  async getTransactionById(id: number): Promise<Transaction> {
    const res = await safeFetch(`${API_BASE}/transactions/${id}`);
    return handleResponse<Transaction>(res);
  },

  /**
   * Create a new transaction
   */
  async createTransaction(payload: TransactionCreate): Promise<Transaction> {
    const res = await safeFetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Transaction>(res);
  },

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: number, payload: TransactionUpdate): Promise<Transaction> {
    const res = await safeFetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return handleResponse<Transaction>(res);
  },

  /**
   * Delete a transaction by ID
   */
  async deleteTransaction(id: number): Promise<{ message: string; id: number }> {
    const res = await safeFetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string; id: number }>(res);
  },

  /**
   * Fetch financial summary (Total Income, Total Expenses, Balance)
   */
  async getFinancialSummary(currency = 'INR'): Promise<FinancialSummary> {
    const res = await safeFetch(
      `${API_BASE}/analytics/summary?currency=${encodeURIComponent(currency)}`
    );
    return handleResponse<FinancialSummary>(res);
  },

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{ status: string; application: string }> {
    const res = await safeFetch('/health');
    return handleResponse<{ status: string; application: string }>(res);
  },
};
