import type { Product } from '@/types/product';

export const FEATURED_PRODUCTS_SLUG = 'featured-products';
/** Older featured source before bag/tote imports were added. */
export const FEATURED_LEGACY_SOURCE_SLUG = 'legacy-collection';

type FeaturedProductLike = Pick<Product, 'product_code' | 'images' | 'category'> &
  Partial<Pick<Product, 'id' | 'name'>>;

type ViewportSize = {
  width: number;
  height: number;
};

function productImagePaths(product: FeaturedProductLike): string {
  return (product.images ?? []).map(image => image.local_path ?? '').join(' ');
}

function productKey(product: FeaturedProductLike): string {
  return product.id ?? `${product.category}:${product.product_code}:${product.images?.[0]?.local_path ?? ''}`;
}

/** Bag catalogue (GCP → bags-2026 / B1:) and canvas tote (EcoCarry → canvas-totes / A1) imports. */
export function isFeaturedCatalogProduct(product: FeaturedProductLike): boolean {
  const code = (product.product_code ?? '').trim();
  if (/^B1:/i.test(code) || /^A1\s+\d+/i.test(code)) return true;

  const paths = productImagePaths(product);
  return paths.includes('bags-2026') || paths.includes('canvas-totes');
}

/**
 * EcoCarry eco gift sets (Forest / Terra from /collections/new) should appear
 * regularly on the featured page. Match by id/name, or canvas-totes gift sets.
 */
export function isFeaturedGiftSetProduct(product: FeaturedProductLike): boolean {
  const name = (product.name ?? '').toLowerCase();
  const id = (product.id ?? '').toLowerCase();
  if (/forest-eco-gift-set|terra-eco-gift-set/.test(id)) return true;
  if (/forest eco gift set|terra eco gift set/.test(name)) return true;

  const isGift = /\bgift\s*set\b/.test(name) || /gift-set/.test(id);
  return isGift && productImagePaths(product).includes('canvas-totes');
}

/** Pre-existing featured pool: Legacy Collection products that are not bag/tote imports. */
export function isLegacyFeaturedProduct(product: FeaturedProductLike): boolean {
  return product.category === FEATURED_LEGACY_SOURCE_SLUG && !isFeaturedCatalogProduct(product);
}

export function getFeaturedCatalogProducts<T extends FeaturedProductLike>(products: T[]): T[] {
  return products.filter(isFeaturedCatalogProduct);
}

export function getLegacyFeaturedProducts<T extends FeaturedProductLike>(products: T[]): T[] {
  return products.filter(isLegacyFeaturedProduct);
}

/** Combined featured pool used for counts and selection. */
export function getFeaturedPoolProducts<T extends FeaturedProductLike>(products: T[]): T[] {
  return [...getFeaturedCatalogProducts(products), ...getLegacyFeaturedProducts(products)];
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

/**
 * One-page featured mix: gift sets are prioritized, then roughly half bag/tote
 * imports and half older Legacy products. Short pools are backfilled.
 */
export function selectFeaturedProducts<T extends FeaturedProductLike>(products: T[], count?: number): T[] {
  const gifts = shuffleProducts(products.filter(isFeaturedGiftSetProduct));
  const newer = shuffleProducts(
    getFeaturedCatalogProducts(products).filter(product => !isFeaturedGiftSetProduct(product)),
  );
  const older = shuffleProducts(
    getLegacyFeaturedProducts(products).filter(product => !isFeaturedGiftSetProduct(product)),
  );

  if (count == null) {
    return shuffleProducts([...gifts, ...newer, ...older]);
  }

  const target = Math.max(0, count);
  if (target === 0) return [];

  // Keep gift sets regularly visible on the single featured page.
  const giftTake = Math.min(gifts.length, Math.min(2, Math.max(1, Math.ceil(target * 0.15))));
  const fromGifts = gifts.slice(0, giftTake);
  const remaining = target - fromGifts.length;
  const preferredNew = Math.ceil(remaining / 2);
  const fromNew = newer.slice(0, Math.min(preferredNew, newer.length));
  const fromOld = older.slice(0, Math.min(remaining - fromNew.length, older.length));
  const selected = [...fromGifts, ...fromNew, ...fromOld];

  if (selected.length < target) {
    const selectedKeys = new Set(selected.map(productKey));
    const remainder = shuffleProducts([...gifts, ...newer, ...older]).filter(product => {
      const key = productKey(product);
      if (selectedKeys.has(key)) return false;
      selectedKeys.add(key);
      return true;
    });
    selected.push(...remainder.slice(0, target - selected.length));
  }

  return shuffleProducts(selected).slice(0, target);
}
