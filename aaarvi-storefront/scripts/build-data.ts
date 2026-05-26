#!/usr/bin/env tsx
// scripts/build-data.ts
// Reads scraper output → writes src/data/{products,categories}.json and per-category chunks.
// Also copies/validates images are accessible from public/data/.

import * as fs from 'fs';
import * as path from 'path';

const SCRAPER_OUTPUT = process.env.SCRAPER_OUTPUT_PATH ?? path.resolve(__dirname, '../../aArvi-scraper/output');
const SRC_DATA = path.resolve(__dirname, '../src/data');
const CATEGORY_DATA = path.join(SRC_DATA, 'categories');
const PUBLIC_DATA = path.resolve(__dirname, '../public/data');

interface ScrapedImage {
  url: string;
  local_path: string;
  filename: string;
  is_primary: boolean;
  width?: number;
  height?: number;
  download_status: 'pending' | 'success' | 'failed';
}

interface ScrapedProduct {
  id: string;
  source_site: 'indiamart' | 'shipmydeals';
  url: string;
  name: string;
  brand?: string;
  category: string;
  category_label: string;
  subcategory?: string;
  subcategory_label?: string;
  sub_subcategory?: string;
  price?: string;
  price_numeric?: number;
  price_unit?: string;
  description?: string;
  specifications: Record<string, string>;
  images: ScrapedImage[];
  product_code?: string;
  catalogue_pdf?: string;
  catalogue_page?: number;
  catalogue_image_index?: number;
  catalogue_page_path?: string;
  seller_name?: string;
  seller_location?: string;
  scraped_at: string;
}

interface CategoryNode {
  slug: string;
  label: string;
  count: number;
  source_sites: ('indiamart' | 'shipmydeals')[];
  children: SubcategoryNode[];
}

interface SubcategoryNode {
  slug: string;
  label: string;
  count: number;
}

function findProductJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findProductJsonFiles(full));
    } else if (entry.name === 'products.json') {
      results.push(full);
    }
  }
  return results;
}

function findExistingCategoryProductFiles(): string[] {
  if (!fs.existsSync(CATEGORY_DATA)) return [];
  return fs
    .readdirSync(CATEGORY_DATA, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => path.join(CATEGORY_DATA, entry.name));
}

function readExistingCategories(): CategoryNode[] {
  const file = path.join(SRC_DATA, 'categories.json');
  if (!fs.existsSync(file)) return [];

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return Array.isArray(parsed) ? parsed as CategoryNode[] : [];
  } catch (err) {
    console.warn(`[build-data] Failed to parse existing categories.json:`, err);
    return [];
  }
}

function parseNumericPrice(priceStr: string): number | null {
  if (!priceStr) return null;
  const match = priceStr.match(/₹\s*([\d,]+)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

function normalizeProduct(product: ScrapedProduct): ScrapedProduct {
  if (product.price && product.price_numeric == null) {
    return { ...product, price_numeric: parseNumericPrice(product.price) ?? undefined };
  }
  return product;
}

function addProductsFromFile(file: string, allProducts: ScrapedProduct[], seenProductIds: Set<string>) {
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const products = JSON.parse(raw);
    if (!Array.isArray(products)) return;

    for (const product of products as ScrapedProduct[]) {
      if (!product.id || seenProductIds.has(product.id)) continue;
      seenProductIds.add(product.id);
      allProducts.push(normalizeProduct(product));
    }
  } catch (err) {
    console.warn(`[build-data] Failed to parse ${file}:`, err);
  }
}

function main() {
  console.log('[build-data] Starting data build…');
  console.log(`[build-data] Scraper output: ${SCRAPER_OUTPUT}`);

  // Find all product JSON files
  const productFiles = findProductJsonFiles(SCRAPER_OUTPUT);
  console.log(`[build-data] Found ${productFiles.length} product JSON files`);

  const allProducts: ScrapedProduct[] = [];
  const seenProductIds = new Set<string>();

  for (const file of productFiles) {
    addProductsFromFile(file, allProducts, seenProductIds);
  }

  const existingCategoryProductFiles = findExistingCategoryProductFiles();
  if (existingCategoryProductFiles.length > 0) {
    console.log(`[build-data] Preserving ${existingCategoryProductFiles.length} existing category chunks`);
  }
  for (const file of existingCategoryProductFiles) {
    addProductsFromFile(file, allProducts, seenProductIds);
  }

  console.log(`[build-data] Total products: ${allProducts.length}`);

  // Build category tree
  const categoryMap = new Map<string, CategoryNode>();
  for (const p of allProducts) {
    if (!categoryMap.has(p.category)) {
      categoryMap.set(p.category, {
        slug: p.category,
        label: p.category_label,
        count: 0,
        source_sites: [],
        children: [],
      });
    }
    const cat = categoryMap.get(p.category)!;
    cat.count++;
    if (!cat.source_sites.includes(p.source_site)) {
      cat.source_sites.push(p.source_site);
    }

    if (p.subcategory && p.subcategory_label) {
      let sub = cat.children.find(c => c.slug === p.subcategory);
      if (!sub) {
        sub = { slug: p.subcategory, label: p.subcategory_label, count: 0 };
        cat.children.push(sub);
      }
      sub.count++;
    }
  }
  const generatedCategories = Array.from(categoryMap.values());
  const existingCategories = readExistingCategories();
  const generatedBySlug = new Map(generatedCategories.map(category => [category.slug, category]));
  const existingSlugs = new Set(existingCategories.map(category => category.slug));
  const categories = [
    ...existingCategories.map(existing => {
      const generated = generatedBySlug.get(existing.slug);
      if (!generated) return existing;
      return {
        ...generated,
        label: existing.label || generated.label,
        children: generated.children.length > 0 ? generated.children : existing.children,
      };
    }),
    ...generatedCategories.filter(category => !existingSlugs.has(category.slug)),
  ];

  // Ensure output dirs exist
  fs.mkdirSync(SRC_DATA, { recursive: true });
  fs.mkdirSync(CATEGORY_DATA, { recursive: true });

  // Write products.json
  fs.writeFileSync(
    path.join(SRC_DATA, 'products.json'),
    JSON.stringify(allProducts, null, 2),
    'utf-8'
  );
  console.log('[build-data] Wrote src/data/products.json');

  // Write categories.json
  fs.writeFileSync(
    path.join(SRC_DATA, 'categories.json'),
    JSON.stringify(categories, null, 2),
    'utf-8'
  );
  console.log('[build-data] Wrote src/data/categories.json');

  // Write per-category chunks
  for (const cat of categories) {
    const catProducts = allProducts.filter(p => p.category === cat.slug);
    fs.writeFileSync(
      path.join(SRC_DATA, 'categories', `${cat.slug}.json`),
      JSON.stringify(catProducts, null, 2),
      'utf-8'
    );
    console.log(`[build-data] Wrote src/data/categories/${cat.slug}.json (${catProducts.length} products)`);
  }

  // Ensure public/data exists (images should already be there from scraper)
  fs.mkdirSync(PUBLIC_DATA, { recursive: true });
  console.log(`[build-data] public/data at ${PUBLIC_DATA} — ensure scraper images are copied here`);

  console.log('[build-data] Done!');
}

main();
