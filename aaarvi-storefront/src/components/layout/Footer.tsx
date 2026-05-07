// src/components/layout/Footer.tsx
import { Link } from 'react-router-dom';
import { useProductData } from '@/hooks/useProductData';

export function Footer() {
  const { categories } = useProductData();

  return (
    <footer
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        marginTop: 'auto',
        padding: 'var(--space-10) var(--space-4) var(--space-6)',
      }}
    >
      <div style={{ maxWidth: 'var(--content-wide)', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-8)',
          }}
        >
          {/* Brand */}
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', margin: '0 0 var(--space-3)', color: 'var(--color-primary)' }}>
              AArvi
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              India's Smart Product Catalog — discover quality products curated for Indian buyers.
            </p>
          </div>

          {/* Categories */}
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 var(--space-3)' }}>
              Categories
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {categories.slice(0, 6).map(cat => (
                <li key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textDecoration: 'none' }}
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 var(--space-3)' }}>
              Contact
            </p>
            <a
              href="mailto:aarvisell@gmail.com"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textDecoration: 'none' }}
            >
              aarvisell@gmail.com
            </a>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-5)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
          }}
        >
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', margin: 0 }}>
            © {new Date().getFullYear()} AArvi — Everburn Interactive.
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', margin: 0 }}>
            Contact us for pricing: aarvisell@gmail.com
          </p>
        </div>
      </div>
    </footer>
  );
}
