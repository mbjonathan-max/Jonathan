import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    // Verify the user is an admin
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setError('Impossible de récupérer votre session');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    const appMetadataIsAdmin = userData.user?.app_metadata?.is_admin === true;
    const profileIsAdmin = profile?.is_admin === true;

    if (!appMetadataIsAdmin && !profileIsAdmin) {
      await supabase.auth.signOut();
      setError("Ce compte n'a pas les droits d'administration. Utilisez la page de connexion client.");
      setLoading(false);
      return;
    }

    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold">TechStore</p>
              <p className="text-sm text-slate-400">Espace Administration</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 leading-tight">
            Gérez votre boutique<br />en toute sécurité
          </h1>
          <p className="text-slate-400 leading-relaxed mb-10 max-w-md">
            Accédez au tableau de bord pour gérer vos produits, commandes, clients et statistiques.
          </p>

          <div className="space-y-4">
            <FeatureItem text="Gestion complète du catalogue produits" />
            <FeatureItem text="Suivi des commandes en temps réel" />
            <FeatureItem text="Statistiques de vente détaillées" />
            <FeatureItem text="Gestion des clients" />
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800">
            <p className="text-sm text-slate-500">
              Administrateur: BENICIEN JONATHAN MDG<br />
              Congo, Brazzaville - +242 065987740
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900">TechStore Admin</h1>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-700 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Accès réservé à l'administrateur
            </span>
            <h2 className="text-2xl font-bold text-slate-900">Connexion administrateur</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Cet espace est exclusivement réservé à l'administrateur de la boutique.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="admin@techstore.cg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Vérification...' : 'Accéder au tableau de bord'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              to="/"
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <User className="w-4 h-4" />
              Retour à la boutique
            </Link>
            <Link
              to="/login"
              className="text-sm text-emerald-600 font-medium hover:underline"
            >
              Espace client
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
      </div>
      <span className="text-sm text-slate-300">{text}</span>
    </div>
  );
}
