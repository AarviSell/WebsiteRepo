// src/components/ui/EmptyState.tsx
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-8)',
      }}
    >
      {Icon && (
        <Icon
          size={48}
          aria-hidden="true"
          style={{ color: 'var(--color-text-faint)', marginBottom: 'var(--space-4)' }}
        />
      )}
      <h2
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
          color: 'var(--color-text)',
          margin: '0 0 var(--space-2)',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-muted)',
          maxWidth: '36ch',
          margin: '0 0 var(--space-6)',
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
