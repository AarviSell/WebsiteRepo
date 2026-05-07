// src/pages/SearchResultsPage.tsx
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { Button } from '@/components/ui/Button';
import { useSearch } from '@/hooks/useSearch';
import { useFilters } from '@/hooks/useFilters';
import { useProductData } from '@/hooks/useProductData';
import type { FilterState } from '@/types/product';

const PAGE_SIZE = 24;

function FilterBottomSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Filter results" style={{ position: 'fixed', inset: 0, zIndex: 150 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} aria-hidden="true" />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        padding: 'var(--space-4)', maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Filter & Sort</span>
          <button onClick={onClose} aria-label="Close filters" style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)',
            padding: 'var(--space-2)', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  function getPageNumbers(): (number | '…')[] {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); return pages; }
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
    <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-8)', flexWrap: 'wrap' }}>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, fontSize: 'var(--text-sm)', minHeight: 44, minWidth: 44 }}>← Prev</button>
      {getPageNumbers().map((page, i) => page === '…' ? (
        <span key={`e-${i}`} style={{ padding: '0 var(--space-2)', color: 'var(--color-text-faint)' }}>…</span>
      ) : (
        <button key={page} onClick={() => onPageChange(page as number)} aria-label={`Page ${page}`} aria-current={page === currentPage ? 'page' : undefined} style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: page === currentPage ? 'var(--color-primary)' : 'var(--color-surface)', color: page === currentPage ? '#ffffff' : 'var(--color-text)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: page === currentPage ? 600 : 400, minHeight: 44, minWidth: 44 }}>{page}</button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page" style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, fontSize: 'var(--text-sm)', minHeight: 44, minWidth: 44 }}>Next →</button>
    </nav>
  );
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const { allProducts, categories, isLoaded } = useProductData();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const fuseResults = useSearch(query, { limit: allProducts.length });

  // Use fuse results if query present, else all products
  const baseProducts = query.length >= 2
    ? fuseResults.map(r => r.item)
    : allProducts;

  const {
    filters,
    setFilter,
    clearFilters,
    filteredProducts,
    paginatedProducts,
    totalPages,
  } = useFilters(baseProducts);

  const handlePageChange = useCallback((page: number) => {
    setFilter('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setFilter]);

  const startItem = filteredProducts.length > 0 ? (filters.page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(filters.page * PAGE_SIZE, filteredProducts.length);

  return (
    <main id="main-content">
      <div style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
        {/* Back link */}
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 'var(--space-4)' }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Browse
        </Link>

        <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
          {/* Desktop sidebar filter */}
          <div style={{ display: 'none', width: 240, flexShrink: 0 }} className="sidebar-search-desktop">
            <FilterPanel
              filters={filters}
              setFilter={setFilter}
              clearFilters={clearFilters}
              products={baseProducts}
            />
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                {query
                  ? <>Search results for &ldquo;<strong>{query}</strong>&rdquo; — <strong>{filteredProducts.length}</strong> results</>
                  : <>All Products — <strong>{filteredProducts.length}</strong></>
                }
              </h1>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <Button variant="outline" size="sm" onClick={() => setFilterSheetOpen(true)} className="mobile-filter-search-btn">
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  Filter & Sort
                </Button>
                <div>
                  <label htmlFor="search-sort" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginRight: 'var(--space-2)' }}>Sort:</label>
                  <select
                    id="search-sort"
                    value={filters.sortBy}
                    onChange={e => setFilter('sortBy', e.target.value as FilterState['sortBy'])}
                    style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Name: A–Z</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredProducts.length > 0 && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: '0 0 var(--space-4)' }}>
                Showing {startItem}–{endItem} of {filteredProducts.length} products
              </p>
            )}

            {/* Zero results with suggestions */}
            {isLoaded && query && filteredProducts.length === 0 ? (
              <div style={{ paddingBlock: 'var(--space-12)' }}>
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                  No results for &ldquo;{query}&rdquo;
                </p>
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
                  Try different keywords or browse by category
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {categories.slice(0, 4).map(cat => (
                    <Link
                      key={cat.slug}
                      to={`/category/${cat.slug}`}
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text)',
                        textDecoration: 'none',
                        background: 'var(--color-surface)',
                        minHeight: 44,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <ProductGrid
                products={paginatedProducts}
                loading={!isLoaded}
                emptyTitle="No products match your filters"
                emptyDescription="Try adjusting or clearing your filters."
                onEmptyAction={clearFilters}
                emptyActionLabel="Clear Filters"
              />
            )}

            <Pagination currentPage={filters.page} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .sidebar-search-desktop { display: block !important; }
          .mobile-filter-search-btn { display: none !important; }
        }
      `}</style>

      {filterSheetOpen && (
        <FilterBottomSheet onClose={() => setFilterSheetOpen(false)}>
          <FilterPanel
            filters={filters}
            setFilter={setFilter}
            clearFilters={() => { clearFilters(); setFilterSheetOpen(false); }}
            products={baseProducts}
          />
        </FilterBottomSheet>
      )}
    </main>
  );
}
