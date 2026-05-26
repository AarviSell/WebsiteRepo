// src/data/loader.ts
// Use static imports for Vite bundling — JSON is code-split via dynamic import.
import type { Product, CategoryNode } from '@/types/product';

const categoryProductModules = import.meta.glob<{ default: Product[] }>('./categories/*.json');

function mergeProducts(productGroups: Product[][]): Product[] {
  const byId = new Map<string, Product>();
  for (const group of productGroups) {
    for (const product of group) {
      if (!byId.has(product.id)) byId.set(product.id, product);
    }
  }
  return Array.from(byId.values());
}

export async function loadAllProducts(): Promise<Product[]> {
  const mod = await import('@/data/products.json');
  const baseProducts = mod.default as Product[];
  const categoryProducts = await Promise.all(
    Object.values(categoryProductModules).map(async loadModule => {
      try {
        const categoryMod = await loadModule();
        return categoryMod.default as Product[];
      } catch {
        return [];
      }
    }),
  );
  return mergeProducts([baseProducts, ...categoryProducts]);
}

export async function loadCategories(): Promise<CategoryNode[]> {
  const mod = await import('@/data/categories.json');
  return mod.default as CategoryNode[];
}

export async function loadCategoryProducts(slug: string): Promise<Product[]> {
  const loadModule = categoryProductModules[`./categories/${slug}.json`];
  if (!loadModule) return [];
  const mod = await loadModule();
  return mod.default as Product[];
}
