import type { CategoryNode } from '@/types/product';

export interface CollectionMeta {
  slug: string;
  label: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number | null;
}

export const COLLECTIONS: CollectionMeta[] = [
  { slug: 'standard-collection', label: 'Standard Collection', priceRange: 'Rs. 20-50', minPrice: 20, maxPrice: 50 },
  { slug: 'business-collection', label: 'Business Collection', priceRange: 'Rs. 50-100', minPrice: 50, maxPrice: 100 },
  { slug: 'signature-collection', label: 'Signature Collection', priceRange: 'Rs. 100-200', minPrice: 100, maxPrice: 200 },
  { slug: 'preferred-collection', label: 'Preferred Collection', priceRange: 'Rs. 200-300', minPrice: 200, maxPrice: 300 },
  { slug: 'premium-collection', label: 'Premium Collection', priceRange: 'Rs. 300-400', minPrice: 300, maxPrice: 400 },
  { slug: 'executive-collection', label: 'Executive Collection', priceRange: 'Rs. 400-600', minPrice: 400, maxPrice: 600 },
  { slug: 'chairman-collection', label: 'Chairman Collection', priceRange: 'Rs. 600-1,000', minPrice: 600, maxPrice: 1000 },
  { slug: 'legacy-collection', label: 'Legacy Collection', priceRange: 'Rs. 1,000+', minPrice: 1000, maxPrice: null },
];

export function getCollectionMeta(slug?: string | null): CollectionMeta | undefined {
  if (!slug) return undefined;
  return COLLECTIONS.find(collection => collection.slug === slug);
}

export function getCollectionPriceRange(slug?: string | null): string {
  return getCollectionMeta(slug)?.priceRange ?? 'Custom range';
}

export function getCollectionLabelWithRange(category: Pick<CategoryNode, 'slug' | 'label'>): string {
  const range = getCollectionPriceRange(category.slug);
  return `${category.label} (${range})`;
}

export function sortCollections<T extends { slug: string }>(items: T[]): T[] {
  const order = new Map(COLLECTIONS.map((collection, index) => [collection.slug, index]));
  return [...items].sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999));
}