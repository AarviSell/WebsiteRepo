import { BRAND_NAME } from '@/constants/brand';

export const CONTACT_EMAIL = 'aarvisell@gmail.com';
export const DEFAULT_WHATSAPP_NUMBER = '+917984583589';

export function getWhatsAppNumber(): string {
  const configured = (import.meta.env.VITE_AARVI_WHATSAPP_NUMBER ?? '').trim();
  return configured || DEFAULT_WHATSAPP_NUMBER;
}

export function getContactDigits(number: string): string {
  return number.replace(/[^\d]/g, '');
}

export function formatContactNumber(number: string): string {
  const trimmed = number.trim();
  if (!trimmed) return '';
  return trimmed.replace(/(\+\d{1,3})(\d{5})(\d+)/, '$1 $2 $3');
}

export function buildWhatsAppHref(number: string, message: string): string {
  const digits = getContactDigits(number);
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildProductWhatsAppMessage(productName: string, productCode?: string): string {
  const codeText = productCode ? ` (code ${productCode})` : '';
  return `Hi ${BRAND_NAME}, I am interested in ${productName}${codeText}. Please share pricing and availability.`;
}

export function buildProductMailHref(
  product: { name: string; category_label: string },
  productCode?: string,
): string {
  const subject = `Quote request: ${product.name}`;
  const body = `Hi ${BRAND_NAME},\n\nPlease share the current price, availability, and branding options for:\n${product.name}${productCode ? `\nProduct code: ${productCode}` : ''}\nCollection: ${product.category_label}\n\nThank you.`;

  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function makeCaptchaChallenge(seed: string) {
  const hash = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0);
  const leftOperand = 2 + (hash % 7);
  const rightOperand = 3 + (Math.floor(hash / 7) % 6);
  return { leftOperand, rightOperand, total: leftOperand + rightOperand };
}
