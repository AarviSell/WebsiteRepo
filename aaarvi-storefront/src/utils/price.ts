// src/utils/price.ts

/**
 * Parse a raw price string like "₹145/piece" or "₹1,200 - ₹2,500"
 * Returns the lower bound as a float, or null if unparseable.
 */
export function parseNumericPrice(priceStr: string): number | null {
  if (!priceStr) return null;
  const match = priceStr.match(/₹\s*([\d,]+)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

/**
 * Format a price for display. Keeps the original string if it's clean.
 * Adds ₹ prefix if missing.
 */
export function formatDisplayPrice(priceStr: string): string {
  if (!priceStr) return '—';
  if (priceStr.includes('₹')) return priceStr;
  return `₹${priceStr}`;
}

/**
 * Extract price unit from a raw price string like "₹145/piece"
 */
export function extractPriceUnit(priceStr: string): string | null {
  if (!priceStr) return null;
  const match = priceStr.match(/\/\s*(.+)$/);
  return match ? match[1].trim() : null;
}
