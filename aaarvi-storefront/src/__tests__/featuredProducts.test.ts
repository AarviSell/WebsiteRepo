import { describe, expect, it } from 'vitest';
import {
  getFeaturedCatalogProducts,
  getLegacyFeaturedProducts,
  isFeaturedCatalogProduct,
  selectFeaturedProducts,
} from '@/utils/featuredProducts';
import type { Product } from '@/types/product';

function product(partial: Partial<Product> & Pick<Product, 'id' | 'name'>): Product {
  return {
    source_site: 'shipmydeals',
    url: '',
    category: 'preferred-collection',
    category_label: 'Preferred Collection',
    specifications: {},
    images: [],
    scraped_at: '',
    ...partial,
  };
}

describe('featuredProducts', () => {
  it('detects bag catalogue products by code and image path', () => {
    expect(
      isFeaturedCatalogProduct(
        product({ id: 'bag-1', name: 'Bag', product_code: 'B1:PR-101' }),
      ),
    ).toBe(true);

    expect(
      isFeaturedCatalogProduct(
        product({
          id: 'bag-2',
          name: 'Bag',
          images: [
            {
              url: '',
              local_path: 'product-images/bags-2026/12.jpg',
              filename: '12.jpg',
              is_primary: true,
              download_status: 'success',
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it('detects canvas tote products by code and image path', () => {
    expect(
      isFeaturedCatalogProduct(
        product({ id: 'tote-1', name: 'Tote', product_code: 'A1 012', category: 'signature-collection' }),
      ),
    ).toBe(true);

    expect(
      isFeaturedCatalogProduct(
        product({
          id: 'tote-2',
          name: 'Tote',
          images: [
            {
              url: '',
              local_path: 'canvas-totes/signature-collection/images/example.png',
              filename: 'example.png',
              is_primary: true,
              download_status: 'success',
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it('treats non-import Legacy products as older featured candidates', () => {
    expect(
      isFeaturedCatalogProduct(
        product({
          id: 'other',
          name: 'Steel Bottle',
          product_code: 'H71',
          category: 'legacy-collection',
        }),
      ),
    ).toBe(false);

    expect(
      getLegacyFeaturedProducts([
        product({ id: 'legacy', name: 'Steel Bottle', product_code: 'H71', category: 'legacy-collection' }),
        product({ id: 'bag', name: 'Bag', product_code: 'B1:F-201', category: 'preferred-collection' }),
      ]).map(item => item.id),
    ).toEqual(['legacy']);
  });

  it('mixes new imports and older Legacy products on a limited featured page', () => {
    const catalog = [
      product({ id: 'bag', name: 'Bag', product_code: 'B1:F-201' }),
      product({ id: 'tote', name: 'Tote', product_code: 'A1 001', category: 'signature-collection' }),
      product({ id: 'legacy-a', name: 'Bottle A', product_code: 'H71', category: 'legacy-collection' }),
      product({ id: 'legacy-b', name: 'Bottle B', product_code: 'H72', category: 'legacy-collection' }),
      product({ id: 'other', name: 'Notebook', product_code: 'X1', category: 'signature-collection' }),
    ];

    expect(getFeaturedCatalogProducts(catalog).map(item => item.id).sort()).toEqual(['bag', 'tote']);

    const limited = selectFeaturedProducts(catalog, 4);
    expect(limited).toHaveLength(4);

    const ids = new Set(limited.map(item => item.id));
    expect([...ids].some(id => id === 'bag' || id === 'tote')).toBe(true);
    expect([...ids].some(id => id === 'legacy-a' || id === 'legacy-b')).toBe(true);
    expect(ids.has('other')).toBe(false);
  });
});
