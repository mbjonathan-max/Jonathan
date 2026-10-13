import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronRight, CreditCard, Smartphone, Banknote, Building2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatPrice, PAYMENT_METHODS, type OrderStatus } from '@/types';

const PAYMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  card: CreditCard,
  mobile_money: Smartphone,
  cash_on_delivery: Banknote,
  bank_transfer: Building2,
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [deliveryAddress, setDeliveryAddress] = useState(profile?.address ?? '');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SHIPPING_FEE = 2500;
  const total = subtotal + SHIPPING_FEE;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Panier vide</h1>
        <p className="text-slate-500 mb-6">Ajoutez des produits avant de passer commande</p>
        <Link to="/catalog" className="text-emerald-600 font-medium hover:underline">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!deliveryAddress.trim()) {
      setError('Veuillez saisir votre adresse de livraison');
      return;
    }
    if (!profile) {
      setError('Veuillez vous connecter pour passer commande');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const year = new Date().getFullYear();
      const { data: seqData } = await supabase.rpc('nextval_order_seq');
      const seqNum = seqData ?? 1;
      const orderNumber = `CMD-${year}-${String(seqNum).padStart(6, '0')}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: profile.id,
          total,
          status: 'pending' as OrderStatus,
          payment_method: paymentMethod,
          delivery_address: deliveryAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      const { data: invSeqData } = await supabase.rpc('nextval_invoice_seq');
      const invSeqNum = invSeqData ?? 1;
      const invoiceNumber = `FAC-${year}-${String(invSeqNum).padStart(6, '0')}`;

      await supabase.from('invoices').insert({
        invoice_number: invoiceNumber,
        order_id: order.id,
      });

      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
        <Link to="/cart" className="hover:text-slate-700">Panier</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium">Validation</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Finaliser la commande</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Adresse de livraison</h2>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={3}
              placeholder="Saisissez votre adresse complète de livraison..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Mode de paiement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => {
                const Icon = PAYMENT_ICONS[method.id] ?? CreditCard;
                const active = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{method.label}</p>
                    </div>
                    {active && <Check className="w-5 h-5 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-lg p-3">
              Le paiement est simulé pour cette démo. Aucun montant ne sera débité.
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-20">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Votre commande</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-slate-600 flex-1 truncate pr-2">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-medium text-slate-900 whitespace-nowrap">
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total</span>
                <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Livraison</span>
                <span className="font-medium text-slate-900">{formatPrice(SHIPPING_FEE)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-emerald-600 text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? 'Traitement...' : 'Confirmer la commande'}
              {!submitting && <Check className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
