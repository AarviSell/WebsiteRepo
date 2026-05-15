// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useProductData } from '@/hooks/useProductData';

function AArviLogo() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text)' }}>
      <svg
        aria-hidden="true"
        viewBox="0 0 34 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: 34, height: 34, flexShrink: 0 }}
      >
        <circle cx="17" cy="17" r="16" stroke="url(#lg)" strokeWidth="1.5" />
        <path d="M17 7 L26 25 H8 Z" fill="url(#lg2)" opacity="0.92" />
        <path d="M12 19 H22" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="34" y2="34">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#f0b429" />
          </linearGradient>
          <linearGradient id="lg2" x1="17" y1="7" x2="17" y2="25">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#f0b429" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #e9d5ff, #fde68a)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}
      >
        AArvi
      </span>
    </span>
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
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  function navClick(path: string) {
    const evt = new CustomEvent('aarvi:nav', { detail: { path }, cancelable: true });
    const notIntercepted = window.dispatchEvent(evt);
    if (notIntercepted) navigate(path);
  }

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
          zIndex: 70,
          padding: 'var(--space-3) var(--space-4) 0',
          background: 'linear-gradient(180deg, rgba(13, 4, 20, 0.94), rgba(13, 4, 20, 0.78) 72%, rgba(13, 4, 20, 0))',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--content-wide)',
            margin: '0 auto',
            padding: 0,
          }}
        >
          <div
            className="glass-panel"
            style={{
              borderRadius: '1.75rem',
              padding: '0 var(--space-4)',
            }}
          >
            {/* Desktop: single row */}
            <div
              style={{
                display: 'none',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                minHeight: 74,
              }}
              className="desktop-header"
            >
              {/* Left slot — empty */}
              <div />
              {/* Center — logo */}
              <Link to="/" aria-label="AArvi home" style={{ textDecoration: 'none', justifySelf: 'center' }}>
                <AArviLogo />
              </Link>

              <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', justifyContent: 'flex-end' }} aria-label="Primary navigation">
                {([
                  { label: 'Deals',     path: '/category/best-sellers' },
                  { label: 'Spotlight', path: '/category/in-the-spotlight' },
                ] as const).map(({ label, path }) => (
                  <button
                    key={label}
                    onClick={() => navClick(path)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--text-sm)', fontWeight: 500,
                      padding: '0.35rem 0.8rem',
                      borderRadius: 'var(--radius-full)',
                      transition: 'color 180ms, background 180ms',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--color-text)';
                      e.currentTarget.style.background = 'rgba(168,85,247,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile: single row */}
            <div className="mobile-header">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', minHeight: 62 }}>
                {/* Left — empty */}
                <div />
                {/* Center — logo */}
                <Link to="/" aria-label="AArvi home" style={{ textDecoration: 'none', justifySelf: 'center' }}>
                  <AArviLogo />
                </Link>
                {/* Right — hamburger */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  ref={hamburgerRef}
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={drawerOpen}
                  style={{
                    background: 'rgba(250, 245, 255, 0.04)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                    padding: 'var(--space-2)',
                    minHeight: 44,
                    minWidth: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  <Menu size={22} />
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-header { display: grid !important; }
          .mobile-header { display: none !important; }
        }
      `}</style>

      {drawerOpen && (
        <DrawerNav onClose={() => { setDrawerOpen(false); hamburgerRef.current?.focus(); }} />
      )}
    </>
  );
}
