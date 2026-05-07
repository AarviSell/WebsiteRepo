// src/utils/image.ts
import type { Product, ProductImage } from '@/types/product';

/**
 * Convert a scraper local_path to the runtime URL served from /data/.
 * local_path: "shipmydeals/home-and-kitchen/..."
 * Runtime URL: "/data/shipmydeals/home-and-kitchen/..."
 */
export function resolveImageUrl(localPath: string): string {
  return `/data/${localPath}`;
}

/**
 * Get the primary image for a product (download_status === 'success').
 * Falls back to the first successful image if no primary found.
 */
export function getPrimaryImage(product: Product): ProductImage | null {
  const available = product.images.filter(img => img.download_status === 'success');
  if (available.length === 0) return null;
  return available.find(img => img.is_primary) ?? available[0] ?? null;
}

/**
 * Get all successfully downloaded images, primary first.
 */
export function getAvailableImages(product: Product): ProductImage[] {
  const available = product.images.filter(img => img.download_status === 'success');
  return [
    ...available.filter(img => img.is_primary),
    ...available.filter(img => !img.is_primary),
  ];
}

/**
 * Returns a data: URI of an inline SVG with the product's initials.
 * Used as an onError fallback for broken images.
 */
export function getImageFallbackSvg(productName: string): string {
  const initials = productName
    .split(' ')
    .slice(0, 2)
    .map(w => w?.charAt(0).toUpperCase() ?? '')
    .join('');
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23e6e4df'/><text x='200' y='220' font-family='sans-serif' font-size='120' font-weight='600' fill='%237a7974' text-anchor='middle'>${initials}</text></svg>`;
}
