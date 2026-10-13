import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Cpu, ShoppingCart, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import type { Product, Category } from '@/types';
import { formatPrice } from '@/types';

export default function CatalogPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [products, setProducts] = useState<(Product & { category?: Category })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name'>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(slug ?? null);
  const { addToCart } = useCart();

  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      if (cats) setCategories(cats as Category[]);
    })();
  }, []);

  useEffect(() => {
    setSelectedCategory(slug ?? null);
  }, [slug]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*, category:categories(*)');

      if (search) {
        query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,reference.ilike.%${search}%`);
      }

      if (sortBy === 'price_asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price_desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'name') query = query.order('name', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        let filtered = data as (Product & { category?: Category })[];
        if (selectedCategory) {
          filtered = filtered.filter((p) => p.category?.slug === selectedCategory);
        }
        setProducts(filtered);
      }
      setLoading(false);
    })();
  }, [search, sortBy, selectedCategory]);

  const activeCategory = categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-slate-700">Accueil</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/catalog" className="hover:text-slate-700">Catalogue</Link>
        {activeCategory && (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">{activeCategory.name}</span>
          </>
        )}
      </nav>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {activeCategory ? activeCategory.name : 'Catalogue complet'}
      </h1>
      <p className="text-slate-500 mb-8">{products.length} produit(s) disponible(s)</p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sticky top-20">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Catégories
            </h3>
            <div className="space-y-1">
              <CategoryLink
                label="Tous les produits"
                active={!selectedCategory}
                onClick={() => setSelectedCategory(null)}
                to="/catalog"
              />
              {categories.map((cat) => (
                <CategoryLink
                  key={cat.id}
                  label={cat.name}
                  active={selectedCategory === cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  to={`/category/${cat.slug}`}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {/* Search + sort bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un produit, une marque..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">Plus récents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="name">Nom (A-Z)</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Aucun produit trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product, 1)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryLink({ label, active, onClick, to }: { label: string; active: boolean; onClick: () => void; to: string }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </Link>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product & { category?: Category }; onAddToCart: () => void }) {
  const outOfStock = product.stock <= 0;
  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all flex flex-col">
      <Link to={`/product/${product.id}`} className="aspect-square bg-slate-100 overflow-hidden relative">
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
        {outOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">Rupture de stock</span>
          </div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-emerald-600 font-medium mb-1">{product.brand}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2 hover:text-emerald-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-slate-500 mb-3 line-clamp-1">{product.specs}</p>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-slate-900">{formatPrice(product.price)}</span>
          <button
            onClick={onAddToCart}
            disabled={outOfStock}
            className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Ajouter au panier"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
