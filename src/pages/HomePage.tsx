import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, CreditCard, Headphones, Cpu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import { formatPrice } from '@/types';

export default function HomePage() {
  const [featured, setFeatured] = useState<(Product & { category?: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      if (cats) setCategories(cats as Category[]);

      const { data: prods } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false })
        .limit(8);
      if (prods) setFeatured(prods as (Product & { category?: Category })[]);
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <div className="w-full h-full bg-gradient-to-l from-emerald-500 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">Matériel informatique professionnel - Congo Brazzaville</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Tout pour votre <span className="text-emerald-400">setup informatique</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Ordinateurs, composants, périphériques et accessoires. Des marques de qualité, au meilleur prix, livrés rapidement.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Voir le catalogue
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur text-white font-semibold hover:bg-white/20 transition-colors border border-white/10"
              >
                Découvrir les offres
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustBadge icon={Truck} title="Livraison 48h" desc="À Brazzaville et banlieue" />
            <TrustBadge icon={ShieldCheck} title="Garantie 12 mois" desc="Sur tous les produits" />
            <TrustBadge icon={CreditCard} title="Paiement sécurisé" desc="Plusieurs moyens disponibles" />
            <TrustBadge icon={Headphones} title="Support 7j/7" desc="Assistance technique" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Nos catégories</h2>
        <p className="text-slate-500 mb-8">Trouvez exactement ce qu'il vous faut</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                <Cpu className="w-6 h-6 text-slate-600 group-hover:text-emerald-500 transition-colors" />
              </div>
              <span className="text-sm font-medium text-slate-700 text-center group-hover:text-emerald-600 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Nouveautés</h2>
            <p className="text-slate-500">Les derniers produits ajoutés au catalogue</p>
          </div>
          <Link to="/catalog" className="hidden sm:inline-flex items-center gap-1 text-emerald-600 font-medium text-sm hover:gap-2 transition-all">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCardMini key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TrustBadge({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function ProductCardMini({ product }: { product: Product & { category?: Category } }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all"
    >
      <div className="aspect-square bg-slate-100 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Cpu className="w-12 h-12 text-slate-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-emerald-600 font-medium mb-1">{product.brand}</p>
        <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-base font-bold text-slate-900">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
