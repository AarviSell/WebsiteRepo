import type { Product } from '@/types/product';

function productText(product: Pick<Product, 'name' | 'description'>): string {
  return `${product.name} ${product.description ?? ''}`.toLowerCase();
}

function isDigitalClock(text: string): boolean {
  return /\b(digital|led\s*clock|flip\s*display|backlit|illusion|weather\s*station|temp\s*tracker|glow\s*clock|multifunction\s*magic|large\s*display|hut\s*shape)\b/.test(
    text,
  );
}

export function getProductExclusionReason(product: Pick<Product, 'name' | 'description'>): string | null {
  const text = productText(product);
  const name = product.name.toLowerCase();

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

export function isExcludedProduct(product: Pick<Product, 'name' | 'description'>): boolean {
  return getProductExclusionReason(product) !== null;
}

export function filterExcludedProducts<T extends Pick<Product, 'name' | 'description'>>(products: T[]): T[] {
  return products.filter(product => !isExcludedProduct(product));
}
