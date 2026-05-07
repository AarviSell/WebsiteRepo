// src/__tests__/useFilters.test.ts
import { describe, it, expect } from 'vitest';
import type { Product, FilterState } from '@/types/product';

// Test the pure filter logic independently from React hooks
function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: `id-${Math.random()}`,
    source_site: 'shipmydeals',
    url: 'https://example.com',
    name: 'Test Product',
    category: 'home-and-kitchen',
    category_label: 'Home And Kitchen',
    price: '₹200',
    price_numeric: 200,
    specifications: {},
    images: [],
    scraped_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function applyFilters(products: Product[], filters: Partial<FilterState>): Product[] {
  const f: FilterState = {
    query: '',
    sources: [],
    category: null,
    subcategory: null,
    minPrice: null,
    maxPrice: null,
    hasImages: false,
    hasDescription: false,
    sortBy: 'relevance',
    page: 1,
    ...filters,
  };

  let result = [...products];

  if (f.sources.length > 0) result = result.filter(p => f.sources.includes(p.source_site));
  if (f.category) result = result.filter(p => p.category === f.category);
  if (f.subcategory) result = result.filter(p => p.subcategory === f.subcategory);
  if (f.minPrice !== null) result = result.filter(p => p.price_numeric != null && p.price_numeric >= f.minPrice!);
  if (f.maxPrice !== null) result = result.filter(p => p.price_numeric != null && p.price_numeric <= f.maxPrice!);
  if (f.hasImages) result = result.filter(p => p.images.some(img => img.download_status === 'success'));
  if (f.hasDescription) result = result.filter(p => Boolean(p.description?.trim()));

  return result;
}

describe('useFilters — filter logic', () => {
  it('returns all products with no filters', () => {
    const products = [makeProduct(), makeProduct(), makeProduct()];
    expect(applyFilters(products, {})).toHaveLength(3);
  });

  it('filters by source', () => {
    const products = [
      makeProduct({ source_site: 'indiamart' }),
      makeProduct({ source_site: 'shipmydeals' }),
    ];
    expect(applyFilters(products, { sources: ['indiamart'] })).toHaveLength(1);
    expect(applyFilters(products, { sources: ['shipmydeals'] })).toHaveLength(1);
    expect(applyFilters(products, { sources: ['indiamart', 'shipmydeals'] })).toHaveLength(2);
  });

  it('filters by category', () => {
    const products = [
      makeProduct({ category: 'essentials' }),
      makeProduct({ category: 'home-and-kitchen' }),
    ];
    expect(applyFilters(products, { category: 'essentials' })).toHaveLength(1);
  });

  it('filters by price range', () => {
    const products = [
      makeProduct({ price_numeric: 50 }),
      makeProduct({ price_numeric: 200 }),
      makeProduct({ price_numeric: 500 }),
    ];
    expect(applyFilters(products, { minPrice: 100, maxPrice: 300 })).toHaveLength(1);
  });

  it('skips products without price_numeric for price filter', () => {
    const products = [
      makeProduct({ price_numeric: undefined }),
      makeProduct({ price_numeric: 200 }),
    ];
    expect(applyFilters(products, { minPrice: 100 })).toHaveLength(1);
  });

  it('filters by hasImages', () => {
    const products = [
      makeProduct({ images: [] }),
      makeProduct({ images: [{ url: 'u', local_path: 'p', filename: 'f', is_primary: true, download_status: 'success' }] }),
    ];
    expect(applyFilters(products, { hasImages: true })).toHaveLength(1);
  });

  it('filters by hasDescription', () => {
    const products = [
      makeProduct({ description: '' }),
      makeProduct({ description: 'A nice product' }),
    ];
    expect(applyFilters(products, { hasDescription: true })).toHaveLength(1);
  });

  it('combines multiple filters', () => {
    const products = [
      makeProduct({ source_site: 'indiamart', price_numeric: 100, description: 'desc' }),
      makeProduct({ source_site: 'shipmydeals', price_numeric: 100, description: 'desc' }),
      makeProduct({ source_site: 'indiamart', price_numeric: 1000 }),
    ];
    const result = applyFilters(products, {
      sources: ['indiamart'],
      maxPrice: 200,
      hasDescription: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].source_site).toBe('indiamart');
  });
});
