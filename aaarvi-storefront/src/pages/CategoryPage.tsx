// src/pages/CategoryPage.tsx
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProductData } from '@/hooks/useProductData';
import type { Product } from '@/types/product';
import { getPrimaryImage, resolveImageUrl, getImageFallbackSvg } from '@/utils/image';

/* ── Floating product card ─────────────────────────────────── */
function FloatingCard({
  product, index, isExiting, dealIn, totalCount,
}: {
  product: Product;
  index: number;
  isExiting: boolean;
  dealIn: boolean;
  totalCount: number;
}) {
  const [clicked, setClicked] = useState(false);
  const navigate = useNavigate();
  const primaryImg = getPrimaryImage(product);
  const imgSrc = primaryImg ? resolveImageUrl(primaryImg.local_path) : getImageFallbackSvg(product.name);

  // Stagger timings
  const enterDelay = dealIn
    ? Math.round(index * (920 / Math.max(totalCount - 1, 1)))
    : 40 + index * 48;
  // Exit: deterministic pseudo-random delay 0–140ms and tilt ±14deg
  const exitDelay  = (index * 37 + (index % 5) * 13) % 140;
  const exitAngle  = ((index * 31 + 7) % 29) - 14;
  const floatDur   = 3.2 + (index % 5) * 0.4;
  // Float starts after the enter animation finishes
  const floatStart = enterDelay + (dealIn ? 320 : 460);

  // Pure CSS-animation approach — no JS transitions so there is no
  // animation vs transition conflict that caused cards to snap/disappear.
  const animStyle: React.CSSProperties = isExiting
    ? ({
        '--cp-exit-angle': `${exitAngle}deg`,
        animation: `cpFall 0.48s cubic-bezier(0.55,0,0.85,0.4) ${exitDelay}ms both`,
      } as React.CSSProperties)
    : clicked
    ? { animation: 'cpZoomProduct 360ms cubic-bezier(0.4,0,1,1) both' }
    : {
        animation:
          `${dealIn ? 'cpDealIn 310ms' : 'cpEnter 450ms'} cubic-bezier(0.22,1,0.36,1) ${enterDelay}ms both,` +
          ` cpFloat ${floatDur}s ease-in-out ${floatStart}ms infinite alternate`,
      };

  function handleClick(e: React.MouseEvent) {
    if (clicked || isExiting) return;
    e.preventDefault();
    setClicked(true);
    setTimeout(() => navigate(`/product/${product.id}`, { state: { fromCategory: product.category } }), 360);
  }

  return (
    <Link
      to={`/product/${product.id}`}
      onClick={handleClick}
      aria-label={product.name}
      style={{ display: 'block', textDecoration: 'none', color: 'inherit', ...animStyle }}
    >
      <div
        style={{
          borderRadius: '1.25rem',
          border: '1px solid rgba(240,180,41,0.28)',
          background: 'linear-gradient(160deg, #3d2200 0%, #2a1600 50%, #1a0c00 100%)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(240,180,41,0.12)',
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = '0 20px 50px rgba(0,0,0,0.6), 0 0 28px rgba(240,180,41,0.2), inset 0 1px 0 rgba(240,180,41,0.2)';
          el.style.borderColor = 'rgba(240,180,41,0.55)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(240,180,41,0.12)';
          el.style.borderColor = 'rgba(240,180,41,0.28)';
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onError={e => { (e.currentTarget as HTMLImageElement).src = getImageFallbackSvg(product.name); }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 55%, rgba(26,10,0,0.78) 100%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Name only */}
        <div style={{ padding: '0.9rem 1rem 1rem' }}>
          <p style={{
            margin: 0,
            fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.35,
            color: '#fde68a',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {product.name}
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ── Page ──────────────────────────────────────────────────── */
export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dealIn = !!(location.state as { dealIn?: boolean } | null)?.dealIn;
  const { allProducts, getCategoryBySlug, isLoaded } = useProductData();
  const [isExiting, setIsExiting] = useState(false);

  // Intercept header nav clicks: animate cards out, then navigate
  useEffect(() => {
    function onNav(e: Event) {
      const { path } = (e as CustomEvent<{ path: string }>).detail;
      e.preventDefault();
      setIsExiting(true);
      setTimeout(() => navigate(path, { state: { dealIn: true } }), 700);
    }
    window.addEventListener('aarvi:nav', onNav);
    return () => window.removeEventListener('aarvi:nav', onNav);
  }, [navigate]);

  const products = allProducts.filter(p => p.category === slug);
  const cat = slug ? getCategoryBySlug(slug) : undefined;
  const label = cat?.label ?? slug ?? '';

  function handleBack() {
    setIsExiting(true);
    setTimeout(() => navigate('/', { state: { returnTo: slug } }), 700);
  }

  return (
    <main
      id="main-content"
      style={{
        minHeight: '100dvh',
        background: '#0d0414',
        color: '#faf5ff',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* Ambient orbs */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #7c3aed, transparent 70%)', top: -100, left: -100, filter: 'blur(80px)', opacity: 0.12 }} />
        <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, #f0b429, transparent 70%)', bottom: -80, right: -80, filter: 'blur(80px)', opacity: 0.08 }} />
      </div>

      {/* Category heading */}
      <div style={{ position: 'relative', zIndex: 1, padding: '6rem 2rem 2.5rem', textAlign: 'center' }}>
        <p style={{
          fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: '#f0b429', marginBottom: '0.5rem',
        }}>
          Category
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.1,
          background: 'linear-gradient(135deg, #fff 40%, #e9d5ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          margin: '0 0 0.5rem',
        }}>
          {label}
        </h1>
        {products.length > 0 && (
          <p style={{ fontSize: '0.875rem', color: 'rgba(250,245,255,0.55)', margin: 0 }}>
            {products.length} products
          </p>
        )}
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            marginTop: '1.25rem',
            fontSize: '0.8rem', color: 'rgba(250,245,255,0.5)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'color 180ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(250,245,255,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,245,255,0.5)')}
        >
          ← Back
        </button>
      </div>

      {/* Product grid */}
      <div style={{ position: 'relative', zIndex: 1, padding: '0 1.5rem 4rem', maxWidth: 1400, margin: '0 auto' }}>
        {!isLoaded ? (
          /* Skeleton */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%),1fr))',
            gap: '1.25rem',
          }}>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} style={{
                borderRadius: '1.5rem',
                background: 'rgba(32,14,52,0.6)',
                aspectRatio: '3/4',
                animation: 'cpPulse 1.4s ease-in-out infinite alternate',
                animationDelay: `${i * 80}ms`,
              }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(250,245,255,0.5)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No products in this category yet.</p>
            <Link to="/" style={{ color: '#a855f7', textDecoration: 'none' }}>← Back to home</Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%),1fr))',
            gap: '1.25rem',
          }}>
            {products.map((p, i) => (
              <FloatingCard
                key={p.id}
                product={p}
                index={i}
                isExiting={isExiting}
                dealIn={dealIn}
                totalCount={products.length}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes cpEnter {
          from { opacity: 0; transform: scale(0.72) translateY(28px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cpDealIn {
          from { opacity: 0; transform: translateX(-70px) scale(0.65) rotate(-6deg); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes cpFall {
          from { opacity: 1; transform: translateY(0) rotate(0deg); }
          to   { opacity: 0; transform: translateY(120vh) rotate(var(--cp-exit-angle, 10deg)); }
        }
        @keyframes cpZoomProduct {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.2) translateY(-18px); }
        }
        @keyframes cpFloat {
          from { transform: translateY(0px); }
          to   { transform: translateY(-8px); }
        }
        @keyframes cpPulse {
          from { opacity: 0.4; }
          to   { opacity: 0.7; }
        }
      `}</style>
    </main>
  );
}
