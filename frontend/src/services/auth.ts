import { createClient, SupabaseClient, User, AuthChangeEvent, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project-id')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
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
          return userObj;
        }
      } catch (err) {
        console.warn('Error reading Supabase session:', err);
      }
    }

    // Check local fallback storage
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
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        // Specific user-friendly handling
        if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please verify your email before signing in. Check your inbox.');
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Invalid email or password.');
        }
        if (!error.message.includes('Fetch') && !error.message.includes('network')) {
          throw new Error(error.message);
        }
      }

      if (data?.user) {
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
        return authUser;
      }
    }

    // Local / direct authentication fallback
    const derivedName = email.split('@')[0];
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
    const fallbackUser: AuthUser = {
      id: 'usr_' + Date.now(),
      email,
      fullName: formattedName || 'Adarsh',
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
    return fallbackUser;
  },

  /**
   * Create an account / Sign up
   */
  async signUp(email: string, pass: string, fullName: string): Promise<SignUpResult> {
    const cleanName = fullName.trim() || 'Adarsh';

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: cleanName,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          throw new Error('This email is already registered. Please log in.');
        }
        if (!error.message.includes('Fetch') && !error.message.includes('network')) {
          throw new Error(error.message);
        }
      }

      if (data?.user) {
        // If Supabase requires email verification, session is null or identities is empty
        const isConfirmed = !!data.session || (data.user.confirmed_at != null);
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: cleanName,
        };

        if (isConfirmed) {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
          return { user: authUser, confirmationRequired: false };
        } else {
          // Verification link was sent to their email
          return { user: authUser, confirmationRequired: true };
        }
      }
    }

    // Local / direct fallback
    const fallbackUser: AuthUser = {
      id: 'usr_' + Date.now(),
      email,
      fullName: cleanName,
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
    return { user: fallbackUser, confirmationRequired: false };
  },

  /**
   * Resend email verification link
   */
  async resendVerification(email: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw new Error(error.message || 'Unable to send verification email. Please try again.');
      }
      return;
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

      if (error && !error.message.includes('Fetch') && !error.message.includes('network')) {
        throw new Error(error.message || 'Unable to process password reset.');
      }
      return;
    }
  },

  /**
   * Update password for an authenticated or recovery session
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
  },
};
