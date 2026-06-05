import type { Product } from '@/types/product';

type ExcludableProduct = Pick<Product, 'id' | 'name' | 'description' | 'product_code'>;

const REMOVED_PRODUCT_IDS = new Set([
  'aarvi-executive-collection-10',
  'aarvi-executive-collection-16',
  'aarvi-executive-collection-76',
  'aarvi-executive-collection-82',
  'aarvi-executive-collection-83',
  'aarvi-preferred-collection-5',
  'aarvi-legacy-collection-23',
  'aarvi-legacy-collection-55',
  'aarvi-legacy-collection-67',
  'aarvi-signature-collection-34',
  'aarvi-signature-collection-64',
]);

const REMOVED_PRODUCT_CODES = new Set(['C187', 'E208S', 'H06']);

function productText(product: Pick<Product, 'name' | 'description'>): string {
  return `${product.name} ${product.description ?? ''}`.toLowerCase();
}

function normalizeProductCode(code?: string): string {
  return (code ?? '').replace(/\s+/g, '').toUpperCase();
}

function isDigitalClock(text: string): boolean {
  return /\b(digital|led\s*clock|flip\s*display|backlit|illusion|weather\s*station|temp\s*tracker|glow\s*clock|multifunction\s*magic|large\s*display|hut\s*shape)\b/.test(
    text,
  );
}

export function getProductExclusionReason(product: ExcludableProduct): string | null {
  const text = productText(product);
  const name = product.name.toLowerCase();
  const productCode = normalizeProductCode(product.product_code);

  if (product.id && REMOVED_PRODUCT_IDS.has(product.id)) {
    return 'Removed product';
  }

  if (productCode && REMOVED_PRODUCT_CODES.has(productCode)) {
    return 'Removed product code';
  }

  if (
    /\bauto\s+spray\s+room\s+freshener\b/.test(text) ||
    (/\bpure\s+air\b/.test(text) && /\b(?:air\s*freshener|room\s*freshener)\b/.test(text))
  ) {
    return 'Room freshener';
  }

  if (/\bserving\s+jug\b/.test(text)) {
    return 'Serving jug';
  }

  if (/\bgroove\s+handybean\b/.test(text)) {
    return 'Groove Handybean';
  }

  if (/\btaplite\s+feather\s+touch\b/.test(text)) {
    return 'Taplite Feather Touch';
  }

  if (/\bdual\s+usbwall\b/.test(text) && /\bcar\s+charger\b/.test(text)) {
    return 'Dual USB wall & car charger';
  }

  if (/\blumitouch\b/.test(text)) {
    return 'Powerplus Lumitouch';
  }

  if (/\bpower\s*bank\b|\bpowerbank\b/.test(text)) {
    return 'Power bank';
  }

  if (
    /\bcandy\s*server\b/.test(text) ||
    /\bsnack\s*server\b/.test(text) ||
    /\bsnack\s*set\b/.test(text) ||
    /\bsnack\s*\/\s*fruit\s*bowl\b/.test(text) ||
    /\bfruit\s*bowl\b/.test(name) ||
    /\b(?:dessert|sweets?|ice\s*cream|pudding|nuts)\b.*\bserving\s+bowls?\b/.test(text) ||
    /\bserving\s+bowls?\b.*\b(?:dessert|sweets?|ice\s*cream|pudding|nuts)\b/.test(text)
  ) {
    return 'Candy/snack server';
  }

  if (
    /\bvessel\b/.test(text) ||
    /\bstainless\s*steel\s*serving\s*bowl\b/.test(text) ||
    /\bcompartment\s*plate\b/.test(text) ||
    /dinners?et/i.test(text) ||
    /\bspill[- ]?proof\s*bowls?\b.*\bstainless\s*steel\s*tray\b/.test(text) ||
    /\bset\s+of\s+3\s+spill[- ]?proof\s+bowls?\b/.test(text)
  ) {
    return 'Steel vessel';
  }

  if (/torch/i.test(text)) {
    return 'Torch';
  }

  const isIncenseBurner = /\b(incense|camphor|kapoor|dhoop|bakhoor|burner)\b/.test(text);
  const isMultiItemGiftSet =
    /\b\d+[- ]?(?:in[- ]?1|pc|pcs?)\b/.test(name) &&
    /\b(?:set|gift)\b/.test(name) &&
    !/\bdoctor\s+lamp\b/.test(text);
  if (!isIncenseBurner && !isMultiItemGiftSet) {
    if (
      /\bdoctor\s+lamp\b/.test(text) ||
      /\brechargeable\s+(?:led\s+)?lamp\b/.test(text) ||
      /\blamp\s+rechargeable\b/.test(text) ||
      /\bglow\s+lamp\b/.test(text) ||
      /\b(?:desk|table|night|blow|cob)\s+lamp\b/.test(text) ||
      /\bfolding\s+cob\s+desk\s+lamp\b/.test(text) ||
      /\bled\s+blow\s+lamp\b/.test(text) ||
      /\b(?:flexi\s+)?table\s+lamp\b/.test(text) ||
      /\bemergency\s+lamp\b/.test(text) ||
      /\blamp\s+with\s+(?:usbhub|tumbler|detachable|folding|360)/.test(text) ||
      /\bpenzen\b.*\blamp\b/.test(text) ||
      /\bbrighto\b.*\blamp\b/.test(text) ||
      /\bwerglow\b.*\blamp\b/.test(text) ||
      /\bmagi\s+flex\b.*\blamp\b/.test(text) ||
      /\bpodium\b.*\blamp\b/.test(text) ||
      /\bswan\b.*\blamp\b/.test(text) ||
      /\bpower\s+glow\b.*\blamp\b/.test(text) ||
      /\b2[- ]mode\s+lamp\b/.test(text) ||
      /\bled\s+night\s+lamp\b/.test(text)
    ) {
      return 'Lamp';
    }
  }

  if (/\b(?:analog|analogue)\s*clock\b/.test(text)) {
    return 'Analogue clock';
  }
  if (/\bsuper\s+sweep\b/.test(text)) {
    return 'Analogue clock';
  }
  if (/\b(?:wall\s*\/\s*table|wall|table)\s*clock\b/.test(text) && !isDigitalClock(text)) {
    return 'Analogue clock';
  }
  if (/\btable\s+clock\s+with\b/.test(text) && !isDigitalClock(text)) {
    return 'Analogue clock';
  }

  return null;
}

export function isExcludedProduct(product: ExcludableProduct): boolean {
  return getProductExclusionReason(product) !== null;
}

export function filterExcludedProducts<T extends ExcludableProduct>(products: T[]): T[] {
  return products.filter(product => !isExcludedProduct(product));
}
