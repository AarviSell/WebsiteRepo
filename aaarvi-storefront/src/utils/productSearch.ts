import { getProductCode } from '@/utils/catalogue';
import type { Product } from '@/types/product';

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, '');
}

function specificationText(product: Product) {
  return Object.entries(product.specifications ?? {})
    .flatMap(([key, value]) => [key, value])
    .filter(Boolean)
    .join(' ');
}

export function buildProductSearchText(product: Product) {
  return [
    product.name,
    product.brand,
    product.description,
    product.category,
    product.category_label,
    product.subcategory,
    product.subcategory_label,
    product.sub_subcategory,
    product.product_code,
    getProductCode(product),
    specificationText(product),
  ]
    .filter(Boolean)
    .join(' ');
}

export function withProductSearchText(product: Product): Product {
  return {
    ...product,
    search_text: buildProductSearchText(product),
  };
}

function scoreProduct(product: Product, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) return 0;

  const queryTokens = normalizedQuery.split(' ').filter(token => token.length > 0);
  const compactQuery = compactSearchText(query);
  const nameText = normalizeSearchText(product.name);
  const categoryText = normalizeSearchText([
    product.category,
    product.category_label,
    product.subcategory,
    product.subcategory_label,
    product.sub_subcategory,
  ].filter(Boolean).join(' '));
  const codeText = normalizeSearchText([product.product_code, getProductCode(product)].filter(Boolean).join(' '));
  const compactCode = compactSearchText(codeText);
  const fullText = normalizeSearchText(product.search_text ?? buildProductSearchText(product));

  const phraseMatch = fullText.includes(normalizedQuery);
  const codeMatch = compactQuery.length >= 2 && compactCode.includes(compactQuery);
  const tokenMatch = queryTokens.every(token => fullText.includes(token) || compactCode.includes(compactSearchText(token)));

  if (!phraseMatch && !codeMatch && !tokenMatch) return 0;

  let score = 1;
  if (codeMatch) score += 500;
  if (nameText === normalizedQuery) score += 260;
  else if (nameText.includes(normalizedQuery)) score += 180;
  if (categoryText.includes(normalizedQuery)) score += 120;
  if (phraseMatch) score += 80;

  for (const token of queryTokens) {
    if (nameText.includes(token)) score += 24;
    else if (categoryText.includes(token)) score += 18;
    else if (fullText.includes(token)) score += 10;
  }

  return score;
}

export function searchProducts(products: Product[], query: string, options?: { limit?: number }) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) return [];

  const scoredProducts = products
    .map(product => ({ product, score: scoreProduct(product, query) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));

  const results = scoredProducts.map(result => result.product);
  return typeof options?.limit === 'number' ? results.slice(0, options.limit) : results;
}