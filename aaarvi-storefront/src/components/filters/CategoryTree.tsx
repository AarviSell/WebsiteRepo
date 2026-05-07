// src/components/filters/CategoryTree.tsx
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useProductData } from '@/hooks/useProductData';
import type { CategoryNode } from '@/types/product';

function CategoryAccordion({ cat }: { cat: CategoryNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link
          to={`/category/${cat.slug}`}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--color-text)',
            textDecoration: 'none',
          }}
        >
          <span>{cat.label}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{cat.count}</span>
        </Link>
        {cat.children.length > 0 && (
          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${cat.label}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-faint)',
              padding: 'var(--space-3)',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>
      {open && cat.children.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 var(--space-2) var(--space-4)' }}>
          {cat.children.map(sub => (
            <li key={sub.slug}>
              <Link
                to={`/category/${cat.slug}/${sub.slug}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                }}
              >
                <span>{sub.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{sub.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CategoryTree() {
  const { categories } = useProductData();

  return (
    <div style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
      {categories.map(cat => (
        <CategoryAccordion key={cat.slug} cat={cat} />
      ))}
    </div>
  );
}
