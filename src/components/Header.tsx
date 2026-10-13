import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard, Cpu, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

export default function Header() {
  const { profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = profile?.is_admin;
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-slate-900 hidden sm:block">TechStore</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/" active={isActive('/')} label="Accueil" />
              <NavLink to="/catalog" active={isActive('/catalog') || location.pathname.startsWith('/category')} label="Catalogue" />
              {profile && <NavLink to="/orders" active={isActive('/orders')} label="Mes commandes" />}
              {isAdmin && <NavLink to="/admin" active={location.pathname.startsWith('/admin')} label="Administration" />}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Panier"
            >
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {profile ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
                    {profile.full_name}
                  </span>
                </Link>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Déconnexion"
                >
                  <LogOut className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Connexion
              </Link>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-1 border-t border-slate-100 pt-3">
            <MobileLink to="/" label="Accueil" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/catalog" label="Catalogue" onClick={() => setMobileOpen(false)} />
            {profile && <MobileLink to="/orders" label="Mes commandes" onClick={() => setMobileOpen(false)} />}
            {profile && <MobileLink to="/profile" label="Mon profil" onClick={() => setMobileOpen(false)} />}
            {isAdmin && <MobileLink to="/admin" label="Administration" onClick={() => setMobileOpen(false)} />}
            {!profile && <MobileLink to="/login" label="Connexion" onClick={() => setMobileOpen(false)} />}
            {profile && (
              <button
                onClick={() => { signOut(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

function NavLink({ to, active, label }: { to: string; active: boolean; label: string }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </Link>
  );
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium">
      {label}
    </Link>
  );
}
