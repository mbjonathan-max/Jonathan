import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, ORDER_STATUS_LABELS, type OrderStatus } from '@/types';
import { TrendingUp, ShoppingBag, Package, DollarSign } from 'lucide-react';

export default function AdminStats() {
  const [loading, setLoading] = useState(true);
  const [revenueByStatus, setRevenueByStatus] = useState<Record<string, number>>({});
  const [orderCountByStatus, setOrderCountByStatus] = useState<Record<string, number>>({});
  const [topProducts, setTopProducts] = useState<{ name: string; count: number; revenue: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from('orders').select('*');
      if (orders) {
        const revByStatus: Record<string, number> = {};
        const countByStatus: Record<string, number> = {};
        let revenue = 0;
        for (const order of orders) {
          const status = order.status as OrderStatus;
          revByStatus[status] = (revByStatus[status] ?? 0) + Number(order.total);
          countByStatus[status] = (countByStatus[status] ?? 0) + 1;
          revenue += Number(order.total);
        }
        setRevenueByStatus(revByStatus);
        setOrderCountByStatus(countByStatus);
        setTotalRevenue(revenue);
        setTotalOrders(orders.length);
        setAvgOrderValue(orders.length > 0 ? revenue / orders.length : 0);
      }

      const { data: items } = await supabase
        .from('order_items')
        .select('*, products(*)');

      if (items) {
        const productMap: Record<string, { name: string; count: number; revenue: number }> = {};
        for (const item of items as (import('@/types').OrderItem & { products?: import('@/types').Product })[]) {
          const key = item.product_id;
          if (!productMap[key]) {
            productMap[key] = { name: item.products?.name ?? 'Produit', count: 0, revenue: 0 };
          }
          productMap[key].count += item.quantity;
          productMap[key].revenue += Number(item.unit_price) * item.quantity;
        }
        const sorted = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        setTopProducts(sorted);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const statuses: OrderStatus[] = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'];
  const maxRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Statistiques</h1>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Chiffre d'affaires total" value={formatPrice(totalRevenue)} color="bg-emerald-500" />
        <StatCard icon={ShoppingBag} label="Nombre de commandes" value={String(totalOrders)} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Panier moyen" value={formatPrice(Math.round(avgOrderValue))} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Commandes par statut</h2>
          <div className="space-y-3">
            {statuses.map((status) => {
              const count = orderCountByStatus[status] ?? 0;
              const revenue = revenueByStatus[status] ?? 0;
              const maxCount = Math.max(...Object.values(orderCountByStatus), 1);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{ORDER_STATUS_LABELS[status]}</span>
                    <span className="font-medium text-slate-900">{count} - {formatPrice(revenue)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Top 5 produits (par chiffre d'affaires)</h2>
          {topProducts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Aucune vente pour le moment</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">{formatPrice(product.revenue)}</p>
                    <p className="text-xs text-slate-400">{product.count} vendus</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}
