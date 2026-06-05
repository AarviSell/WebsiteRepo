import type { Product } from '@/types/product';

/** Replace em/en dashes in customer-facing product copy with a simple hyphen. */
export function normalizeProductText(value: string): string {
  return value
    .replace(/\s+\u2014\s+/g, ' - ')
    .replace(/\s+\u2013\s+/g, ' - ')
    .replace(/\u2014/g, ' - ')
    .replace(/\u2013/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeProduct<T extends Product>(product: T): T {
  return {
    ...product,
    name: normalizeProductText(product.name),
    description: product.description ? normalizeProductText(product.description) : product.description,
  };
}

export function normalizeProducts<T extends Product>(products: T[]): T[] {
  return products.map(normalizeProduct);
}
