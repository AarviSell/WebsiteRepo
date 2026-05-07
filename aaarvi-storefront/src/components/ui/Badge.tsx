// src/components/ui/Badge.tsx
import type { ReactNode } from 'react';

interface BadgeProps {
  variant: 'indiamart' | 'shipmydeals' | 'category' | 'default';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
  const variantStyles: Record<BadgeProps['variant'], React.CSSProperties> = {
    indiamart: {
      background: 'var(--color-blue-highlight)',
      color: 'var(--color-blue)',
    },
    shipmydeals: {
      background: 'var(--color-success-highlight)',
      color: 'var(--color-success)',
    },
    category: {
      background: 'var(--color-primary-highlight)',
      color: 'var(--color-primary)',
    },
    default: {
      background: 'var(--color-surface-offset)',
      color: 'var(--color-text-muted)',
    },
  };

  return (
    <span
      className={className}
      style={{
        ...variantStyles[variant],
        borderRadius: 'var(--radius-full)',
        padding: '2px 8px',
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        display: 'inline-block',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export function SourceBadge({ source }: { source: 'indiamart' | 'shipmydeals' }) {
  const label = source === 'indiamart' ? 'IndiaMart' : 'ShipMyDeals';
  return <Badge variant={source}>{label}</Badge>;
}
