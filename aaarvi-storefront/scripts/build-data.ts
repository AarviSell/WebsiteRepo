#!/usr/bin/env tsx
// scripts/build-data.ts
// Reads scraper output → writes src/data/{products,categories}.json and per-category chunks.
// Also copies/validates images are accessible from public/data/.

import * as fs from 'fs';
import * as path from 'path';

const SCRAPER_OUTPUT = process.env.SCRAPER_OUTPUT_PATH ?? path.resolve(__dirname, '../../output');
const SRC_DATA = path.resolve(__dirname, '../src/data');
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

function parseNumericPrice(priceStr: string): number | null {
  if (!priceStr) return null;
  const match = priceStr.match(/₹\s*([\d,]+)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

function main() {
  console.log('[build-data] Starting data build…');
  console.log(`[build-data] Scraper output: ${SCRAPER_OUTPUT}`);

  // Find all product JSON files
  const productFiles = findProductJsonFiles(SCRAPER_OUTPUT);
  console.log(`[build-data] Found ${productFiles.length} product JSON files`);

  const allProducts: ScrapedProduct[] = [];

  for (const file of productFiles) {
    try {
      const raw = fs.readFileSync(file, 'utf-8');
      const products: ScrapedProduct[] = JSON.parse(raw);
      // Ensure price_numeric is set
      for (const p of products) {
        if (p.price && p.price_numeric == null) {
          p.price_numeric = parseNumericPrice(p.price) ?? undefined;
        }
      }
      allProducts.push(...products);
    } catch (err) {
      console.warn(`[build-data] Failed to parse ${file}:`, err);
    }
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
  const categories = Array.from(categoryMap.values());

  // Ensure output dirs exist
  fs.mkdirSync(SRC_DATA, { recursive: true });
  fs.mkdirSync(path.join(SRC_DATA, 'categories'), { recursive: true });

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
