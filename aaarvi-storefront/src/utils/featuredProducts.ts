export const FEATURED_PRODUCTS_SLUG = 'featured-products';
export const FEATURED_SOURCE_SLUG = 'legacy-collection';

type ViewportSize = {
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getCurrentSceneViewport(): ViewportSize {
  if (typeof window === 'undefined') return { width: 1280, height: 720 };
  return {
    width: Math.max(1, window.innerWidth),
    height: Math.max(1, window.innerHeight),
  };
}

/** Matches the interactive category scene grid slot count for the current viewport. */
export function getFeaturedProductSlotCount(viewport: ViewportSize): number {
  const width = Math.max(320, viewport.width);
  const height = Math.max(420, viewport.height);
  const aspect = width / height;
  const isVeryNarrow = width < 370;
  const isVeryShort = height < 505;

  let columns = 5;
  if (isVeryNarrow) columns = 2;
  else if (width < 760) columns = 3;
  else if (width < 1080 || aspect < 1.08) columns = 4;
  if (isVeryShort && columns > 4) columns = 4;

  const rows = isVeryShort ? 2 : 3;
  return columns * rows;
}

export function getFeaturedProductDisplayCount(legacyCount: number, viewport: ViewportSize): number {
  return Math.min(Math.max(legacyCount, 0), getFeaturedProductSlotCount(viewport));
}

export function shuffleProducts<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
