// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: size === 'sm' ? 'var(--text-sm)' : size === 'lg' ? 'var(--text-base)' : 'var(--text-sm)',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms, opacity 150ms',
    minHeight: '44px',
    minWidth: size === 'sm' ? '44px' : undefined,
    padding:
      size === 'sm' ? '0 var(--space-3)' :
      size === 'lg' ? 'var(--space-3) var(--space-6)' :
      'var(--space-2) var(--space-5)',
    textDecoration: 'none',
    ...style,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--color-primary)',
      color: '#ffffff',
    },
    secondary: {
      background: 'var(--color-surface-2)',
      color: 'var(--color-text)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-muted)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-primary)',
      border: '1.5px solid var(--color-primary)',
    },
  };

  return (
    <button
      style={{ ...base, ...variantStyles[variant] }}
      {...props}
    >
      {children}
    </button>
  );
}
