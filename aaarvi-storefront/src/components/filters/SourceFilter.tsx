// src/components/filters/SourceFilter.tsx
import type { Product } from '@/types/product';

interface SourceFilterProps {
  sources: ('indiamart' | 'shipmydeals')[];
  onChange: (sources: ('indiamart' | 'shipmydeals')[]) => void;
  products: Product[];
}

export function SourceFilter({ sources, onChange, products }: SourceFilterProps) {
  const indiaCount = products.filter(p => p.source_site === 'indiamart').length;
  const shipCount = products.filter(p => p.source_site === 'shipmydeals').length;

  function toggle(source: 'indiamart' | 'shipmydeals') {
    if (sources.includes(source)) {
      onChange(sources.filter(s => s !== source));
    } else {
      onChange([...sources, source]);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {indiaCount > 0 && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', minHeight: 44 }}>
          <input
            type="checkbox"
            checked={sources.length === 0 || sources.includes('indiamart')}
            onChange={() => toggle('indiamart')}
            style={{ width: 16, height: 16, accentColor: 'var(--color-blue)' }}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            IndiaMart{' '}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>({indiaCount})</span>
          </span>
        </label>
      )}
      {shipCount > 0 && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', minHeight: 44 }}>
          <input
            type="checkbox"
            checked={sources.length === 0 || sources.includes('shipmydeals')}
            onChange={() => toggle('shipmydeals')}
            style={{ width: 16, height: 16, accentColor: 'var(--color-success)' }}
          />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            ShipMyDeals{' '}
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>({shipCount})</span>
          </span>
        </label>
      )}
    </div>
  );
}
