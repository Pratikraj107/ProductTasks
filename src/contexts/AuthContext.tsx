import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  setSessionFromTokens: (accessToken: string, refreshToken: string) => Promise<{ error: any }>;
  sendOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ error: string | null }>;
  navigate?: (path: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  navigate?: (path: string) => void;
}

export function AuthProvider({ children, navigate }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) return { error };
      if (data?.url) window.location.href = data.url;
      return { error: null };
    } catch (error) {
      return { error: error as any };
    }
  };

  const setSessionFromTokens = async (accessToken: string, refreshToken: string) => {
    try {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      return { error };
    } catch (error) {
      return { error: error as any };
    }
  };

  const sendOtp = async (phone: string): Promise<{ error: string | null }> => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        return { error: data.detail || data.message || `Failed to send OTP (${r.status})` };
      }
      return { error: null };
    } catch (e) {
      return { error: (e instanceof Error ? e.message : 'Network error') };
    }
  };

  const verifyOtp = async (phone: string, otp: string): Promise<{ error: string | null }> => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        return { error: data.detail || data.message || `Verification failed (${r.status})` };
      }
      const accessToken = data.access_token;
      const refreshToken = data.refresh_token;
      if (!accessToken || !refreshToken) {
        return { error: 'Invalid response from server' };
      }
      const { error } = await setSessionFromTokens(accessToken, refreshToken);
      if (error) return { error: error.message || 'Session error' };
      return { error: null };
    } catch (e) {
      return { error: (e instanceof Error ? e.message : 'Network error') };
    }
  };

  const signOut = async () => {
    try {
      // Use local scope to sign out without requiring an active session
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Error signing out:', error);
        // Even if there's an error, clear local state
        setUser(null);
        setSession(null);
        // Use SPA navigation if available, fallback to page reload
        if (navigate) {
          navigate('/');
        } else {
          window.location.href = '/';
        }
        return; // Don't throw error for local sign out
      }
      
      // Clear local state and redirect to home page
      setUser(null);
      setSession(null);
      // Use SPA navigation if available, fallback to page reload
      if (navigate) {
        navigate('/');
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Sign out failed:', error);
      // Even if sign out fails, clear local state and redirect
      setUser(null);
      setSession(null);
      // Use SPA navigation if available, fallback to page reload
      if (navigate) {
        navigate('/');
      } else {
        window.location.href = '/';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut, setSessionFromTokens, sendOtp, verifyOtp, navigate }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
