import { describe, expect, it } from 'vitest';
import { searchProducts, withProductSearchText } from '@/utils/productSearch';
import type { Product } from '@/types/product';

function makeProduct(overrides: Partial<Product>): Product {
  return withProductSearchText({
    id: overrides.id ?? `id-${overrides.name ?? 'product'}`,
    source_site: 'shipmydeals',
    url: 'https://example.com',
    name: overrides.name ?? 'Default Product',
    category: overrides.category ?? 'standard-collection',
    category_label: overrides.category_label ?? 'Standard Collection',
    specifications: overrides.specifications ?? {},
    images: [],
    scraped_at: '2026-01-01T00:00:00Z',
    ...overrides,
  });
}

describe('product scene search', () => {
  const products = [
    makeProduct({ id: 'pizza', name: 'Pizza Cutter with Server', product_code: 'Z 06', category_label: 'Kitchen Tools' }),
    makeProduct({ id: 'pen', name: 'Bamboo Eternal Pen', product_code: 'L 160', category_label: 'Stationery' }),
    makeProduct({ id: 'soap', name: 'Dish Soap Dispenser', category_label: 'Cleaning', specifications: { Type: 'Kitchen Sink Organizer' } }),
  ];

  it('finds products by name', () => {
    expect(searchProducts(products, 'pizza cutter')[0]?.id).toBe('pizza');
  });

  it('finds products by compact product code', () => {
    expect(searchProducts(products, 'L160')[0]?.id).toBe('pen');
  });

  it('finds products by category or type text', () => {
    const results = searchProducts(products, 'sink organizer');
    expect(results.some(product => product.id === 'soap')).toBe(true);
  });
});