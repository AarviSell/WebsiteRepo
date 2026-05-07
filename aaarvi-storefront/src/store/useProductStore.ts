// src/store/useProductStore.ts
import { create } from 'zustand';
import Fuse from 'fuse.js';
import type { Product, CategoryNode } from '@/types/product';
import { loadAllProducts, loadCategories } from '@/data/loader';

const fuseOptions: Fuse.IFuseOptions<Product> = {
  keys: [
    { name: 'name',              weight: 0.50 },
    { name: 'description',       weight: 0.20 },
    { name: 'category_label',    weight: 0.12 },
    { name: 'subcategory_label', weight: 0.10 },
    { name: 'brand',             weight: 0.08 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: true,
};

interface ProductStore {
  // Data
  allProducts: Product[];
  categories: CategoryNode[];
  fuse: Fuse<Product> | null;
  isLoaded: boolean;
  loadError: string | null;

  // UI state
  theme: 'light' | 'dark';

  // Actions
  loadData: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (category: string, subcategory?: string) => Product[];
  getFeaturedProducts: (count: number) => Product[];
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  allProducts: [],
  categories: [],
  fuse: null,
  isLoaded: false,
  loadError: null,
  theme: (document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | null) ?? 'light',

  loadData: async () => {
    if (get().isLoaded) return;
    try {
      const [products, categories] = await Promise.all([
        loadAllProducts(),
        loadCategories(),
      ]);
      const fuse = new Fuse(products, fuseOptions);
      set({ allProducts: products, categories, fuse, isLoaded: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      if (import.meta.env.DEV) console.error('[AArvi] Data load error:', err);
      set({ loadError: msg, isLoaded: true });
    }
  },

  getProductById: (id: string) => {
    return get().allProducts.find(p => p.id === id);
  },

  getProductsByCategory: (category: string, subcategory?: string) => {
    const products = get().allProducts;
    return products.filter(p => {
      if (p.category !== category) return false;
      if (subcategory && p.subcategory !== subcategory) return false;
      return true;
    });
  },

  getFeaturedProducts: (count: number) => {
    const { allProducts } = get();
    if (allProducts.length === 0) return [];

    const indiamart = allProducts.filter(p => p.source_site === 'indiamart');
    const shipmydeals = allProducts.filter(p => p.source_site === 'shipmydeals');

    const perSource = Math.floor(count / 3);
    const take = <T>(arr: T[], n: number): T[] => arr.slice(0, n);

    const featured: Product[] = [
      ...take(indiamart, perSource),
      ...take(shipmydeals, perSource),
    ];

    // Fill remainder with random products not already included
    const featuredIds = new Set(featured.map(p => p.id));
    const remaining = allProducts.filter(p => !featuredIds.has(p.id));
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    featured.push(...shuffled.slice(0, count - featured.length));

    return featured.slice(0, count);
  },

  setTheme: (theme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));
