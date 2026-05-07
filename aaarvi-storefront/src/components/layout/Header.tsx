// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { useProductStore } from '@/store/useProductStore';
import { useProductData } from '@/hooks/useProductData';

function AArviLogo() {
  return (
    <svg
      aria-label="AArvi"
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 120, height: 32, flexShrink: 0 }}
    >
      <path
        d="M8 26 L16 8 L24 26"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 26 L26 8 L34 26"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="10" y1="20" x2="22" y2="20" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="20" x2="32" y2="20" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <text
        x="42"
        y="22"
        fontFamily="'Instrument Serif', serif"
        fontSize="18"
        fill="currentColor"
        fontWeight="400"
      >
        AArvi
      </text>
    </svg>
  );
}

function DrawerNav({ onClose }: { onClose: () => void }) {
  const { categories } = useProductData();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <nav
        style={{
          position: 'relative',
          width: 280,
          maxWidth: '85vw',
          background: 'var(--color-surface)',
          height: '100%',
          overflowY: 'auto',
          padding: 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AArviLogo />
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              padding: 'var(--space-2)',
              minHeight: 44,
              minWidth: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-2)' }}>
            Categories
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {categories.map(cat => (
              <li key={cat.slug}>
                <Link
                  to={`/category/${cat.slug}`}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-2) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <span>{cat.label}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>{cat.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>


      </nav>
    </div>
  );
}

export function Header() {
  const { theme, setTheme } = useProductStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--color-bg)',
          borderBottom: '1px solid oklch(from var(--color-text, #1a1a18) l c h / 0.08)',
          borderBottomColor: 'var(--color-border)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--content-wide)',
            margin: '0 auto',
            padding: '0 var(--space-4)',
          }}
        >
          {/* Desktop: single row */}
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: 'var(--space-4)',
              height: 64,
            }}
            className="desktop-header"
          >
            <Link to="/" aria-label="AArvi home" style={{ flexShrink: 0 }}>
              <AArviLogo />
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <SearchBar />
            </div>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: 'var(--space-2)',
                minHeight: 44,
                minWidth: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
              }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Mobile: two rows */}
          <div className="mobile-header">
            {/* Row 1 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
              <Link to="/" aria-label="AArvi home">
                <AArviLogo />
              </Link>
              <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: 'var(--space-2)',
                    minHeight: 44,
                    minWidth: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  ref={hamburgerRef}
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={drawerOpen}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    padding: 'var(--space-2)',
                    minHeight: 44,
                    minWidth: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <Menu size={22} />
                </button>
              </div>
            </div>
            {/* Row 2 */}
            <div style={{ paddingBottom: 'var(--space-3)' }}>
              <SearchBar />
            </div>
          </div>
        </div>
      </header>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-header { display: flex !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>

      {drawerOpen && (
        <DrawerNav onClose={() => { setDrawerOpen(false); hamburgerRef.current?.focus(); }} />
      )}
    </>
  );
}
