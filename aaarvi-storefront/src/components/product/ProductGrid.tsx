// src/components/product/ProductGrid.tsx
import type { Product } from '@/types/product';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PackageSearch } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
}

export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 24,
  emptyTitle = 'No products found',
  emptyDescription = 'Try adjusting your search or filters.',
  onEmptyAction,
  emptyActionLabel = 'Clear filters',
}: ProductGridProps) {
  if (loading) {
    return (
      <div
        className="product-grid"
        role="list"
        aria-label="Loading products"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {Array.from({ length: skeletonCount }, (_, i) => (
          <div role="listitem" key={i}>
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle}
        description={emptyDescription}
        action={onEmptyAction ? { label: emptyActionLabel, onClick: onEmptyAction } : undefined}
      />
    );
  }

  return (
    <div
      className="product-grid"
      role="list"
      aria-label={`${products.length} products`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {products.map(p => (
        <div role="listitem" key={p.id}>
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}
