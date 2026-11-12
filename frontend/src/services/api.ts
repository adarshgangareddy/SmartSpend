import {
  FinancialSummary,
  Transaction,
  TransactionCreate,
  TransactionFilters,
  TransactionUpdate,
  UserProfile,
  UserProfileUpdate,
} from '../types';
import { authService } from './auth';

function getNormalizedApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL || '/api').trim();
  if (!raw || raw === '/' || raw === '/api') return '/api';
  const clean = raw.replace(/\/+$/, '');
  if ((clean.startsWith('http://') || clean.startsWith('https://')) && !clean.endsWith('/api')) {
    return `${clean}/api`;
  }
  return clean;
}

export const API_BASE = getNormalizedApiBase();

/**
 * Enhanced fetch wrapper with automatic JWT token attachment
 */
async function safeFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // Automatically attach authenticated user's access token if available
  try {
    const token = await authService.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // Continue without token if session unavailable
  }

  try {
    const res = await fetch(url, { ...options, headers });
    return res;
  } catch (err: any) {
    throw new Error(
      'Cannot connect to SmartSpend backend API (port 8000). Please ensure FastAPI is running.'
    );
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      try {
        authService.signOut();
      } catch {}
      window.dispatchEvent(new CustomEvent('smartspend:session_expired'));
      throw new Error('Authentication required or session expired. Please sign in again.');
    }
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
   * Pre-warm / health-check ping to wake up sleeping backends (e.g. Render cold start)
   */
  async prewarmBackend(): Promise<void> {
    try {
      await fetch(`${API_BASE}/health`, { method: 'GET', cache: 'no-store' });
    } catch {
      // Gracefully ignore background pre-warm failures
    }
  },

  /**
   * Fetch all transactions with optional query filters for the authenticated user
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
      if (filters.display_currency) params.append('display_currency', filters.display_currency);
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await safeFetch(`${API_BASE}/transactions${queryStr}`);
    return handleResponse<Transaction[]>(res);
  },

  /**
   * Retrieve a single transaction by ID
   */
  async getTransactionById(id: number): Promise<Transaction> {
    const res = await safeFetch(`${API_BASE}/transactions/${id}`);
    return handleResponse<Transaction>(res);
  },

  /**
   * Create a new transaction linked to the authenticated user
   */
  async createTransaction(data: TransactionCreate): Promise<Transaction> {
    const res = await safeFetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<Transaction>(res);
  },

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: number, data: TransactionUpdate): Promise<Transaction> {
    const res = await safeFetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
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
   * Get financial summary (total income, total expense, balance)
   */
  async getFinancialSummary(currency: string = 'INR'): Promise<FinancialSummary> {
    const res = await safeFetch(
      `${API_BASE}/analytics/summary?currency=${encodeURIComponent(currency)}`
    );
    return handleResponse<FinancialSummary>(res);
  },

  /**
   * Fetch current exchange rates against USD
   */
  async getExchangeRates(): Promise<{ base: string; date: string; rates: Record<string, number> }> {
    const res = await safeFetch(`${API_BASE}/analytics/rates`);
    return handleResponse<{ base: string; date: string; rates: Record<string, number> }>(res);
  },

  /**
   * Retrieve authenticated user's profile
   */
  async getProfile(): Promise<UserProfile> {
    const res = await safeFetch(`${API_BASE}/profile`);
    return handleResponse<UserProfile>(res);
  },

  /**
   * Update authenticated user's profile
   */
  async updateProfile(data: UserProfileUpdate): Promise<UserProfile> {
    const res = await safeFetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse<UserProfile>(res);
  },

  /**
   * Permanently delete authenticated user's account and all personal financial data
   */
  async deleteAccount(): Promise<{ message: string }> {
    const res = await safeFetch(`${API_BASE}/profile`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(res);
  },

  /**
   * Request password change with email verification link
   */
  async requestPasswordChange(newPassword: string): Promise<{ message: string; email: string }> {
    const res = await safeFetch(`${API_BASE}/auth/request-password-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_password: newPassword }),
    });
    return handleResponse<{ message: string; email: string }>(res);
  },

  /**
   * Confirm password change with verification token received in email
   */
  async confirmPasswordChange(token: string): Promise<{ success: boolean; message: string }> {
    const res = await safeFetch(`${API_BASE}/auth/confirm-password-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return handleResponse<{ success: boolean; message: string }>(res);
  },
};
