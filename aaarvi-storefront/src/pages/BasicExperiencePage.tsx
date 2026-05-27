import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Grid3X3,
  Mail,
  MessageCircle,
  Menu,
  MonitorPlay,
  Package,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useProductData } from '@/hooks/useProductData';
import { getCataloguePageSource, getProductCode } from '@/utils/catalogue';
import { getPrimaryImage, resolveImageUrl, getImageFallbackSvg } from '@/utils/image';
import { searchProducts } from '@/utils/productSearch';
import { COLLECTIONS, getCollectionMeta, getCollectionPriceRange, sortCollections } from '@/utils/collections';
import type { CategoryNode, Product } from '@/types/product';
import logoSrc from '@/assets/logo.png';

const PAGE_SIZE = 24;
const CONTACT_EMAIL = 'aarvisell@gmail.com';
const COLLECTION_SLUGS = new Set(COLLECTIONS.map(collection => collection.slug));

type BasicSort = 'featured' | 'name';

function buildMailHref(product?: Product) {
  const subject = product ? `Quote request: ${product.name}` : 'AArvi catalog quote request';
  const code = product ? getProductCode(product) : '';
  const body = product
    ? `Hi AArvi,\n\nPlease share the current price, availability, and branding options for:\n${product.name}${code ? `\nProduct code: ${code}` : ''}\nCollection: ${product.category_label}\n\nThank you.`
    : 'Hi AArvi,\n\nPlease share current pricing and availability for your product catalog.\n\nThank you.';

  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function getQuoteMessage(product: Product) {
  const productCode = getProductCode(product);
  return `Hi AArvi, I am interested in ${product.name}${productCode ? ` (code ${productCode})` : ''}. Please share pricing and availability.`;
}

function getContactNumber() {
  return (import.meta.env.VITE_AARVI_WHATSAPP_NUMBER ?? '').trim();
}

function getContactDigits(number: string) {
  return number.replace(/[^\d]/g, '');
}

function formatContactNumber(number: string) {
  const trimmed = number.trim();
  if (!trimmed) return '';
  return trimmed.replace(/(\+\d{1,3})(\d{5})(\d+)/, '$1 $2 $3');
}

function buildWhatsAppHref(product: Product) {
  const digits = getContactDigits(getContactNumber());
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(getQuoteMessage(product))}`;
}

function BasicLogo() {
  return (
    <Link to="/basic" className="basic-logo" aria-label="AArvi basic home">
      <img src={logoSrc} alt="Arvi logo" />
      <span>Arvi</span>
    </Link>
  );
}

function toCategoryNodes(categories: CategoryNode[], allProducts: Product[]): CategoryNode[] {
  const categoryBySlug = new Map(sortCollections(categories).map(category => [category.slug, category]));

  return COLLECTIONS.map(collection => {
    const category = categoryBySlug.get(collection.slug);
    return {
      slug: collection.slug,
      label: category?.label ?? collection.label,
      count: category?.count ?? allProducts.filter(product => product.category === collection.slug).length,
      source_sites: category?.source_sites ?? [],
      children: category?.children ?? [],
    };
  });
}

function BasicHeader() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, allProducts } = useProductData();
  const displayCategories = useMemo(() => toCategoryNodes(categories, allProducts), [allProducts, categories]);
  const currentQuery = searchParams.get('q') ?? '';
  const [menuOpen, setMenuOpen] = useState(false);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get('q') ?? '');
    const trimmedQuery = query.trim();
    navigate(trimmedQuery ? `/basic/search?q=${encodeURIComponent(trimmedQuery)}` : '/basic');
    setMenuOpen(false);
  }

  return (
    <header className="basic-header">
      <div className="basic-header__top">
        <button type="button" className="basic-header__menu" aria-label="Open categories" onClick={() => setMenuOpen(true)}>
          <Menu size={21} aria-hidden="true" />
        </button>
        <BasicLogo />
        <form className="basic-search" role="search" aria-label="Search products" onSubmit={submitSearch}>
          <input
            type="search"
            name="q"
            key={currentQuery}
            defaultValue={currentQuery}
            placeholder="Search products, codes, collections"
          />
          <button type="submit" aria-label="Search">
            <Search size={19} aria-hidden="true" />
          </button>
        </form>
        <Link to="/interactive" className="basic-header__interactive">
          <MonitorPlay size={18} aria-hidden="true" />
          <span>Interactive</span>
        </Link>
      </div>

      <nav className="basic-header__nav" aria-label="Basic collection navigation">
        {displayCategories.map(category => (
          <Link key={category.slug} to={`/basic/category/${category.slug}`}>
            {category.label}
          </Link>
        ))}
      </nav>

      {menuOpen && (
        <div className="basic-drawer" role="dialog" aria-modal="true" aria-label="Basic categories">
          <button type="button" className="basic-drawer__backdrop" aria-label="Close categories" onClick={() => setMenuOpen(false)} />
          <aside className="basic-drawer__panel">
            <div className="basic-drawer__head">
              <BasicLogo />
              <button type="button" aria-label="Close categories" onClick={() => setMenuOpen(false)}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <Link to="/basic" onClick={() => setMenuOpen(false)}>All products</Link>
            {displayCategories.map(category => (
              <Link key={category.slug} to={`/basic/category/${category.slug}`} onClick={() => setMenuOpen(false)}>
                <span>{category.label}</span>
                <small>{getCollectionPriceRange(category.slug)}</small>
              </Link>
            ))}
          </aside>
        </div>
      )}
    </header>
  );
}

function BasicProductCard({ product }: { product: Product }) {
  const primaryImage = getPrimaryImage(product);
  const imageSrc = primaryImage ? resolveImageUrl(primaryImage.local_path) : getImageFallbackSvg(product.name);
  const productCode = getProductCode(product);
  const description = product.description?.trim();

  return (
    <article className="basic-product-card">
      <Link to={`/basic/product/${product.id}`} className="basic-product-card__media" aria-label={product.name}>
        <img
          src={imageSrc}
          alt={`${product.name} image`}
          loading="lazy"
          decoding="async"
          onError={event => { event.currentTarget.src = getImageFallbackSvg(product.name); }}
        />
      </Link>
      <div className="basic-product-card__body">
        <Link to={`/basic/product/${product.id}`} className="basic-product-card__title">
          {product.name}
        </Link>
        <p className="basic-product-card__collection">{product.category_label}</p>
        {description && <p className="basic-product-card__desc">{description}</p>}
        <div className="basic-product-card__meta">
          {productCode && <span>Code {productCode}</span>}
          <span>Contact for price</span>
        </div>
        <div className="basic-product-card__actions">
          <Link to={`/basic/product/${product.id}`} className="basic-button basic-button--secondary">
            View details
          </Link>
          <a href={buildMailHref(product)} className="basic-button basic-button--primary">
            <Mail size={15} aria-hidden="true" />
            Contact
          </a>
        </div>
      </div>
    </article>
  );
}

function BasicCategoryRail({ categories, activeSlug }: { categories: CategoryNode[]; activeSlug?: string }) {
  return (
    <aside className="basic-category-rail" aria-label="Collections">
      <div className="basic-category-rail__title">
        <Grid3X3 size={16} aria-hidden="true" />
        Collections
      </div>
      <Link className={!activeSlug ? 'is-active' : ''} to="/basic">
        <span>All products</span>
      </Link>
      {categories.map(category => (
        <Link key={category.slug} className={activeSlug === category.slug ? 'is-active' : ''} to={`/basic/category/${category.slug}`}>
          <span>{category.label}</span>
          <small>{getCollectionPriceRange(category.slug)}</small>
        </Link>
      ))}
    </aside>
  );
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  return (
    <nav className="basic-pagination" aria-label="Product pagination">
      <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </nav>
  );
}

export function BasicExperiencePage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const { allProducts, categories, isLoaded } = useProductData();
  const [sort, setSort] = useState<BasicSort>('featured');
  const [page, setPage] = useState({ key: '', value: 1 });
  const query = searchParams.get('q')?.trim() ?? '';
  const basicProducts = useMemo(() => allProducts.filter(product => COLLECTION_SLUGS.has(product.category)), [allProducts]);
  const displayCategories = useMemo(() => toCategoryNodes(categories, basicProducts), [basicProducts, categories]);
  const activeCategory = displayCategories.find(category => category.slug === slug);
  const pageKey = `${query}|${slug ?? ''}|${sort}`;
  const activePage = page.key === pageKey ? page.value : 1;

  const filteredProducts = useMemo(() => {
    const searchedProducts = query.length >= 2 ? searchProducts(basicProducts, query) : basicProducts;
    const categoryProducts = slug ? searchedProducts.filter(product => product.category === slug) : searchedProducts;
    if (sort === 'name') {
      return [...categoryProducts].sort((a, b) => a.name.localeCompare(b.name));
    }
    return categoryProducts;
  }, [basicProducts, query, slug, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(activePage, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const title = query
    ? `Search results for "${query}"`
    : activeCategory?.label ?? 'All AArvi Products';

  return (
    <div className="basic-experience app-shell">
      <BasicHeader />
      <main id="main-content" className="basic-main">
        <section className="basic-hero" aria-label="AArvi basic catalog">
          <div>
            <p className="basic-kicker">AArvi Basic Catalog</p>
            <h1>Browse products in a clean store layout.</h1>
          </div>
          <a href={buildMailHref()} className="basic-button basic-button--primary">
            <Mail size={16} aria-hidden="true" />
            Request pricing
          </a>
        </section>

        <section className="basic-collection-strip" aria-label="Shop by collection">
          {displayCategories.map(category => {
            const meta = getCollectionMeta(category.slug);
            return (
              <Link key={category.slug} to={`/basic/category/${category.slug}`} className="basic-collection-tile">
                <span>{category.label}</span>
                <small>{meta?.priceRange ?? 'Custom range'}</small>
                <em>{category.count} items</em>
              </Link>
            );
          })}
        </section>

        <div className="basic-catalog-layout">
          <BasicCategoryRail categories={displayCategories} activeSlug={slug} />
          <section className="basic-results" aria-label="Products">
            <div className="basic-results__toolbar">
              <div>
                <h2>{title}</h2>
                <p>{isLoaded ? `${filteredProducts.length} products` : 'Loading products'}</p>
              </div>
              <label className="basic-sort">
                <SlidersHorizontal size={16} aria-hidden="true" />
                <select value={sort} onChange={event => setSort(event.target.value as BasicSort)}>
                  <option value="featured">Featured</option>
                  <option value="name">Name A-Z</option>
                </select>
              </label>
            </div>

            {!isLoaded ? (
              <div className="basic-grid" aria-label="Loading products">
                {Array.from({ length: 12 }, (_, index) => <div key={index} className="basic-product-skeleton" />)}
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="basic-empty">
                <Package size={30} aria-hidden="true" />
                <h2>No products found</h2>
                <p>Try another search term or collection.</p>
              </div>
            ) : (
              <div className="basic-grid">
                {paginatedProducts.map(product => <BasicProductCard key={product.id} product={product} />)}
              </div>
            )}

            <Pagination page={safePage} totalPages={totalPages} onPageChange={nextPage => setPage({ key: pageKey, value: nextPage })} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function BasicProductPage() {
  const { id } = useParams<{ id: string }>();
  const { allProducts, isLoaded } = useProductData();
  const basicProducts = useMemo(() => allProducts.filter(item => COLLECTION_SLUGS.has(item.category)), [allProducts]);
  const product = useMemo(() => basicProducts.find(item => item.id === id), [basicProducts, id]);
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return basicProducts.filter(item => item.category === product.category && item.id !== product.id).slice(0, 4);
  }, [basicProducts, product]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  if (!isLoaded) {
    return (
      <div className="basic-experience app-shell">
        <BasicHeader />
        <main className="basic-main">
          <div className="basic-product-detail basic-product-detail--loading" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="basic-experience app-shell">
        <BasicHeader />
        <main className="basic-main">
          <div className="basic-empty">
            <Package size={30} aria-hidden="true" />
            <h1>Product not found</h1>
            <Link to="/basic" className="basic-button basic-button--primary">Back to catalog</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const catalogueSource = getCataloguePageSource(product);
  const primaryImage = getPrimaryImage(product);
  const fallbackImageSrc = primaryImage ? resolveImageUrl(primaryImage.local_path) : getImageFallbackSvg(product.name);
  const imageSrc = catalogueSource?.imageUrl ?? fallbackImageSrc;
  const productCode = getProductCode(product);
  const contactNumber = getContactNumber();
  const contactDigits = getContactDigits(contactNumber);
  const formattedContactNumber = formatContactNumber(contactNumber);
  const whatsappHref = buildWhatsAppHref(product);

  return (
    <div className="basic-experience app-shell">
      <BasicHeader />
      <main id="main-content" className="basic-main basic-main--product">
        <Link to={`/basic/category/${product.category}`} className="basic-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to {product.category_label}
        </Link>

        <header className="basic-product-titlebar">
          <p className="basic-kicker">{product.category_label}</p>
          <h1>{product.name}</h1>
          {productCode && <p>Product code: {productCode}</p>}
        </header>

        <section className="basic-product-detail">
          <div className="basic-product-detail__media basic-product-detail__catalogue">
            <img
              src={imageSrc}
              alt={catalogueSource ? `${product.name} catalogue page` : `${product.name} image`}
              onError={event => {
                event.currentTarget.src = catalogueSource?.fallbackImageUrl ?? fallbackImageSrc;
              }}
            />
            {catalogueSource && (
              <p>{catalogueSource.label}</p>
            )}
          </div>
          <aside className="basic-contact-box" aria-label="Contact AArvi">
            <h2>Contact us for price</h2>
            <p>Final pricing depends on stock, quantity, branding, and delivery details.</p>
            <div className="basic-contact-box__actions">
              <a href={buildMailHref(product)} className="basic-button basic-button--primary">
                <Mail size={16} aria-hidden="true" />
                Email quote
              </a>
              {whatsappHref ? (
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="basic-button basic-button--secondary basic-button--whatsapp">
                  <MessageCircle size={16} aria-hidden="true" />
                  Phone / WhatsApp
                </a>
              ) : (
                <span className="basic-contact-box__unavailable">Phone / WhatsApp not configured</span>
              )}
            </div>
            <div className="basic-contact-box__links">
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              {contactDigits && <a href={`tel:${contactDigits}`}>{formattedContactNumber || contactNumber}</a>}
            </div>
          </aside>
        </section>

        {relatedProducts.length > 0 && (
          <section className="basic-related" aria-label="Related products">
            <h2>More from {product.category_label}</h2>
            <div className="basic-grid basic-grid--compact">
              {relatedProducts.map(item => <BasicProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}