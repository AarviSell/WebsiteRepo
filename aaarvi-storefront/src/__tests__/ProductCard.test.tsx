// src/__tests__/ProductCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '@/components/product/ProductCard';
import type { Product } from '@/types/product';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-1',
    source_site: 'shipmydeals',
    url: 'https://example.com',
    name: 'Test Lunch Box',
    category: 'home-and-kitchen',
    category_label: 'Home And Kitchen',
    specifications: {},
    images: [],
    scraped_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderCard(product: Product) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>
  );
}

describe('ProductCard', () => {
  it('renders product name', () => {
    renderCard(makeProduct());
    expect(screen.getByText('Test Lunch Box')).toBeTruthy();
  });

  it('renders price when present', () => {
    renderCard(makeProduct({ price: '₹299/piece' }));
    expect(screen.getByText('₹299/piece')).toBeTruthy();
  });

  it('renders brand when present', () => {
    renderCard(makeProduct({ brand: 'Cello' }));
    expect(screen.getByText('Cello')).toBeTruthy();
  });

  it('renders seller location when present', () => {
    renderCard(makeProduct({ seller_location: 'Mumbai' }));
    expect(screen.getByText(/Mumbai/)).toBeTruthy();
  });

  it('renders fallback image when no images', () => {
    const { container } = renderCard(makeProduct({ images: [] }));
    const img = container.querySelector('img') as HTMLImageElement;
    expect(img.src).toMatch(/data:image\/svg\+xml/);
  });

  it('renders a link to the product detail page', () => {
    const { container } = renderCard(makeProduct({ id: 'abc-123' }));
    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/product/abc-123');
  });

  it('renders with no price gracefully', () => {
    expect(() => renderCard(makeProduct({ price: undefined }))).not.toThrow();
  });
});
