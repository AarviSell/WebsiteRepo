// src/components/product/ProductCard.tsx
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import type { Product } from '@/types/product';
import { getPrimaryImage, resolveImageUrl, getImageFallbackSvg } from '@/utils/image';

interface ProductCardProps {
  product: Product;
  size?: 'sm' | 'md';
}

export function ProductCard({ product, size = 'md' }: ProductCardProps) {
  const primaryImg = getPrimaryImage(product);
  const imgSrc = primaryImg ? resolveImageUrl(primaryImg.local_path) : getImageFallbackSvg(product.name);
  const imgWidth = primaryImg?.width ?? 400;
  const imgHeight = primaryImg?.height ?? 300;

  return (
    <Link
      to={`/product/${product.id}`}
      aria-label={product.name}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
        color: 'inherit',
        height: '100%',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <img
          src={imgSrc}
          alt={`${product.name} image`}
          width={imgWidth}
          height={imgHeight}
          loading="lazy"
          decoding="async"
          onError={e => { (e.currentTarget as HTMLImageElement).src = getImageFallbackSvg(product.name); }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

      </div>

      {/* Content */}
      <div style={{ padding: size === 'sm' ? 'var(--space-2)' : 'var(--space-3)' }}>
        <p
          className="line-clamp-2"
          style={{
            margin: '0 0 var(--space-1)',
            fontSize: 'var(--text-base)',
            fontWeight: 500,
            color: 'var(--color-text)',
            lineHeight: 1.4,
          }}
        >
          {product.name}
        </p>

        {product.brand && (
          <p
            className="line-clamp-1"
            style={{
              margin: '0 0 var(--space-2)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            {product.brand}
          </p>
        )}

        {product.seller_location && (
          <p
            className="line-clamp-1"
            style={{
              margin: 0,
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-faint)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MapPin size={12} aria-hidden="true" />
            {product.seller_location}
          </p>
        )}
      </div>
    </Link>
  );
}
