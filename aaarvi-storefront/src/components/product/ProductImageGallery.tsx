// src/components/product/ProductImageGallery.tsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, ProductImage } from '@/types/product';
import { resolveImageUrl, getAvailableImages, getImageFallbackSvg } from '@/utils/image';

interface ProductImageGalleryProps {
  product: Product;
}

export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const images: ProductImage[] = getAvailableImages(product);
  const [activeIndex, setActiveIndex] = useState(0);

  const current = images[activeIndex];
  const visibleThumbs = images.slice(0, 6);

  function goTo(i: number) {
    setActiveIndex(Math.max(0, Math.min(i, images.length - 1)));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
    if (e.key === 'ArrowRight') goTo(activeIndex + 1);
  }

  if (images.length === 0) {
    return (
      <div style={{ aspectRatio: '1/1', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <img
          src={getImageFallbackSvg(product.name)}
          alt={`${product.name} placeholder`}
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {/* Main image */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '1/1',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--color-surface-2)',
        }}
        role="img"
        aria-label={`${product.name} image ${activeIndex + 1} of ${images.length}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-keyshortcuts="ArrowLeft ArrowRight"
      >
        <img
          src={current ? resolveImageUrl(current.local_path) : getImageFallbackSvg(product.name)}
          alt={`${product.name} image ${activeIndex + 1}`}
          width={current?.width ?? 800}
          height={current?.height ?? 800}
          loading="lazy"
          decoding="async"
          onError={e => { (e.currentTarget as HTMLImageElement).src = getImageFallbackSvg(product.name); }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Previous image"
              style={{
                position: 'absolute',
                left: 'var(--space-2)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.4)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                color: '#fff',
                cursor: 'pointer',
                padding: 'var(--space-2)',
                minHeight: 44,
                minWidth: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: activeIndex === 0 ? 0.3 : 1,
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex === images.length - 1}
              aria-label="Next image"
              style={{
                position: 'absolute',
                right: 'var(--space-2)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.4)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                color: '#fff',
                cursor: 'pointer',
                padding: 'var(--space-2)',
                minHeight: 44,
                minWidth: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: activeIndex === images.length - 1 ? 0.3 : 1,
              }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          role="list"
          aria-label="Image thumbnails"
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-1)',
          }}
        >
          {visibleThumbs.map((img, i) => (
            <button
              key={img.filename}
              role="listitem"
              onClick={() => goTo(i)}
              aria-label={`View image ${i + 1}`}
              aria-pressed={i === activeIndex}
              style={{
                flexShrink: 0,
                width: 64,
                height: 64,
                border: i === activeIndex ? '2px solid var(--color-primary)' : '2px solid transparent',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'none',
                padding: 0,
              }}
            >
              <img
                src={resolveImageUrl(img.local_path)}
                alt={`${product.name} thumbnail ${i + 1}`}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                onError={e => { (e.currentTarget as HTMLImageElement).src = getImageFallbackSvg(product.name); }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
