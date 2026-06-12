import { useEffect, useState } from 'react';

/** Viewports narrower than 768px are treated as phone/mobile. */
export const MOBILE_VIEWPORT_MAX_WIDTH = 767;

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${MOBILE_VIEWPORT_MAX_WIDTH}px)`).matches;
}

export function useIsMobileViewport(): boolean {
  return useIsCompactViewport(MOBILE_VIEWPORT_MAX_WIDTH);
}

export function useIsCompactViewport(maxWidth = 720) {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(max-width: ${maxWidth}px)`).matches;
  });

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [maxWidth]);

  return isCompact;
}