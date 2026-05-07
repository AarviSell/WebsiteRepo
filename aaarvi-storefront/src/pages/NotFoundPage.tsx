// src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <main
      id="main-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-12) var(--space-4)',
        textAlign: 'center',
      }}
    >
      <SearchX
        size={64}
        aria-hidden="true"
        style={{ color: 'var(--color-text-faint)', marginBottom: 'var(--space-6)' }}
      />
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 400,
          color: 'var(--color-text)',
          margin: '0 0 var(--space-3)',
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-muted)',
          margin: '0 0 var(--space-8)',
          maxWidth: '36ch',
        }}
      >
        This page doesn't exist.
      </p>
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-6)',
          background: 'var(--color-primary)',
          color: '#ffffff',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          textDecoration: 'none',
          minHeight: 44,
        }}
      >
        Back to Home
      </Link>
    </main>
  );
}
