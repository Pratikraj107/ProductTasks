import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // After OAuth redirect, URL may have #access_token=... while Supabase restores session
  const hasAuthHash = typeof window !== 'undefined' && window.location.hash.includes('access_token');

  if (loading || (hasAuthHash && !user)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/signin';
    return null;
  }

  return <>{children}</>;
}
