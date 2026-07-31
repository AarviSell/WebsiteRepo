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
  'aarvi-signature-collection-43',
  'aarvi-signature-collection-51',
  'aarvi-signature-collection-64',
  'aarvi-signature-collection-82',
]);

const REMOVED_PRODUCT_CODES = new Set([
  'C187',
  'E208S',
  'H06',
  'H125',
  'H211',
  'N21',
  'E112A',
  'Q172',
  'Q136',
]);

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

  if (/\bice\s+bucket\b/.test(text)) {
    return 'Ice bucket';
  }

  if (/\bdura\s+powerplus\b/.test(text) && /\bcasseroles?\b/.test(text)) {
    return 'Dura Powerplus casserole';
  }

  if (/\bpen\s+stand\b/.test(text)) {
    return 'Pen stand';
  }

  if (/\bmanicure\b/.test(text)) {
    return 'Manicure kit';
  }

  if (/\bled\s+blow\s+lantern\b/.test(text) || (/\blantern\b/.test(text) && !/\blantern[- ]style\b/.test(text))) {
    return 'Lantern';
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

  if (
    /\b(?:clock|weather\s*station|temp\s*tracker|flip\s*display|backlit)\b/.test(text) ||
    /\bsuper\s+sweep\b/.test(text)
  ) {
    return 'Clock';
  }

  if (
    /\btoys?\b/.test(text) ||
    /\brubik'?s?\b/.test(text) ||
    /\bsudoku\b/.test(text) ||
    /\bpuzzle\b/.test(text)
  ) {
    return 'Toy';
  }

  // Electronics / tech gadgets (chargers, cables, hubs, audio, power boards).
  // Keep bags, flasks, cleaners, notebooks, and plain phone stands.
  const isBagOrTote =
    /\b(?:laptop\s+(?:bag|sleeve|backpack|storage)|canvas\s+tote|overnighter\s+bag)\b/.test(text);
  const isCleanerOrHousehold =
    /\b(?:cleaner|cleaning|washing\s+machine|feather\s+duster|laundry)\b/.test(text);
  const isFlaskOrDrinkware =
    /\b(?:vacuum\s+(?:flask|bottle|mug|tumbler)|vacuumflask)\b/.test(text) &&
    !/\b(?:charger|usb\s*hub|speaker|headphone|earbud|cooling\s*pad)\b/.test(text);

  if (!isBagOrTote && !isCleanerOrHousehold && !isFlaskOrDrinkware) {
    if (
      /\b(?:bluetooth|blue\s*tooth)\b/.test(text) ||
      /\bspeakers?\b/.test(text) ||
      /pc\s*speakers?|pcspeaker/.test(text) ||
      /\b(?:headphones?|earphones?|earbuds?|ear\s*buds?)\b/.test(text) ||
      /\b(?:usb\s*hub|usbhub|usb\s*ports?|usbports)\b/.test(text) ||
      /\busb\s*fan\b/.test(text) ||
      /\bmousepad.*usb|usb.*mousepad|mousepadwithusb\b/.test(text) ||
      /\b(?:car|wall|fast|ultra\s*fast|dual|triple|glow(?:ing)?|light\s*up)\s*chargers?\b/.test(
        text,
      ) ||
      (/\bchargers?\b/.test(text) &&
        /\b(?:usb|cable|type\s*c|qc|mobile|phone|android|iphone)\b/.test(text)) ||
      /\b(?:charging|data)\s+cables?\b/.test(text) ||
      /\bmulti\s*connector(?:\s+data)?\s*(?:cable)?\b/.test(text) ||
      /\b(?:2\s*side|all\s+in\s+1|clip[- ]?on|lanyard)\s+(?:charging\s+)?cables?\b/.test(text) ||
      /\b(?:power|extension)\s*boards?\b/.test(text) ||
      /\b(?:powerboard|extensionboard|multipointextensionboard)\b/.test(text) ||
      /\bcooling\s*pads?\b/.test(text) ||
      /\blaptop\s+stands?\b/.test(text) ||
      /\b(?:tech\s+gadget|gadget\s+organizer)\b/.test(text) ||
      /music\s+amplifiers?/.test(text) ||
      /\ballowscharging\b/.test(text)
    ) {
      return 'Tech/gadget';
    }
  }

  return null;
}

export function isExcludedProduct(product: ExcludableProduct): boolean {
  return getProductExclusionReason(product) !== null;
}

export function filterExcludedProducts<T extends ExcludableProduct>(products: T[]): T[] {
  return products.filter(product => !isExcludedProduct(product));
}
