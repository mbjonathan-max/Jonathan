import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Cpu, FileDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { generateCartPDF } from '@/lib/pdf';
import { formatPrice } from '@/types';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal, totalItems, clearCart } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const SHIPPING_FEE = subtotal > 0 ? 2500 : 0;
  const total = subtotal + SHIPPING_FEE;

  const handleDownloadPDF = () => {
    generateCartPDF(items, subtotal, SHIPPING_FEE, total, profile);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Votre panier est vide</h1>
        <p className="text-slate-500 mb-6">Parcourez notre catalogue et ajoutez des produits</p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-700 transition-colors"
        >
          Voir le catalogue <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Mon panier ({totalItems})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 bg-white rounded-2xl border border-slate-200 p-4"
            >
              <Link
                to={`/product/${item.product.id}`}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center"
              >
                {item.product.image_url ? (
                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                ) : (
                  <Cpu className="w-8 h-8 text-slate-300" />
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product.id}`}>
                  <h3 className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors line-clamp-1">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-sm text-slate-500 mb-2">{item.product.brand}</p>
                <p className="text-sm font-semibold text-slate-900">{formatPrice(item.product.price)}</p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-slate-100 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="p-1.5 hover:bg-slate-100 transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs text-slate-400 mb-1">Sous-total</p>
                <p className="font-bold text-slate-900">{formatPrice(item.product.price * item.quantity)}</p>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            Vider le panier
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-20">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Récapitulatif</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Sous-total</span>
                <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Frais de livraison</span>
                <span className="font-medium text-slate-900">{formatPrice(SHIPPING_FEE)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-emerald-600 text-lg">{formatPrice(total)}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
            >
              Passer la commande <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              <FileDown className="w-5 h-5" />
              Télécharger le récapitulatif PDF
            </button>
            <Link
              to="/catalog"
              className="block text-center mt-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
