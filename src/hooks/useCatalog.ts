import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        setCategories(data as Category[]);
      }
      setLoading(false);
    })();
  }, []);

  return { categories, loading };
}

export function useProducts(categorySlug?: string, searchQuery?: string) {
  const [products, setProducts] = useState<
    (import('@/types').Product & { category?: import('@/types').Category })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%,reference.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
    } else {
      let filtered = data as (import('@/types').Product & { category?: import('@/types').Category })[];
      if (categorySlug) {
        filtered = filtered.filter((p) => p.category?.slug === categorySlug);
      }
      setProducts(filtered);
    }
    setLoading(false);
  }, [categorySlug, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, refetch: fetchProducts };
}

export function useProduct(productId: string | undefined) {
  const [product, setProduct] = useState<(import('@/types').Product & { category?: import('@/types').Category }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('id', productId)
        .maybeSingle();
      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setProduct(data as (import('@/types').Product & { category?: import('@/types').Category }) | null);
      }
      setLoading(false);
    })();
  }, [productId]);

  return { product, loading };
}
