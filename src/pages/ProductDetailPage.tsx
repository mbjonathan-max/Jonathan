import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronRight, ShoppingCart, Minus, Plus, Check, Cpu, Truck, ShieldCheck } from 'lucide-react';
import { useProduct } from '@/hooks/useCatalog';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { product, loading } = useProduct(id);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-slate-100 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-8 bg-slate-100 rounded w-3/4" />
            <div className="h-6 bg-slate-100 rounded w-1/3" />
            <div className="h-24 bg-slate-100 rounded" />
            <div className="h-12 bg-slate-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Cpu className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Produit introuvable</h1>
        <Link to="/catalog" className="text-emerald-600 font-medium hover:underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-slate-700">Accueil</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/catalog" className="hover:text-slate-700">Catalogue</Link>
        {product.category && (
          <>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/category/${product.category.slug}`} className="hover:text-slate-700">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="aspect-square bg-white rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Cpu className="w-24 h-24 text-slate-300" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-emerald-600 mb-2">{product.brand}</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-3">{product.name}</h1>
          <p className="text-3xl font-bold text-slate-900 mb-4">{formatPrice(product.price)}</p>

          <div className="flex items-center gap-2 mb-6">
            {outOfStock ? (
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium border border-red-200">
                Rupture de stock
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium border border-emerald-200">
                En stock ({product.stock} disponible{product.stock > 1 ? 's' : ''})
              </span>
            )}
            <span className="text-sm text-slate-400">Réf: {product.reference}</span>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">{product.description}</p>

          {/* Specs */}
          {product.specs && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Caractéristiques techniques</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{product.specs}</p>
            </div>
          )}

          {/* Quantity + actions */}
          {!outOfStock && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-slate-100 transition-colors"
                >
                  <Minus className="w-4 h-4 text-slate-600" />
                </button>
                <span className="px-4 py-3 font-semibold text-slate-900 min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-3 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                  added ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {added ? (
                  <><Check className="w-5 h-5" /> Ajouté !</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Ajouter au panier</>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Acheter maintenant
              </button>
            </div>
          )}

          {/* Trust */}
          <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-slate-600">Livraison 48h</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-slate-600">Garantie 12 mois</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
