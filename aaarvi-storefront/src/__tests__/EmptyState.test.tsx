// src/__tests__/EmptyState.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PackageSearch } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No results" description="Try adjusting your filters." />);
    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('Try adjusting your filters.')).toBeTruthy();
  });

  it('renders action button when action prop provided', () => {
    render(
      <EmptyState
        title="Empty"
        description="Nothing here."
        action={{ label: 'Clear Filters', onClick: () => {} }}
      />
    );
    expect(screen.getByRole('button', { name: 'Clear Filters' })).toBeTruthy();
  });

  it('does not render action button without action prop', () => {
    render(<EmptyState title="Empty" description="Nothing here." />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <EmptyState
        title="Not found"
        description="No products."
        icon={PackageSearch}
      />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
