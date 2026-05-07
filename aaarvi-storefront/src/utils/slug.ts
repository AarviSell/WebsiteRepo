// src/utils/slug.ts

/**
 * Convert a human label into a URL slug.
 * e.g. "Food & Beverages" → "food-and-beverages"
 */
export function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Convert a URL slug to a human-readable label.
 * e.g. "food-and-beverages" → "Food And Beverages"
 */
export function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
