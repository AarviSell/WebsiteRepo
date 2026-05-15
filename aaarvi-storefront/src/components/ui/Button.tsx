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
    fontWeight: 600,
    fontSize: size === 'sm' ? 'var(--text-sm)' : size === 'lg' ? 'var(--text-base)' : 'var(--text-sm)',
    borderRadius: 'var(--radius-full)',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms, opacity 150ms, transform 150ms, box-shadow 150ms',
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
      background: 'linear-gradient(135deg, var(--color-accent-soft), var(--color-accent))',
      color: '#1a0a00',
      boxShadow: '0 10px 28px rgba(240, 180, 41, 0.26)',
    },
    secondary: {
      background: 'rgba(250, 245, 255, 0.06)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-muted)',
    },
    outline: {
      background: 'rgba(250, 245, 255, 0.02)',
      color: 'var(--color-text)',
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
