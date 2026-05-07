// src/__tests__/image.test.ts
import { describe, it, expect } from 'vitest';
import { resolveImageUrl, getPrimaryImage, getImageFallbackSvg } from '@/utils/image';
import type { Product } from '@/types/product';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-id',
    source_site: 'shipmydeals',
    url: 'https://example.com',
    name: 'Test Product',
    category: 'home-and-kitchen',
    category_label: 'Home And Kitchen',
    specifications: {},
    images: [],
    scraped_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('resolveImageUrl', () => {
  it('prepends the base URL and data/ to a local path', () => {
    // import.meta.env.BASE_URL is '/' in the test environment
    expect(resolveImageUrl('shipmydeals/home/img.jpg')).toBe('/data/shipmydeals/home/img.jpg');
  });
});

describe('getPrimaryImage', () => {
  it('returns null when no images', () => {
    expect(getPrimaryImage(makeProduct())).toBeNull();
  });

  it('returns the primary image when available', () => {
    const product = makeProduct({
      images: [
        { url: 'u', local_path: 'p/img1.jpg', filename: 'img1.jpg', is_primary: false, download_status: 'success' },
        { url: 'u', local_path: 'p/img2.jpg', filename: 'img2.jpg', is_primary: true, download_status: 'success' },
      ],
    });
    expect(getPrimaryImage(product)?.filename).toBe('img2.jpg');
  });

  it('falls back to first successful image if no primary', () => {
    const product = makeProduct({
      images: [
        { url: 'u', local_path: 'p/img1.jpg', filename: 'img1.jpg', is_primary: false, download_status: 'success' },
        { url: 'u', local_path: 'p/img2.jpg', filename: 'img2.jpg', is_primary: false, download_status: 'success' },
      ],
    });
    expect(getPrimaryImage(product)?.filename).toBe('img1.jpg');
  });

  it('skips failed images', () => {
    const product = makeProduct({
      images: [
        { url: 'u', local_path: 'p/img1.jpg', filename: 'img1.jpg', is_primary: true, download_status: 'failed' },
        { url: 'u', local_path: 'p/img2.jpg', filename: 'img2.jpg', is_primary: false, download_status: 'success' },
      ],
    });
    expect(getPrimaryImage(product)?.filename).toBe('img2.jpg');
  });

  it('returns null when all images failed', () => {
    const product = makeProduct({
      images: [
        { url: 'u', local_path: 'p/img1.jpg', filename: 'img1.jpg', is_primary: true, download_status: 'failed' },
      ],
    });
    expect(getPrimaryImage(product)).toBeNull();
  });
});

describe('getImageFallbackSvg', () => {
  it('returns a data URI', () => {
    const svg = getImageFallbackSvg('Test Product');
    expect(svg).toMatch(/^data:image\/svg\+xml,/);
  });

  it('includes uppercase initials', () => {
    const svg = getImageFallbackSvg('Steel Lunch Box');
    expect(svg).toContain('SL');
  });

  it('handles single word', () => {
    const svg = getImageFallbackSvg('Soap');
    expect(svg).toContain('S');
  });
});
