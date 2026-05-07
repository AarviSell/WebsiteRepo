// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Sparkles, Star, Zap, Home, Paintbrush, Package, Eye,
} from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CategoryTree } from '@/components/filters/CategoryTree';
import { useProductStore } from '@/store/useProductStore';
import { useProductData } from '@/hooks/useProductData';
import type { CategoryNode } from '@/types/product';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>> = {
  'home-and-kitchen': Home,
  'cleaning-product': Paintbrush,
  'essentials': Package,
  'best-sellers': Star,
  'in-the-spotlight': Eye,
};

function CategoryCard({ cat }: { cat: CategoryNode }) {
  const Icon = CATEGORY_ICONS[cat.slug] ?? ShoppingBag;

  return (
    <Link
      to={`/category/${cat.slug}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--space-2)',
        padding: 'var(--space-4)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 180ms, transform 180ms',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
      }}
    >
      <Icon size={24} aria-hidden={true} style={{ color: 'var(--color-primary)' }} />
      <div>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>
          {cat.label}
        </p>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          {cat.count} products
        </p>
      </div>
    </Link>
  );
}

export function HomePage() {
  const { getFeaturedProducts } = useProductStore();
  const { categories, allProducts, isLoaded } = useProductData();

  const featured = isLoaded ? getFeaturedProducts(12) : [];

  return (
    <main id="main-content">
      {/* Section 1 — Hero Banner */}
      <section
        style={{
          minHeight: 280,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in oklch, var(--color-primary) 30%, var(--color-bg)) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-12) var(--space-4)',
          gap: 'var(--space-6)',
        }}
        aria-label="Hero banner"
      >
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 400,
              color: '#ffffff',
              margin: '0 0 var(--space-2)',
              letterSpacing: '0.01em',
            }}
          >
            AArvi
          </h1>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'rgba(255,255,255,0.85)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Sparkles size={16} aria-hidden="true" />
            India's Smart Product Catalog
          </p>
        </div>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <SearchBar />
        </div>
      </section>

      <div style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: '0 var(--space-4)' }}>

        {/* Section 2 — Top Categories */}
        <section style={{ paddingBlock: 'var(--space-10)' }} aria-labelledby="browse-categories-heading">
          <h2
            id="browse-categories-heading"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--color-text)',
              margin: '0 0 var(--space-5)',
            }}
          >
            Browse by Category
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            {categories.map(cat => (
              <CategoryCard key={cat.slug} cat={cat} />
            ))}
          </div>
        </section>

        {/* Section 3 — Featured Products */}
        <section style={{ paddingBottom: 'var(--space-10)' }} aria-labelledby="featured-heading">
          <h2
            id="featured-heading"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--color-text)',
              margin: '0 0 var(--space-5)',
            }}
          >
            Featured Products
          </h2>
          <ProductGrid products={featured} loading={!isLoaded} skeletonCount={12} />
          {isLoaded && allProducts.length > 12 && (
            <div style={{ textAlign: 'right', marginTop: 'var(--space-4)' }}>
              <Link
                to="/search"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-primary)',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                View All Products →
              </Link>
            </div>
          )}
        </section>

        {/* Section 5 — Browse All Categories */}
        <section style={{ paddingBottom: 'var(--space-12)' }} aria-labelledby="all-categories-heading">
          <h2
            id="all-categories-heading"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--color-text)',
              margin: '0 0 var(--space-5)',
            }}
          >
            Browse All Categories
          </h2>
          <CategoryTree />
        </section>

      </div>
    </main>
  );
}
