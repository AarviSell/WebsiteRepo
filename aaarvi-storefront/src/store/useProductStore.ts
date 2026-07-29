// src/store/useProductStore.ts
import { create } from 'zustand';
import Fuse from 'fuse.js';
import type { Product, CategoryNode } from '@/types/product';
import { loadAllProducts, loadCategories } from '@/data/loader';
import { withProductSearchText } from '@/utils/productSearch';
import { selectFeaturedProducts } from '@/utils/featuredProducts';

const fuseOptions: Fuse.IFuseOptions<Product> = {
  keys: [
    { name: 'name',              weight: 0.50 },
    { name: 'description',       weight: 0.20 },
    { name: 'product_code',      weight: 0.24 },
    { name: 'search_text',       weight: 0.18 },
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

function hydrateCategoryCounts(categories: CategoryNode[], products: Product[]): CategoryNode[] {
  return categories.map(category => {
    const categoryProducts = products.filter(product => product.category === category.slug);
    return {
      ...category,
      count: categoryProducts.length,
      source_sites: Array.from(new Set(categoryProducts.map(product => product.source_site))),
    };
  });
}

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
      const searchableProducts = products.map(withProductSearchText);
      const fuse = new Fuse(searchableProducts, fuseOptions);
      set({ allProducts: searchableProducts, categories: hydrateCategoryCounts(categories, searchableProducts), fuse, isLoaded: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      if (import.meta.env.DEV) console.error('[Aarvi] Data load error:', err);
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
    return selectFeaturedProducts(allProducts, count);
  },

  setTheme: (theme: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));
