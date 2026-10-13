import { useEffect, useState } from 'react';
import { Package, ShoppingBag, Users, TrendingUp, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order } from '@/types';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: customerCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const revenue = (ordersData ?? []).reduce((sum, o) => sum + Number(o.total), 0);

      setStats({
        totalProducts: productCount ?? 0,
        totalOrders: orderCount ?? 0,
        totalCustomers: customerCount ?? 0,
        totalRevenue: revenue,
      });
      setRecentOrders((ordersData ?? []) as Order[]);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Tableau de bord</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Package} label="Produits" value={String(stats.totalProducts)} color="bg-blue-500" />
        <StatCard icon={ShoppingBag} label="Commandes" value={String(stats.totalOrders)} color="bg-emerald-500" />
        <StatCard icon={Users} label="Clients" value={String(stats.totalCustomers)} color="bg-amber-500" />
        <StatCard icon={TrendingUp} label="Chiffre d'affaires" value={formatPrice(stats.totalRevenue)} color="bg-purple-500" />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Commandes récentes</h2>
          <Link to="/admin/orders" className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
            Voir tout <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Aucune commande pour le moment</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/admin/orders`}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{order.order_number}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <span className="font-bold text-slate-900 text-sm shrink-0">{formatPrice(order.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}
