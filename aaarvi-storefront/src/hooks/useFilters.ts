// src/hooks/useFilters.ts
// All filter state lives in URL query params — not in Zustand.
// This keeps filter state shareable and back/forward navigation correct.
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Product, FilterState } from '@/types/product';

const PAGE_SIZE = 24;

function parseFilterState(params: URLSearchParams): FilterState {
  const sourcesRaw = params.get('source');
  const sources = sourcesRaw
    ? (sourcesRaw.split(',').filter(s => s === 'indiamart' || s === 'shipmydeals') as ('indiamart' | 'shipmydeals')[])
    : [];

  const sortRaw = params.get('sort');
  const validSorts = ['relevance', 'price_asc', 'price_desc', 'name_asc'] as const;
  const sortBy = (validSorts.find(s => s === sortRaw) ?? 'relevance');

  return {
    query: params.get('q') ?? '',
    sources,
    category: params.get('category'),
    subcategory: params.get('sub'),
    minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : null,
    maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : null,
    hasImages: params.get('hasImages') === 'true',
    hasDescription: params.get('hasDesc') === 'true',
    sortBy,
    page: Math.max(1, Number(params.get('page') ?? '1')),
  };
}

function applyFilters(products: Product[], filters: FilterState): Product[] {
  let result = [...products];

  // 1. Source filter
  if (filters.sources.length > 0) {
    result = result.filter(p => filters.sources.includes(p.source_site));
  }

  // 2. Category + subcategory
  if (filters.category) {
    result = result.filter(p => p.category === filters.category);
  }
  if (filters.subcategory) {
    result = result.filter(p => p.subcategory === filters.subcategory);
  }

  // 3. Price range (only filter products that have a numeric price)
  if (filters.minPrice !== null) {
    result = result.filter(p => p.price_numeric != null && p.price_numeric >= filters.minPrice!);
  }
  if (filters.maxPrice !== null) {
    result = result.filter(p => p.price_numeric != null && p.price_numeric <= filters.maxPrice!);
  }

  // 4. Has images
  if (filters.hasImages) {
    result = result.filter(p => p.images.some(img => img.download_status === 'success'));
  }

  // 5. Has description
  if (filters.hasDescription) {
    result = result.filter(p => p.description && p.description.trim().length > 0);
  }

  // 6. Sort
  switch (filters.sortBy) {
    case 'price_asc':
      result.sort((a, b) => (a.price_numeric ?? Infinity) - (b.price_numeric ?? Infinity));
      break;
    case 'price_desc':
      result.sort((a, b) => (b.price_numeric ?? -Infinity) - (a.price_numeric ?? -Infinity));
      break;
    case 'name_asc':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }

  return result;
}

export function useFilters(products: Product[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFilterState(searchParams), [searchParams]);

  const filteredProducts = useMemo(() => applyFilters(products, filters), [products, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  const paginatedProducts = useMemo(() => {
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, filters.page, totalPages]);

  const setFilter = useCallback(
    (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        // Always reset to page 1 when a filter changes
        next.delete('page');

        switch (key) {
          case 'sources':
            if (Array.isArray(value) && value.length > 0) {
              next.set('source', (value as string[]).join(','));
            } else {
              next.delete('source');
            }
            break;
          case 'category':
            if (value) next.set('category', String(value));
            else next.delete('category');
            next.delete('sub');
            break;
          case 'subcategory':
            if (value) next.set('sub', String(value));
            else next.delete('sub');
            break;
          case 'minPrice':
            if (value != null) next.set('minPrice', String(value));
            else next.delete('minPrice');
            break;
          case 'maxPrice':
            if (value != null) next.set('maxPrice', String(value));
            else next.delete('maxPrice');
            break;
          case 'hasImages':
            if (value) next.set('hasImages', 'true');
            else next.delete('hasImages');
            break;
          case 'hasDescription':
            if (value) next.set('hasDesc', 'true');
            else next.delete('hasDesc');
            break;
          case 'sortBy':
            if (value && value !== 'relevance') next.set('sort', String(value));
            else next.delete('sort');
            break;
          case 'query':
            if (value) next.set('q', String(value));
            else next.delete('q');
            break;
          case 'page':
            if (Number(value) > 1) next.set('page', String(value));
            else next.delete('page');
            break;
        }

        return next;
      }, { replace: false });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: false });
  }, [setSearchParams]);

  return { filters, setFilter, clearFilters, filteredProducts, paginatedProducts, totalPages };
}
