// src/hooks/useSearch.ts
import { useMemo } from 'react';
import { useProductStore } from '@/store/useProductStore';

export function useSearch(query: string, options?: { limit?: number }) {
  const fuse = useProductStore(s => s.fuse);
  return useMemo(() => {
    if (!fuse || !query || query.length < 2) return [];
    return fuse.search(query, { limit: options?.limit ?? 24 });
  }, [fuse, query, options?.limit]);
}
