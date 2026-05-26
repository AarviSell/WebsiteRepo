// src/types/product.ts

export interface ProductImage {
  url: string;
  local_path: string;
  filename: string;
  is_primary: boolean;
  width?: number;
  height?: number;
  download_status: 'pending' | 'success' | 'failed';
}

export interface Product {
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
  images: ProductImage[];
  product_code?: string;
  search_text?: string;
  catalogue_pdf?: string;
  catalogue_page?: number;
  catalogue_image_index?: number;
  catalogue_page_path?: string;
  seller_name?: string;
  seller_location?: string;
  scraped_at: string;
}

export interface CategoryNode {
  slug: string;
  label: string;
  count: number;
  source_sites: ('indiamart' | 'shipmydeals')[];
  children: SubcategoryNode[];
}

export interface SubcategoryNode {
  slug: string;
  label: string;
  count: number;
}

export interface FilterState {
  query: string;
  sources: ('indiamart' | 'shipmydeals')[];
  category: string | null;
  subcategory: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  hasImages: boolean;
  hasDescription: boolean;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'name_asc';
  page: number;
}
