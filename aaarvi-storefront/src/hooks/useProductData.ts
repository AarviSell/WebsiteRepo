// src/hooks/useProductData.ts
import { useProductStore } from '@/store/useProductStore';
import type { CategoryNode } from '@/types/product';

export function useProductData() {
  const { allProducts, categories, isLoaded, loadError } = useProductStore();

  function getCategoryBySlug(slug: string): CategoryNode | undefined {
    return categories.find(c => c.slug === slug);
  }

  return { allProducts, categories, isLoaded, loadError, getCategoryBySlug };
}
