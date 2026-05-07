// src/__tests__/useSearch.test.ts
import { describe, it, expect } from 'vitest';
import Fuse from 'fuse.js';
import type { Product } from '@/types/product';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: `id-${overrides.name ?? Math.random()}`,
    source_site: 'shipmydeals',
    url: 'https://example.com',
    name: 'Default Product',
    category: 'essentials',
    category_label: 'Essentials',
    specifications: {},
    images: [],
    scraped_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'description', weight: 0.2 },
    { name: 'category_label', weight: 0.12 },
    { name: 'subcategory_label', weight: 0.10 },
    { name: 'brand', weight: 0.08 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
};

describe('useSearch — fuse search', () => {
  const products = [
    makeProduct({ id: 'a', name: 'Steel Lunch Box', category_label: 'Kitchen' }),
    makeProduct({ id: 'b', name: 'Plastic Water Bottle', category_label: 'Essentials' }),
    makeProduct({ id: 'c', name: 'Washing Powder', category_label: 'Cleaning' }),
    makeProduct({ id: 'd', name: 'Stainless Tiffin Box', category_label: 'Kitchen' }),
  ];

  const index = new Fuse(products, FUSE_OPTIONS);

  it('finds a product by exact name', () => {
    const results = index.search('Steel Lunch Box');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.id).toBe('a');
  });

  it('finds similar items for fuzzy query', () => {
    const results = index.search('tiffin');
    expect(results.some(r => r.item.id === 'd')).toBe(true);
  });

  it('returns empty array for very short query (below minMatchCharLength)', () => {
    const results = index.search('a');
    expect(results).toHaveLength(0);
  });

  it('returns empty array for unrelated query', () => {
    const results = index.search('xxxxxxxxxx');
    expect(results).toHaveLength(0);
  });

  it('respects the limit parameter', () => {
    const results = index.search('Box', { limit: 1 });
    expect(results).toHaveLength(1);
  });
});
