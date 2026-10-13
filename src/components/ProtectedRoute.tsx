import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Cpu } from 'lucide-react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center animate-pulse">
          <Cpu className="w-6 h-6 text-emerald-400" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center animate-pulse">
          <Cpu className="w-6 h-6 text-emerald-400" />
        </div>
      </div>
    );
  }

  if (!profile) return <Navigate to="/admin/login" replace />;
  if (!profile.is_admin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
