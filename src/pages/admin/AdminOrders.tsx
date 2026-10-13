import { useEffect, useState } from 'react';
import { Search, ChevronRight, Cpu } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, Profile } from '@/types';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS, type OrderStatus } from '@/types';

export default function AdminOrders() {
  const [orders, setOrders] = useState<(Order & { profiles?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<(Order & { profiles?: Profile }) | null>(null);
  const [orderItems, setOrderItems] = useState<(OrderItem & { products?: import('@/types').Product })[]>([]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data as (Order & { profiles?: Profile })[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrder = async (order: Order & { profiles?: Profile }) => {
    setSelectedOrder(order);
    const { data } = await supabase
      .from('order_items')
      .select('*, products(*)')
      .eq('order_id', order.id);
    if (data) setOrderItems(data as (OrderItem & { products?: import('@/types').Product })[]);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      alert('Erreur: ' + error.message);
    } else {
      fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions: OrderStatus[] = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Commandes</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Tous les statuts</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-500">Aucune commande trouvée</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((order) => (
              <button
                key={order.id}
                onClick={() => openOrder(order)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{order.order_number}</p>
                  <p className="text-xs text-slate-500">
                    {order.profiles?.full_name ?? 'Client'} - {formatDate(order.created_at)}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <span className="font-bold text-slate-900 text-sm shrink-0">{formatPrice(order.total)}</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{selectedOrder.order_number}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {selectedOrder.profiles?.full_name} - {formatDate(selectedOrder.created_at)}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Status update */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Statut de la commande</label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Paiement</p>
                  <p className="font-medium text-slate-900">{PAYMENT_METHOD_LABELS[selectedOrder.payment_method] ?? selectedOrder.payment_method}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Livraison</p>
                  <p className="font-medium text-slate-900 text-xs">{selectedOrder.delivery_address}</p>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Articles</p>
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-sm">
                    <span className="text-slate-700 flex-1 truncate pr-2">
                      {item.quantity}x {item.products?.name ?? 'Produit'}
                    </span>
                    <span className="font-medium text-slate-900">{formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-emerald-600 text-lg">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
