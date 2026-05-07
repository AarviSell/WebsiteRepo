// src/data/loader.ts
// Use static imports for Vite bundling — JSON is code-split via dynamic import.
import type { Product, CategoryNode } from '@/types/product';

export async function loadAllProducts(): Promise<Product[]> {
  const mod = await import('@/data/products.json');
  return mod.default as Product[];
}

export async function loadCategories(): Promise<CategoryNode[]> {
  const mod = await import('@/data/categories.json');
  return mod.default as CategoryNode[];
}

export async function loadCategoryProducts(slug: string): Promise<Product[]> {
  try {
    const mod = await import(`@/data/categories/${slug}.json`);
    return mod.default as Product[];
  } catch {
    return [];
  }
}
