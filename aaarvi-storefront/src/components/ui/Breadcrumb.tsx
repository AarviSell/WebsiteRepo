// src/components/ui/Breadcrumb.tsx
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-1)',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
        }}
      >
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            {i > 0 && (
              <ChevronRight
                size={14}
                aria-hidden="true"
                style={{ color: 'var(--color-text-faint)', flexShrink: 0 }}
              />
            )}
            {item.href && i < items.length - 1 ? (
              <Link
                to={item.href}
                style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={i === items.length - 1 ? 'page' : undefined}
                style={{ color: i === items.length - 1 ? 'var(--color-text)' : undefined }}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
