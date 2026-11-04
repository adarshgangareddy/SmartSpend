import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

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

const LOCAL_USER_KEY = 'smartspend_auth_user';

export const authService = {
  /**
   * Get currently authenticated user from Supabase or persistent local session
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    // 1. Check active Supabase session
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

    // 2. Check local fallback storage
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

      if (!error && data.user) {
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

      // If Supabase gave an explicit error
      if (error && !error.message.includes('Fetch') && !error.message.includes('network')) {
        throw new Error(error.message);
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
  async signUp(email: string, pass: string, fullName: string): Promise<AuthUser> {
    const cleanName = fullName.trim() || 'Adarsh';

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (!error && data.user) {
        const u = data.user;
        const authUser: AuthUser = {
          id: u.id,
          email: u.email || email,
          fullName: cleanName,
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authUser));
        return authUser;
      }

      if (error && !error.message.includes('Fetch') && !error.message.includes('network')) {
        throw new Error(error.message);
      }
    }

    // Local / direct fallback
    const fallbackUser: AuthUser = {
      id: 'usr_' + Date.now(),
      email,
      fullName: cleanName,
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
    return fallbackUser;
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

