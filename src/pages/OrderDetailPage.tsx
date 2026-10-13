import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Package, Cpu } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, Invoice } from '@/types';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PAYMENT_METHOD_LABELS } from '@/types';
import { generateInvoicePDF } from '@/lib/pdf';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<(OrderItem & { products?: import('@/types').Product })[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (orderError || !orderData) {
        setLoading(false);
        return;
      }
      setOrder(orderData as Order);

      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*, products(*)')
        .eq('order_id', id);
      if (itemsData) setItems(itemsData as (OrderItem & { products?: import('@/types').Product })[]);

      const { data: invData } = await supabase
        .from('invoices')
        .select('*')
        .eq('order_id', id)
        .maybeSingle();
      if (invData) setInvoice(invData as Invoice);

      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 animate-pulse">
          <div className="h-8 bg-slate-100 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-100 rounded w-1/2 mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Cpu className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Commande introuvable</h1>
        <Link to="/orders" className="text-emerald-600 font-medium hover:underline">
          Retour à mes commandes
        </Link>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    generateInvoicePDF(order, items, invoice);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour aux commandes
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-6 h-6 text-slate-400" />
                <h1 className="text-2xl font-bold text-slate-900">{order.order_number}</h1>
              </div>
              <p className="text-sm text-slate-500">{formatDate(order.created_at)}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Mode de paiement</p>
            <p className="text-sm font-medium text-slate-900">{PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Adresse de livraison</p>
            <p className="text-sm font-medium text-slate-900">{order.delivery_address}</p>
          </div>
          {invoice && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Facture</p>
              <p className="text-sm font-medium text-slate-900">{invoice.invoice_number}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Produits commandés</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                <div className="w-14 h-14 rounded-lg bg-white border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                  ) : (
                    <Cpu className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm line-clamp-1">{item.products?.name ?? 'Produit'}</p>
                  <p className="text-xs text-slate-500">
                    {item.quantity} x {formatPrice(item.unit_price)}
                  </p>
                </div>
                <p className="font-semibold text-slate-900 shrink-0">{formatPrice(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="font-bold text-slate-900">Total</span>
            <span className="font-bold text-emerald-600 text-xl">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Télécharger la facture PDF
          </button>
        </div>
      </div>
    </div>
  );
}
