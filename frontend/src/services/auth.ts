import { createClient, SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export let supabase: SupabaseClient | null = null;

// Only initialize Supabase client in the browser if key is a public anon/publishable key
// Secret keys (starting with 'sb_secret_') are forbidden in browsers and must be handled via FastAPI backend
const isBrowserSafeKey =
  Boolean(supabaseAnonKey) &&
  !supabaseAnonKey.startsWith('sb_secret_') &&
  !supabaseAnonKey.includes('secret') &&
  !supabaseAnonKey.includes('your-project');

if (supabaseUrl && isBrowserSafeKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase browser client:', err);
  }
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface SignUpResult {
  user: AuthUser | null;
  confirmationRequired: boolean;
  message?: string;
}

const LOCAL_USER_KEY = 'smartspend_auth_user';
const LOCAL_TOKEN_KEY = 'smartspend_auth_token';

export const authService = {
  /**
   * Listen for Supabase auth state transitions (such as password recovery)
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (supabase) {
      return supabase.auth.onAuthStateChange(callback);
    }
    return { data: { subscription: { unsubscribe: () => {} } } };
  },

  /**
   * Retrieve active token for API requests
   */
  async getAccessToken(): Promise<string | null> {
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          return data.session.access_token;
        }
      } catch {
        // Fallback below
      }
    }
    return localStorage.getItem(LOCAL_TOKEN_KEY);
  },

  /**
   * Get currently authenticated user from Supabase or persistent local session
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const u = data.session.user;
          const userObj: AuthUser = {
            id: u.id,
            email: u.email || '',
            fullName:
              u.user_metadata?.full_name ||
              u.user_metadata?.name ||
              u.email?.split('@')[0] ||
              'Adarsh',
          };
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
          if (data.session.access_token) {
            localStorage.setItem(LOCAL_TOKEN_KEY, data.session.access_token);
          }
          return userObj;
        }
      } catch (err) {
        console.warn('Error reading Supabase session:', err);
      }
    }

    const cached = localStorage.getItem(LOCAL_USER_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        localStorage.removeItem(LOCAL_USER_KEY);
      }
    }

    return null;
  },

  /**
   * Log in with Email & Password
   */
  async signIn(email: string, pass: string): Promise<AuthUser> {
    // 1. Try browser client if configured with safe public key
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (!error && data?.user) {
        const u = data.user;
        const authUser: AuthUser = {
          id: u.id,
          email: u.email || email,
          fullName:
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            email.split('@')[0] ||
            'Adarsh',
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
        if (data.session?.access_token) {
          localStorage.setItem(LOCAL_TOKEN_KEY, data.session.access_token);
        }
        return authUser;
      }

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please verify your email before signing in. Check your inbox.');
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password.');
        }
      }
    }

    // 2. Call backend /api/auth/login
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.detail || 'Invalid email or password.');
    }

    const authUser: AuthUser = body.user;
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    if (body.access_token) {
      localStorage.setItem(LOCAL_TOKEN_KEY, body.access_token);
    }
    return authUser;
  },

  /**
   * Create an account / Sign up
   */
  async signUp(email: string, pass: string, fullName: string): Promise<SignUpResult> {
    const cleanName = fullName.trim() || 'Adarsh';

    // 1. Try browser client if safe anon key available
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: cleanName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (!error && data?.user) {
        const isConfirmed = !!data.session || (data.user.confirmed_at != null);
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: cleanName,
        };

        if (isConfirmed) {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
          if (data.session?.access_token) {
            localStorage.setItem(LOCAL_TOKEN_KEY, data.session.access_token);
          }
          return { user: authUser, confirmationRequired: false };
        } else {
          return { user: authUser, confirmationRequired: true };
        }
      }

      if (error && error.message.toLowerCase().includes('already registered')) {
        throw new Error('This email is already registered. Please log in.');
      }
    }

    // 2. Call backend /api/auth/signup (where backend Supabase handles email sending & fallback)
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, full_name: cleanName }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.detail || 'Unable to register account. Please try again.');
    }

    const authUser: AuthUser = body.user;
    if (body.access_token) {
      localStorage.setItem(LOCAL_TOKEN_KEY, body.access_token);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    }

    return {
      user: authUser,
      confirmationRequired: Boolean(body.confirmation_required),
    };
  },

  /**
   * Resend email verification link
   */
  async resendVerification(email: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (!error) return;
    }

    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || 'Unable to send verification email.');
    }
  },

  /**
   * Send password reset recovery email
   */
  async resetPassword(email: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });
      if (!error) return;
    }

    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || 'Unable to send password reset email.');
    }
  },

  /**
   * Update password for an authenticated session
   */
  async updatePassword(newPassword: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        throw new Error(error.message || 'Failed to update password.');
      }
      return;
    }

    // Direct token update if stored
    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (!token) {
      throw new Error('Session expired. Please log in again to update your password.');
    }
  },

  /**
   * Sign out and clear stored session
   */
  async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_TOKEN_KEY);
  },
};
