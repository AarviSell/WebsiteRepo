import type { Product } from '@/types/product';
import { getPrimaryImage, resolveImageUrl } from '@/utils/image';

export interface CataloguePageSource {
  imagePath: string;
  imageUrl: string;
  fallbackImagePath?: string;
  fallbackImageUrl?: string;
  isPdfPage: boolean;
  label: string;
  pdfName?: string;
  pageNumber?: number;
  imageIndex?: number;
  productCode?: string;
}

const CROPPED_CATALOGUE_RE = /^cropped\/([^/]+)\/(\d+)\.(?:jpe?g|png|webp)$/i;
const CATALOGUE_PAGE_RE = /^catalogue-pages\/([^/]+)\/(\d+)\.(?:jpe?g|png|webp)$/i;
const CATALOGUE_PAGE_COUNTS: Record<string, number> = {
  'affordable-200-300': 114,
  'economical-50-100': 69,
  'elite-above-1000': 70,
  'high-end-600-1000': 77,
  'low-range-20-50': 65,
  'mid-range-300-400': 57,
  'premium-400-600': 91,
  'super-affordable-100-200': 136,
};

function normaliseCode(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\s+/g, ' ');
}

export function getProductCode(product: Product): string | undefined {
  return normaliseCode(
    product.product_code
      ?? product.specifications?.['Product Code']
      ?? product.specifications?.['Product code']
      ?? product.specifications?.['product_code'],
  );
}

export function getCataloguePageSource(product: Product): CataloguePageSource | null {
  const primaryImage = getPrimaryImage(product);
  const sourceImagePath = product.catalogue_page_path ?? primaryImage?.local_path;
  if (!sourceImagePath) return null;

  const productCode = getProductCode(product);
  const normalizedSourcePath = sourceImagePath.replace(/\\/g, '/');
  const croppedMatch = normalizedSourcePath.match(CROPPED_CATALOGUE_RE);
  const pageMatch = normalizedSourcePath.match(CATALOGUE_PAGE_RE);
  const imageIndex = product.catalogue_image_index
    ?? (croppedMatch ? Number(croppedMatch[2]) : undefined)
    ?? (pageMatch ? Number(pageMatch[2]) - 1 : undefined);
  const pdfName = product.catalogue_pdf
    ?? (croppedMatch ? `${croppedMatch[1]}.pdf` : undefined)
    ?? (pageMatch ? `${pageMatch[1]}.pdf` : undefined);
  const isPdfPage = Boolean(pdfName || product.catalogue_page_path || croppedMatch || pageMatch);
  const pdfSlug = pdfName?.replace(/\.pdf$/i, '');
  const inferredPageNumber = typeof imageIndex === 'number' && Number.isFinite(imageIndex) ? imageIndex + 1 : undefined;
  const pageCount = pdfSlug ? CATALOGUE_PAGE_COUNTS[pdfSlug] : undefined;
  const pageNumber = product.catalogue_page
    ?? (inferredPageNumber && pageCount && inferredPageNumber > pageCount ? imageIndex : inferredPageNumber);
  const derivedPagePath = isPdfPage && pdfSlug && pageNumber
    ? `catalogue-pages/${pdfSlug}/${pageNumber}.png`
    : undefined;
  const imagePath = pageMatch ? normalizedSourcePath : derivedPagePath ?? normalizedSourcePath;
  const fallbackImagePath = imagePath !== normalizedSourcePath ? normalizedSourcePath : undefined;

  const label = isPdfPage
    ? [pdfName, pageNumber ? `page ${pageNumber}` : undefined, productCode ? `code ${productCode}` : undefined]
        .filter(Boolean)
        .join(' · ')
    : 'Product image';

  return {
    imagePath,
    imageUrl: resolveImageUrl(imagePath),
    fallbackImagePath,
    fallbackImageUrl: fallbackImagePath ? resolveImageUrl(fallbackImagePath) : undefined,
    isPdfPage,
    label,
    pdfName,
    pageNumber,
    imageIndex,
    productCode,
  };
}