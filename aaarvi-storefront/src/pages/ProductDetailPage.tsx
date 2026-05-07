// src/pages/ProductDetailPage.tsx
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Mail, ChevronDown, ChevronUp, PackageSearch } from 'lucide-react';
import { useProductStore } from '@/store/useProductStore';
import { useProductData } from '@/hooks/useProductData';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductSpecsTable } from '@/components/product/ProductSpecsTable';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { getPrimaryImage, resolveImageUrl, getImageFallbackSvg } from '@/utils/image';

const DESCRIPTION_LIMIT = 300;

function CollapsibleDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > DESCRIPTION_LIMIT;
  const shown = !isLong || expanded ? text : text.slice(0, DESCRIPTION_LIMIT) + '…';

  return (
    <div>
      <p style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-base)', color: 'var(--color-text)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {shown}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-primary)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-1)',
            padding: 0,
            minHeight: 44,
          }}
        >
          {expanded ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show more</>}
        </button>
      )}
    </div>
  );
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-4) 0' }} />;
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getProductById, getProductsByCategory } = useProductStore();
  const { getCategoryBySlug, isLoaded } = useProductData();

  const product = id ? getProductById(id) : undefined;

  if (!isLoaded) {
    return (
      <main id="main-content" style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}>
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-faint)' }}>
          Loading…
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main id="main-content">
        <EmptyState
          icon={PackageSearch}
          title="Product not found"
          description="This product may have been removed or the link is incorrect."
          action={{ label: 'Back to Home', onClick: () => window.history.back() }}
        />
      </main>
    );
  }

  const cat = getCategoryBySlug(product.category);
  const subCat = cat?.children.find(c => c.slug === product.subcategory);
  const hasSpecs = Object.keys(product.specifications).length > 0;

  // More from this category
  const relatedProducts = getProductsByCategory(product.category, product.subcategory)
    .filter(p => p.id !== product.id)
    .slice(0, 8);

  const relatedLabel = subCat?.label ?? cat?.label ?? product.category_label;

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: cat?.label ?? product.category_label, href: `/category/${product.category}` },
    ...(subCat ? [{ label: subCat.label, href: `/category/${product.category}/${product.subcategory}` }] : []),
    { label: product.name.slice(0, 40) + (product.name.length > 40 ? '…' : '') },
  ];

  return (
    <main id="main-content">
      <div style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: 'var(--space-5) var(--space-4)' }}>
        <Breadcrumb items={breadcrumbItems} />

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 'var(--space-6)',
            marginTop: 'var(--space-5)',
          }}
          className="product-detail-grid"
        >
          {/* Left — Gallery */}
          <div>
            <ProductImageGallery product={product} />
          </div>

          {/* Right — Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <h1
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 600,
                color: 'var(--color-text)',
                margin: 'var(--space-3) 0 0',
                lineHeight: 1.3,
              }}
            >
              {product.name}
            </h1>

            {product.brand && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 'var(--space-1) 0 0' }}>
                {product.brand}
              </p>
            )}

            <Divider />

            {product.description && (
              <>
                <CollapsibleDescription text={product.description} />
                <Divider />
              </>
            )}

            {hasSpecs && (
              <>
                <div>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
                    Specifications
                  </p>
                  <ProductSpecsTable specifications={product.specifications} />
                </div>
                <Divider />
              </>
            )}

            {/* Contact for Price */}
            <a
              href="mailto:aarvisell@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-5)',
                background: 'var(--color-primary)',
                color: '#ffffff',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                textDecoration: 'none',
                minHeight: 44,
                alignSelf: 'flex-start',
              }}
            >
              <Mail size={14} aria-hidden="true" />
              Contact Us for Price
            </a>

            {(product.seller_name || product.seller_location) && (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <MapPin size={14} aria-hidden="true" />
                {[product.seller_name, product.seller_location].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* More from category */}
        {relatedProducts.length > 0 && (
          <section
            style={{ marginTop: 'var(--space-12)' }}
            aria-labelledby="related-heading"
          >
            <h2
              id="related-heading"
              style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 var(--space-5)' }}
            >
              More in {relatedLabel}
            </h2>
            {/* Horizontal scroll on mobile */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-4)',
                overflowX: 'auto',
                paddingBottom: 'var(--space-2)',
              }}
              className="related-products-scroll"
            >
              {relatedProducts.map(p => {
                const relImg = getPrimaryImage(p);
                const relSrc = relImg ? resolveImageUrl(relImg.local_path) : getImageFallbackSvg(p.name);
                return (
                  <Link
                    key={p.id}
                    to={`/product/${p.id}`}
                    style={{ display: 'block', textDecoration: 'none', flexShrink: 0, width: 200 }}
                    aria-label={p.name}
                  >
                    <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--color-surface-2)' }}>
                        <img
                          src={relSrc}
                          alt={`${p.name} image`}
                          width={200}
                          height={150}
                          loading="lazy"
                          decoding="async"
                          onError={e => { (e.currentTarget as HTMLImageElement).src = getImageFallbackSvg(p.name); }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ padding: 'var(--space-2)' }}>
                        <p className="line-clamp-2" style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4 }}>
                          {p.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .product-detail-grid {
            grid-template-columns: 55fr 45fr !important;
          }
        }
        .related-products-scroll { scrollbar-width: thin; }
        .related-products-scroll::-webkit-scrollbar { height: 4px; }
        .related-products-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
      `}</style>
    </main>
  );
}
