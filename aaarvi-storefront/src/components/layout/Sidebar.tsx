// src/components/layout/Sidebar.tsx
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProductData } from '@/hooks/useProductData';
import type { CategoryNode } from '@/types/product';

interface SidebarProps {
  activeCategorySlug?: string;
  activeSubcategorySlug?: string;
}

function CategoryItem({ cat, isActive, activeSubSlug }: {
  cat: CategoryNode;
  isActive: boolean;
  activeSubSlug?: string;
}) {
  const [expanded, setExpanded] = useState(isActive);

  return (
    <li>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link
          to={`/category/${cat.slug}`}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
            background: isActive ? 'var(--color-primary-highlight)' : 'transparent',
            textDecoration: 'none',
          }}
        >
          <span>{cat.label}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{cat.count}</span>
        </Link>
        {cat.children.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${cat.label}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-faint)',
              padding: 'var(--space-2)',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {expanded && cat.children.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 0 var(--space-4)', padding: 0 }}>
          {cat.children.map(sub => {
            const isSubActive = sub.slug === activeSubSlug;
            return (
              <li key={sub.slug}>
                <Link
                  to={`/category/${cat.slug}/${sub.slug}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isSubActive ? 600 : 400,
                    color: isSubActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: isSubActive ? 'var(--color-primary-highlight)' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  <span>{sub.label}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{sub.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function Sidebar({ activeCategorySlug, activeSubcategorySlug }: SidebarProps) {
  const { categories } = useProductData();
  const params = useParams();
  const slug = activeCategorySlug ?? params.slug;
  const subSlug = activeSubcategorySlug ?? params.subSlug;

  return (
    <aside
      aria-label="Category navigation"
      style={{
        width: 240,
        flexShrink: 0,
      }}
    >
      <p style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: 'var(--color-text-faint)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        margin: '0 0 var(--space-3)',
        padding: '0 var(--space-3)',
      }}>
        Categories
      </p>
      <nav>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {categories.map(cat => (
            <CategoryItem
              key={cat.slug}
              cat={cat}
              isActive={cat.slug === slug}
              activeSubSlug={subSlug}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}
