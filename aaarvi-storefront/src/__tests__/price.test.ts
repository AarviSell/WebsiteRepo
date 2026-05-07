// src/__tests__/price.test.ts
import { describe, it, expect } from 'vitest';
import { parseNumericPrice, formatDisplayPrice } from '@/utils/price';

describe('parseNumericPrice', () => {
  it('parses a plain rupee price', () => {
    expect(parseNumericPrice('₹145')).toBe(145);
  });

  it('parses a price with unit', () => {
    expect(parseNumericPrice('₹145/piece')).toBe(145);
  });

  it('parses a price with thousands separator', () => {
    expect(parseNumericPrice('₹1,200')).toBe(1200);
  });

  it('parses the lower bound of a range', () => {
    expect(parseNumericPrice('₹1,200 - ₹2,500')).toBe(1200);
  });

  it('returns null for a string with no ₹', () => {
    expect(parseNumericPrice('100 USD')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseNumericPrice('')).toBeNull();
  });

  it('handles space after ₹', () => {
    expect(parseNumericPrice('₹ 500')).toBe(500);
  });
});

describe('formatDisplayPrice', () => {
  it('returns — for empty string', () => {
    expect(formatDisplayPrice('')).toBe('—');
  });

  it('returns price unchanged when ₹ present', () => {
    expect(formatDisplayPrice('₹145/piece')).toBe('₹145/piece');
  });

  it('adds ₹ prefix when missing', () => {
    expect(formatDisplayPrice('500')).toBe('₹500');
  });
});
