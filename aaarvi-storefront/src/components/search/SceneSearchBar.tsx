import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { getPrimaryImage, resolveImageUrl, getImageFallbackSvg } from '@/utils/image';
import { getProductCode } from '@/utils/catalogue';
import type { Product } from '@/types/product';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

interface SceneSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  onProductSelect?: (product: Product) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function SceneSearchBar({
  value,
  onChange,
  onSearch,
  onProductSelect,
  onClear,
  placeholder = 'Search name, code, or product type',
  label = 'Search products',
  disabled = false,
  autoFocus = false,
}: SceneSearchBarProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(value, 140);
  const results = useSearch(debouncedQuery, { limit: 6 });
  const trimmedValue = value.trim();
  const showSuggestions = open && trimmedValue.length >= 2 && results.length > 0;

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus, disabled]);

  const submitSearch = useCallback(() => {
    if (trimmedValue.length < 2 || disabled) return;
    setOpen(false);
    setActiveIndex(-1);
    onSearch(trimmedValue);
  }, [disabled, onSearch, trimmedValue]);

  const selectProduct = useCallback((product: Product) => {
    onChange(product.name);
    setOpen(false);
    setActiveIndex(-1);
    onProductSelect?.(product);
  }, [onChange, onProductSelect]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <form
        role="search"
        aria-label={label}
        onSubmit={event => {
          event.preventDefault();
          if (showSuggestions && activeIndex >= 0 && results[activeIndex]) {
            selectProduct(results[activeIndex].item);
            return;
          }
          submitSearch();
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
          alignItems: 'center',
          gap: '0.45rem',
          minHeight: 46,
          padding: '0 0.45rem 0 0.8rem',
          borderRadius: 999,
          border: open ? '1px solid rgba(240,180,41,0.72)' : '1px solid rgba(168,85,247,0.36)',
          background: 'rgba(17,7,24,0.78)',
          boxShadow: '0 16px 42px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(18px)',
          transition: 'border-color 180ms, box-shadow 180ms',
        }}
      >
        <Search size={16} aria-hidden="true" style={{ color: '#f0b429', flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="search"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="scene-search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `scene-search-suggestion-${activeIndex}` : undefined}
          onChange={event => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={event => {
            if (!showSuggestions) {
              if (event.key === 'Escape') {
                setOpen(false);
                setActiveIndex(-1);
              }
              return;
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex(index => Math.min(index + 1, results.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex(index => Math.max(index - 1, -1));
            } else if (event.key === 'Escape') {
              setOpen(false);
              setActiveIndex(-1);
            }
          }}
          style={{
            minWidth: 0,
            minHeight: 42,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#faf5ff',
            font: 'inherit',
            fontSize: '0.88rem',
          }}
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              onChange('');
              setOpen(false);
              setActiveIndex(-1);
              onClear?.();
              inputRef.current?.focus();
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(250,245,255,0.08)',
              color: 'rgba(250,245,255,0.78)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          disabled={trimmedValue.length < 2 || disabled}
          style={{
            minHeight: 34,
            borderRadius: 999,
            border: 'none',
            background: trimmedValue.length >= 2 && !disabled ? '#a855f7' : 'rgba(168,85,247,0.28)',
            color: '#fff',
            cursor: trimmedValue.length >= 2 && !disabled ? 'pointer' : 'default',
            fontSize: '0.76rem',
            fontWeight: 800,
            padding: '0 0.85rem',
          }}
        >
          Search
        </button>
      </form>

      {showSuggestions && (
        <ul
          id="scene-search-suggestions"
          role="listbox"
          aria-label="Search suggestions"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.45rem)',
            left: 0,
            right: 0,
            zIndex: 80,
            margin: 0,
            padding: '0.35rem',
            listStyle: 'none',
            maxHeight: 360,
            overflowY: 'auto',
            borderRadius: '0.85rem',
            border: '1px solid rgba(240,180,41,0.32)',
            background: 'rgba(10,3,18,0.96)',
            boxShadow: '0 24px 52px rgba(0,0,0,0.42)',
            backdropFilter: 'blur(22px)',
          }}
        >
          {results.map((result, index) => {
            const product = result.item;
            const primaryImage = getPrimaryImage(product);
            const imageSrc = primaryImage ? resolveImageUrl(primaryImage.local_path) : getImageFallbackSvg(product.name);
            const code = getProductCode(product);
            const active = index === activeIndex;

            return (
              <li
                key={product.id}
                id={`scene-search-suggestion-${index}`}
                role="option"
                aria-selected={active}
                onMouseDown={event => {
                  event.preventDefault();
                  selectProduct(product);
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '38px minmax(0, 1fr)',
                  gap: '0.7rem',
                  alignItems: 'center',
                  padding: '0.55rem',
                  borderRadius: '0.65rem',
                  cursor: 'pointer',
                  background: active ? 'rgba(168,85,247,0.2)' : 'transparent',
                }}
              >
                <img
                  src={imageSrc}
                  alt=""
                  width={38}
                  height={38}
                  loading="lazy"
                  decoding="async"
                  onError={event => { event.currentTarget.src = getImageFallbackSvg(product.name); }}
                  style={{ width: 38, height: 38, objectFit: 'cover', borderRadius: '0.45rem' }}
                />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', color: '#faf5ff', fontSize: '0.84rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</span>
                  <span style={{ display: 'block', color: 'rgba(250,245,255,0.62)', fontSize: '0.72rem', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {[code ? `Code ${code}` : undefined, product.category_label, product.subcategory_label].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}