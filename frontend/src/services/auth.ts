import { createClient, SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
function getNormalizedApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL || '/api').trim();
  if (!raw || raw === '/' || raw === '/api') return '/api';
  const clean = raw.replace(/\/+$/, '');
  if ((clean.startsWith('http://') || clean.startsWith('https://')) && !clean.endsWith('/api')) {
    return `${clean}/api`;
  }
  return clean;
}

const API_BASE = getNormalizedApiBase();

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
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  location?: string;
  dob?: string;
  theme?: string;
  dateFormat?: string;
  createdAt?: string;
  provider?: 'email' | 'google';
}

export interface SignUpResult {
  user: AuthUser | null;
  confirmationRequired: boolean;
  message?: string;
}

const LOCAL_USER_KEY = 'smartspend_auth_user';
const LOCAL_TOKEN_KEY = 'smartspend_auth_token';

/**
 * Safely parse a JWT payload accounting for URL safe characters and unpadded lengths
 */
function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('JWT parse error:', err);
    return {};
  }
}

/**
 * Check if a given JWT access token is expired or about to expire
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) return false;
    // Buffer with 15 seconds
    return payload.exp * 1000 <= Date.now() + 15000;
  } catch {
    return true;
  }
}

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
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session?.access_token) {
          if (!isTokenExpired(data.session.access_token)) {
            return data.session.access_token;
          }
          // Attempt automatic session refresh
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (!refreshError && refreshData.session?.access_token) {
            localStorage.setItem(LOCAL_TOKEN_KEY, refreshData.session.access_token);
            return refreshData.session.access_token;
          }
        }
      } catch {
        // Fallback below
      }
    }
    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (token && !isTokenExpired(token)) {
      return token;
    }
    return null;
  },

  /**
   * Get currently authenticated user from Supabase or persistent local session
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          // If token is expired, attempt refresh
          if (isTokenExpired(data.session.access_token)) {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshData.session) {
              await this.signOut();
              return null;
            }
          }
          const u = data.session.user;
          const meta = u.user_metadata || {};
          const userObj: AuthUser = {
            id: u.id,
            email: u.email || '',
            fullName:
              meta.full_name ||
              meta.name ||
              u.email?.split('@')[0] ||
              'User',
            avatarUrl: meta.avatar_url || meta.picture,
            provider: data.session.user.app_metadata?.provider === 'google' ? 'google' : 'email',
          };
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userObj));
          if (data.session.access_token) {
            localStorage.setItem(LOCAL_TOKEN_KEY, data.session.access_token);
          }
          return userObj;
        } else {
          // Explicitly no active session in Supabase
          localStorage.removeItem(LOCAL_USER_KEY);
          localStorage.removeItem(LOCAL_TOKEN_KEY);
          return null;
        }
      } catch (err) {
        console.warn('Error reading Supabase session:', err);
      }
    }

    const cached = localStorage.getItem(LOCAL_USER_KEY);
    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (cached && token && !isTokenExpired(token)) {
      try {
        return JSON.parse(cached);
      } catch {
        localStorage.removeItem(LOCAL_USER_KEY);
        localStorage.removeItem(LOCAL_TOKEN_KEY);
      }
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
      localStorage.removeItem(LOCAL_TOKEN_KEY);
    }

    return null;
  },

  /**
   * Sign in with Google OAuth using Supabase Auth
   */
  async signInWithGoogle(): Promise<void> {
    const callbackUrl = `${window.location.origin}/auth/callback`;

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (error) {
        throw new Error(error.message || 'Google sign-in failed.');
      }
      if (data?.url) {
        window.location.href = data.url;
      }
      return;
    }

    // Call backend to get Google authorization URL
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);
    let res: Response;
    let data: { url?: string; detail?: string };
    try {
      res = await fetch(
        `${API_BASE}/auth/oauth/google?redirect_to=${encodeURIComponent(callbackUrl)}`,
        { signal: controller.signal }
      );
      data = await res.json().catch(() => ({}));
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(
          'Google sign-in timed out because the authentication server did not respond. Please try again in a moment.'
        );
      }
      throw err;
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!res.ok || !data.url) {
      throw new Error(
        data.detail || 'Google sign-in is not configured yet in Supabase.'
      );
    }
    window.location.href = data.url;
  },

  /**
   * Handle OAuth PKCE callback (?code=...) on /auth/callback
   */
  async handleOAuthCallback(code: string): Promise<AuthUser> {
    if (supabase) {
      try {
        // The Supabase client automatically exchanges PKCE codes from the URL
        // during initialization. Reuse that session before attempting another exchange.
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && sessionData.session?.user) {
          const u = sessionData.session.user;
          const meta = u.user_metadata || {};
          const authUser: AuthUser = {
            id: u.id,
            email: u.email || '',
            fullName: meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
            avatarUrl: meta.avatar_url || meta.picture,
            provider: u.app_metadata?.provider === 'google' ? 'google' : 'email',
          };
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
          if (sessionData.session.access_token) {
            localStorage.setItem(LOCAL_TOKEN_KEY, sessionData.session.access_token);
          }
          return authUser;
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data?.user && data.session) {
          const u = data.user;
          const meta = u.user_metadata || {};
          const authUser: AuthUser = {
            id: u.id,
            email: u.email || '',
            fullName: meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
            avatarUrl: meta.avatar_url || meta.picture,
            provider: u.app_metadata?.provider === 'google' ? 'google' : 'email',
          };
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
          if (data.session.access_token) {
            localStorage.setItem(LOCAL_TOKEN_KEY, data.session.access_token);
          }
          return authUser;
        }
      } catch (err) {
        console.warn('Browser exchangeCodeForSession failed, trying backend fallback:', err);
      }
    }

    // Call backend code exchange endpoint
    const res = await fetch(`${API_BASE}/auth/exchange-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.user) {
      throw new Error(body.detail || 'Failed to exchange authorization code for session.');
    }

    const authUser: AuthUser = body.user;
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    if (body.access_token) {
      localStorage.setItem(LOCAL_TOKEN_KEY, body.access_token);
    }
    return authUser;
  },

  /**
   * Handle OAuth implicit callback with URL hash (#access_token=...)
   */
  async handleOAuthHash(hash: string): Promise<AuthUser> {
    const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
    const params = new URLSearchParams(cleanHash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken) {
      throw new Error('No access token found in callback URL.');
    }

    localStorage.setItem(LOCAL_TOKEN_KEY, accessToken);

    if (supabase && refreshToken) {
      try {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } catch (err) {
        console.warn('SetSession error:', err);
      }
    }

    // Extract verified identity immediately from JWT payload
    const payload = parseJwtPayload(accessToken);
    const meta = payload.user_metadata || {};
    const authUser: AuthUser = {
      id: payload.sub || 'google-user',
      email: payload.email || meta.email || '',
      fullName:
        meta.full_name ||
        meta.name ||
        payload.email?.split('@')[0] ||
        'Google User',
      avatarUrl: meta.avatar_url || meta.picture,
      provider: 'google',
    };

    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
    return authUser;
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
        redirectTo: `${window.location.origin}/auth/callback#type=recovery`,
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

    // Call backend endpoint with the user's access token
    const token = localStorage.getItem(LOCAL_TOKEN_KEY);
    if (!token) {
      throw new Error('Session expired. Please log in again to update your password.');
    }

    const res = await fetch(`${API_BASE}/auth/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ new_password: newPassword }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || 'Failed to update password.');
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

  /**
   * Upload user avatar to Supabase Storage or convert to DataURL fallback
   */
  async uploadAvatar(file: File, userId: string): Promise<string> {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB.');
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Please select a valid image (JPEG, PNG, WEBP, or GIF).');
    }

    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'png';
        const filePath = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
          if (data?.publicUrl) {
            return data.publicUrl;
          }
        }
      } catch (err) {
        console.warn('Storage upload error, falling back to DataURL:', err);
      }
    }

    // High quality client-side Data URL fallback
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  },
};
