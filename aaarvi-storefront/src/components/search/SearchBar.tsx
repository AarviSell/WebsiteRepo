// src/components/search/SearchBar.tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { useProductData } from '@/hooks/useProductData';
import { searchProductsByName } from '@/utils/productSearch';
import { SearchSuggestions } from './SearchSuggestions';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function SearchBar() {
  const navigate = useNavigate();
  const { allProducts } = useProductData();
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(input, 150);
  const results = useSearch(debouncedQuery, { limit: 5 });

  const showSuggestions = open && input.length >= 2 && results.length > 0;

  const handleNavigateToSearch = useCallback(() => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    const firstResult = searchProductsByName(allProducts, trimmedInput, { limit: 1 })[0];
    const targetSlug = firstResult?.category ?? 'standard-collection';
    setOpen(false);
    setActiveIndex(-1);
    navigate(`/category/${targetSlug}`, {
      state: {
        searchQuery: trimmedInput,
        searchProductId: undefined,
        focusProductId: undefined,
        searchOrigin: 'home',
        searchGlobal: true,
      },
    });
  }, [allProducts, input, navigate]);

  const handleSuggestionClick = useCallback((id: string) => {
    const product = results.find(result => result.item.id === id)?.item;
    if (!product) return;
    setOpen(false);
    setActiveIndex(-1);
    setInput('');
    navigate(`/category/${product.category}`, {
      state: {
        searchQuery: product.name,
        searchProductId: product.id,
        focusProductId: product.id,
        searchOrigin: 'home',
        searchGlobal: true,
      },
    });
  }, [navigate, results]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') handleNavigateToSearch();
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          handleSuggestionClick(results[activeIndex].item.id);
        } else {
          handleNavigateToSearch();
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }, [showSuggestions, results, activeIndex, handleNavigateToSearch, handleSuggestionClick]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const listboxId = 'search-suggestions';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--color-surface)',
          border: `1.5px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '0 var(--space-3)',
          gap: 'var(--space-2)',
          transition: 'border-color 150ms',
        }}
      >
        <Search size={16} aria-hidden="true" style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
          type="search"
          placeholder="Search products…"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: 'var(--color-text)',
            fontSize: 'var(--text-sm)',
            padding: 'var(--space-2) 0',
            outline: 'none',
            minHeight: 44,
          }}
        />
        {input && (
          <button
            type="button"
            onClick={() => { setInput(''); setOpen(false); inputRef.current?.focus(); }}
            aria-label="Clear search"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-faint)',
              padding: 'var(--space-1)',
              display: 'flex',
              alignItems: 'center',
              minHeight: 44,
              minWidth: 44,
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showSuggestions && (
        <SearchSuggestions
          id={listboxId}
          results={results}
          activeIndex={activeIndex}
          onSelect={handleSuggestionClick}
        />
      )}
    </div>
  );
}
