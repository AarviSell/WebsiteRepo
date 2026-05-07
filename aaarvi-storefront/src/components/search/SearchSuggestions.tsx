// src/components/search/SearchSuggestions.tsx
import type { FuseResult } from 'fuse.js';
import type { Product } from '@/types/product';
import { resolveImageUrl, getPrimaryImage, getImageFallbackSvg } from '@/utils/image';
import { Badge } from '@/components/ui/Badge';

interface SearchSuggestionsProps {
  id: string;
  results: FuseResult<Product>[];
  activeIndex: number;
  onSelect: (id: string) => void;
}

export function SearchSuggestions({ id, results, activeIndex, onSelect }: SearchSuggestionsProps) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Search suggestions"
      style={{
        position: 'absolute',
        top: 'calc(100% + var(--space-1))',
        left: 0,
        right: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        listStyle: 'none',
        margin: 0,
        padding: 'var(--space-1)',
        zIndex: 100,
        maxHeight: 360,
        overflowY: 'auto',
      }}
    >
      {results.map((result, i) => {
        const p = result.item;
        const primaryImg = getPrimaryImage(p);
        const imgSrc = primaryImg ? resolveImageUrl(primaryImg.local_path) : getImageFallbackSvg(p.name);
        const isActive = i === activeIndex;

        return (
          <li
            key={p.id}
            id={`suggestion-${i}`}
            role="option"
            aria-selected={isActive}
            onClick={() => onSelect(p.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              background: isActive ? 'var(--color-surface-2)' : 'transparent',
            }}
          >
            <img
              src={imgSrc}
              alt=""
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
              onError={e => { (e.currentTarget as HTMLImageElement).src = getImageFallbackSvg(p.name); }}
              style={{
                width: 32,
                height: 32,
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0,
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--color-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {p.name}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: 2 }}>
                <Badge variant="category">{p.category_label}</Badge>
              </div>
            </div>

          </li>
        );
      })}
    </ul>
  );
}
