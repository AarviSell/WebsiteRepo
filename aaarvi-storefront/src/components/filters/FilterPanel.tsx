// src/components/filters/FilterPanel.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import type { FilterState, Product } from '@/types/product';
import { PriceRangeSlider } from './PriceRangeSlider';
import { Button } from '@/components/ui/Button';

interface FilterSection {
  id: string;
  title: string;
  children: React.ReactNode;
}

function CollapsibleSection({ id, title, children }: FilterSection) {
  const [open, setOpen] = useState(true);

  return (
    <div
      role="group"
      aria-label={title}
      style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          padding: 'var(--space-3) 0',
          minHeight: 44,
        }}
        aria-controls={id}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div id={id} style={{ paddingTop: 'var(--space-1)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface FilterPanelProps {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: FilterState[keyof FilterState]) => void;
  clearFilters: () => void;
  products: Product[];
}

function hasActiveFilters(f: FilterState): boolean {
  return (
    f.minPrice !== null ||
    f.maxPrice !== null ||
    f.hasImages ||
    f.hasDescription ||
    f.sortBy !== 'relevance'
  );
}

export function FilterPanel({ filters, setFilter, clearFilters, products }: FilterPanelProps) {
  const prices = products.map(p => p.price_numeric).filter((n): n is number => n != null);
  const minPossible = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPossible = prices.length > 0 ? Math.max(...prices) : 10000;

  const filtersActive = hasActiveFilters(filters);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <SlidersHorizontal size={16} style={{ color: 'var(--color-text-muted)' }} />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>Filters</span>
      </div>

      <CollapsibleSection id="filter-price" title="Price Range">
        <PriceRangeSlider
          min={minPossible}
          max={maxPossible}
          value={[filters.minPrice ?? minPossible, filters.maxPrice ?? maxPossible]}
          onChange={([min, max]) => {
            setFilter('minPrice', min === minPossible ? null : min);
            setFilter('maxPrice', max === maxPossible ? null : max);
          }}
        />
      </CollapsibleSection>

      <CollapsibleSection id="filter-show" title="Show Only">
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginBottom: 'var(--space-2)', minHeight: 44 }}>
          <input
            type="checkbox"
            checked={filters.hasImages}
            onChange={e => setFilter('hasImages', e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Products with images</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', minHeight: 44 }}>
          <input
            type="checkbox"
            checked={filters.hasDescription}
            onChange={e => setFilter('hasDescription', e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>Products with description</span>
        </label>
      </CollapsibleSection>

      {filtersActive && (
        <div style={{ paddingTop: 'var(--space-4)' }}>
          <Button variant="ghost" onClick={clearFilters} size="sm" style={{ width: '100%', color: 'var(--color-error)' }}>
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
