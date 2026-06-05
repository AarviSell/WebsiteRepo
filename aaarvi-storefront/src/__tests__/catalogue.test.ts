import { describe, expect, it } from 'vitest';
import { getCataloguePageSource, getProductCode } from '@/utils/catalogue';
import type { Product } from '@/types/product';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-id',
    source_site: 'shipmydeals',
    url: 'https://example.com',
    name: 'Test Product',
    category: 'signature-collection',
    category_label: 'Standard Collection',
    specifications: {},
    images: [],
    scraped_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('getProductCode', () => {
  it('normalizes product_code whitespace', () => {
    expect(getProductCode(makeProduct({ product_code: '  L   177  ' }))).toBe('L 177');
  });

  it('falls back to product code specifications', () => {
    expect(getProductCode(makeProduct({ specifications: { 'Product Code': 'J 116A' } }))).toBe('J 116A');
  });
});

describe('getCataloguePageSource', () => {
  it('derives PDF metadata from cropped catalogue image paths', () => {
    const source = getCataloguePageSource(makeProduct({
      product_code: 'L 177',
      images: [
        {
          url: '',
          local_path: 'cropped/low-range-20-50/2.jpg',
          filename: '2.jpg',
          is_primary: true,
          download_status: 'success',
        },
      ],
    }));

    expect(source).toMatchObject({
      imagePath: 'catalogue-pages/low-range-20-50/3.png',
      imageUrl: '/data/catalogue-pages/low-range-20-50/3.png',
      fallbackImagePath: 'cropped/low-range-20-50/2.jpg',
      fallbackImageUrl: '/data/cropped/low-range-20-50/2.jpg',
      isPdfPage: true,
      pdfName: 'low-range-20-50.pdf',
      pageNumber: 3,
      imageIndex: 2,
      productCode: 'L 177',
    });
    expect(source?.label).toContain('low-range-20-50.pdf');
    expect(source?.label).toContain('page 3');
    expect(source?.label).toContain('code L 177');
  });

  it('lets explicit catalogue metadata override derived values', () => {
    const source = getCataloguePageSource(makeProduct({
      catalogue_page_path: 'cropped/premium-400-600/10.png',
      catalogue_pdf: 'premium-catalogue.pdf',
      catalogue_page: 12,
      catalogue_image_index: 9,
    }));

    expect(source).toMatchObject({
      imagePath: 'catalogue-pages/premium-catalogue/12.png',
      fallbackImagePath: 'cropped/premium-400-600/10.png',
      pdfName: 'premium-catalogue.pdf',
      pageNumber: 12,
      imageIndex: 9,
      isPdfPage: true,
    });
  });

  it('uses explicit catalogue page renders directly', () => {
    const source = getCataloguePageSource(makeProduct({
      catalogue_page_path: 'catalogue-pages/low-range-20-50/2.png',
    }));

    expect(source).toMatchObject({
      imagePath: 'catalogue-pages/low-range-20-50/2.png',
      imageUrl: '/data/catalogue-pages/low-range-20-50/2.png',
      pdfName: 'low-range-20-50.pdf',
      pageNumber: 2,
      imageIndex: 1,
      isPdfPage: true,
    });
    expect(source?.fallbackImageUrl).toBeUndefined();
  });

  it('keeps derived page numbers inside the known PDF page count', () => {
    const source = getCataloguePageSource(makeProduct({
      images: [
        {
          url: '',
          local_path: 'cropped/low-range-20-50/65.jpg',
          filename: '65.jpg',
          is_primary: true,
          download_status: 'success',
        },
      ],
    }));

    expect(source).toMatchObject({
      imagePath: 'catalogue-pages/low-range-20-50/65.png',
      pageNumber: 65,
      imageIndex: 65,
    });
  });

  it('treats ordinary product images as product-image sources', () => {
    const source = getCataloguePageSource(makeProduct({
      images: [
        {
          url: '',
          local_path: 'shipmydeals/best-sellers/images/item.jpg',
          filename: 'item.jpg',
          is_primary: true,
          download_status: 'success',
        },
      ],
    }));

    expect(source).toMatchObject({
      imagePath: 'shipmydeals/best-sellers/images/item.jpg',
      imageUrl: '/data/shipmydeals/best-sellers/images/item.jpg',
      isPdfPage: false,
      label: 'Product image',
    });
  });

  it('returns null when no catalogue path or usable image exists', () => {
    expect(getCataloguePageSource(makeProduct())).toBeNull();
  });
});