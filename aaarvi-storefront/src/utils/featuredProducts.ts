import type { Product } from '@/types/product';

export const FEATURED_PRODUCTS_SLUG = 'featured-products';

type FeaturedProductLike = Pick<Product, 'product_code' | 'images'>;

type ViewportSize = {
  width: number;
  height: number;
};

function productImagePaths(product: FeaturedProductLike): string {
  return (product.images ?? []).map(image => image.local_path ?? '').join(' ');
}

/** Bag catalogue (GCP → bags-2026 / B1:) and canvas tote (EcoCarry → canvas-totes / A1) imports. */
export function isFeaturedCatalogProduct(product: FeaturedProductLike): boolean {
  const code = (product.product_code ?? '').trim();
  if (/^B1:/i.test(code) || /^A1\s+\d+/i.test(code)) return true;

  const paths = productImagePaths(product);
  return paths.includes('bags-2026') || paths.includes('canvas-totes');
}

export function getFeaturedCatalogProducts<T extends FeaturedProductLike>(products: T[]): T[] {
  return products.filter(isFeaturedCatalogProduct);
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

/** Home orbit badge: show first-page capacity, not the full featured pool size. */
export function getFeaturedProductDisplayCount(featuredCount: number, viewport: ViewportSize): number {
  return Math.min(Math.max(featuredCount, 0), getFeaturedProductSlotCount(viewport));
}

export function shuffleProducts<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function selectFeaturedProducts<T extends FeaturedProductLike>(products: T[], count?: number): T[] {
  const featured = shuffleProducts(getFeaturedCatalogProducts(products));
  if (count == null) return featured;
  return featured.slice(0, Math.max(0, count));
}
