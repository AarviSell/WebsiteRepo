// src/pages/CategoryPage.tsx
import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { useProductData } from '@/hooks/useProductData';
import { useFilters } from '@/hooks/useFilters';
import type { FilterState } from '@/types/product';

const PAGE_SIZE = 24;

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  function getPageNumbers(): (number | '…')[] {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    if (start > 2) pages.push('…');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 'var(--space-1)',
        marginTop: 'var(--space-8)',
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        style={{
          padding: 'var(--space-2) var(--space-3)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          opacity: currentPage === 1 ? 0.4 : 1,
          fontSize: 'var(--text-sm)',
          minHeight: 44,
          minWidth: 44,
        }}
      >
        ← Prev
      </button>

      {getPageNumbers().map((page, i) =>
        page === '…' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '0 var(--space-2)', color: 'var(--color-text-faint)' }}>
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: page === currentPage ? 'var(--color-primary)' : 'var(--color-surface)',
              color: page === currentPage ? '#ffffff' : 'var(--color-text)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: page === currentPage ? 600 : 400,
              minHeight: 44,
              minWidth: 44,
            }}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        style={{
          padding: 'var(--space-2) var(--space-3)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          opacity: currentPage === totalPages ? 0.4 : 1,
          fontSize: 'var(--text-sm)',
          minHeight: 44,
          minWidth: 44,
        }}
      >
        Next →
      </button>
    </nav>
  );
}

function FilterBottomSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filter products"
      style={{ position: 'fixed', inset: 0, zIndex: 150 }}
    >
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          padding: 'var(--space-4)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Filter & Sort</span>
          <button
            onClick={onClose}
            aria-label="Close filters"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              padding: 'var(--space-2)',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CategoryPage() {
  const { slug, subSlug } = useParams<{ slug: string; subSlug?: string }>();
  const { allProducts, getCategoryBySlug, isLoaded } = useProductData();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const categoryProducts = allProducts.filter(p => {
    if (p.category !== slug) return false;
    if (subSlug && p.subcategory !== subSlug) return false;
    return true;
  });

  const {
    filters,
    setFilter,
    clearFilters,
    filteredProducts,
    paginatedProducts,
    totalPages,
  } = useFilters(categoryProducts);

  const cat = slug ? getCategoryBySlug(slug) : undefined;
  const subCat = cat?.children.find(c => c.slug === subSlug);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: cat?.label ?? (slug ?? ''), href: `/category/${slug}` },
    ...(subCat ? [{ label: subCat.label }] : []),
  ];

  const handlePageChange = useCallback((page: number) => {
    setFilter('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setFilter]);

  const startItem = (filters.page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(filters.page * PAGE_SIZE, filteredProducts.length);

  return (
    <main id="main-content">
      <div
        style={{
          maxWidth: 'var(--content-wide)',
          margin: '0 auto',
          padding: 'var(--space-5) var(--space-4)',
        }}
      >
        <Breadcrumb items={breadcrumbItems} />

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-8)',
            marginTop: 'var(--space-5)',
            alignItems: 'flex-start',
          }}
        >
          {/* Desktop sidebar */}
          <div style={{ display: 'none' }} className="sidebar-desktop">
            <Sidebar />
            <div style={{ marginTop: 'var(--space-6)' }}>
              <FilterPanel
                filters={filters}
                setFilter={setFilter}
                clearFilters={clearFilters}
                products={categoryProducts}
              />
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-4)',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
              }}
            >
              <h1
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  margin: 0,
                }}
              >
                {subCat?.label ?? cat?.label ?? slug}
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                  ({filteredProducts.length})
                </span>
              </h1>

              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                {/* Mobile filter button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilterSheetOpen(true)}
                  className="mobile-filter-btn"
                >
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  Filter & Sort
                </Button>

                {/* Sort dropdown */}
                <div>
                  <label htmlFor="sort-select" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginRight: 'var(--space-2)' }}>
                    Sort:
                  </label>
                  <select
                    id="sort-select"
                    value={filters.sortBy}
                    onChange={e => setFilter('sortBy', e.target.value as FilterState['sortBy'])}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--text-sm)',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A–Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results info */}
            {filteredProducts.length > 0 && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--space-4)' }}>
                Showing {startItem}–{endItem} of {filteredProducts.length} products
              </p>
            )}

            <ProductGrid
              products={paginatedProducts}
              loading={!isLoaded}
              emptyTitle="No products match your filters"
              emptyDescription="Try adjusting or clearing your filters."
              onEmptyAction={clearFilters}
              emptyActionLabel="Clear Filters"
            />

            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-desktop { display: block !important; }
          .mobile-filter-btn { display: none !important; }
        }
      `}</style>

      {filterSheetOpen && (
        <FilterBottomSheet onClose={() => setFilterSheetOpen(false)}>
          <FilterPanel
            filters={filters}
            setFilter={setFilter}
            clearFilters={() => { clearFilters(); setFilterSheetOpen(false); }}
            products={categoryProducts}
          />
        </FilterBottomSheet>
      )}
    </main>
  );
}
