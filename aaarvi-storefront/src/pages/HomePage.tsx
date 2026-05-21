// src/pages/HomePage.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Eye, Home, Package, Search, Sparkles, Star, Waves,
} from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useProductStore } from '@/store/useProductStore';
import { useProductData } from '@/hooks/useProductData';
import type { CategoryNode } from '@/types/product';

const CATEGORY_VISUALS: Record<string, {
  icon: string;
  eyebrow: string;
  blurb: string;
  cardStart: string;
  cardEnd: string;
}> = {
  'home-and-kitchen': {
    icon: '🏠',
    eyebrow: 'Domestic Edit',
    blurb: 'Layered home, kitchen, and daily-use finds presented like a collector set.',
    cardStart: '#7a5200',
    cardEnd: '#f0b429',
  },
  'cleaning-product': {
    icon: '✨',
    eyebrow: 'Clean Sweep',
    blurb: 'Utility-first cleaning products in a luminous gold card stack.',
    cardStart: '#5a2d91',
    cardEnd: '#a855f7',
  },
  'essentials': {
    icon: '🛒',
    eyebrow: 'Daily Core',
    blurb: 'Everyday stock-up products framed as premium picks instead of a basic list.',
    cardStart: '#4f1d6f',
    cardEnd: '#d7a0ff',
  },
  'best-sellers': {
    icon: '🔥',
    eyebrow: 'Most Wanted',
    blurb: 'High-velocity products pulled forward with stronger contrast and warmer glow.',
    cardStart: '#7a2d00',
    cardEnd: '#f59e0b',
  },
  'in-the-spotlight': {
    icon: '⭐',
    eyebrow: 'Feature Drop',
    blurb: 'A spotlight scene for current highlights, styled to feel editorial and cinematic.',
    cardStart: '#3b1458',
    cardEnd: '#c084fc',
  },
};

const FALLBACK_CATEGORIES: Pick<CategoryNode, 'slug' | 'label' | 'count'>[] = [
  { slug: 'home-and-kitchen', label: 'Home & Kitchen', count: 32 },
  { slug: 'cleaning-product', label: 'Cleaning', count: 12 },
  { slug: 'in-the-spotlight', label: 'In The Spotlight', count: 9 },
  { slug: 'essentials', label: 'Essentials', count: 8 },
  { slug: 'best-sellers', label: 'Best Sellers', count: 4 },
];

function wrapIndex(index: number, length: number) {
  return (index + length) % length;
}

function getLoopOffset(index: number, activeIndex: number, length: number) {
  let offset = index - activeIndex;

  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;

  return offset;
}

function getCardStyle(index: number, activeIndex: number, length: number) {
  const offset = getLoopOffset(index, activeIndex, length);
  const depth = Math.abs(offset);
  const hidden = depth > 2;
  const translateX = offset * 34;
  const translateY = depth * 16;
  const rotateY = offset * -24;
  const scale = 1 - depth * 0.08;

  return {
    '--card-transform': `translate3d(${translateX}%, ${translateY}px, 0) rotateY(${rotateY}deg) scale(${scale})`,
    '--card-opacity': hidden ? '0' : `${1 - depth * 0.18}`,
    '--card-z': `${40 - depth}`,
  } as React.CSSProperties;
}

function CategoryCard({
  cat,
  active,
  style,
  onSelect,
}: {
  cat: Pick<CategoryNode, 'slug' | 'label' | 'count'>;
  active: boolean;
  style: React.CSSProperties;
  onSelect: () => void;
}) {
  const visual = CATEGORY_VISUALS[cat.slug] ?? {
    icon: '✦',
    eyebrow: 'Collection',
    blurb: 'Curated category showcase.',
    cardStart: '#53216e',
    cardEnd: '#f0b429',
  };

  return (
    <button
      type="button"
      className={`home-category-card${active ? ' is-active' : ''}`}
      style={{
        ...style,
        ['--card-start' as string]: visual.cardStart,
        ['--card-end' as string]: visual.cardEnd,
        pointerEvents: Number.parseFloat(String(style.opacity ?? style['--card-opacity'])) === 0 ? 'none' : 'auto',
      }}
      aria-current={active ? 'true' : undefined}
      aria-label={`${cat.label}, ${cat.count} products`}
      onClick={onSelect}
    >
      <span className="home-category-card__surface">
        <span className="home-category-card__header">
          <span className="home-category-card__badge">{visual.eyebrow}</span>
          <span className="home-category-card__icon" aria-hidden="true">{visual.icon}</span>
        </span>

        <span className="home-category-card__body">
          <span className="home-category-card__count">{cat.count} products</span>
          <span className="home-category-card__hero-icon" aria-hidden="true">{visual.icon}</span>
        </span>

        <span className="home-category-card__footer">
          <span className="home-category-card__slug">{cat.slug.replaceAll('-', ' ')}</span>
          <span className="home-category-card__slug">{active ? 'Tap to enter →' : 'AArvi Edit'}</span>
        </span>
      </span>
    </button>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { getFeaturedProducts } = useProductStore();
  const { categories, allProducts, isLoaded } = useProductData();
  const timeoutRef = useRef<number | null>(null);
  const sceneCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);

  const featured = useMemo(() => (isLoaded ? getFeaturedProducts(8) : []), [getFeaturedProducts, isLoaded]);
  const activeCategory = sceneCategories[activeIndex] ?? sceneCategories[0];
  const activeVisual = CATEGORY_VISUALS[activeCategory?.slug] ?? CATEGORY_VISUALS['home-and-kitchen'];

  useEffect(() => {
    setActiveIndex(prev => Math.min(prev, Math.max(sceneCategories.length - 1, 0)));
  }, [sceneCategories.length]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (sceneCategories.length === 0 || isZooming) return;

      if (event.key === 'ArrowLeft') {
        setActiveIndex(prev => wrapIndex(prev - 1, sceneCategories.length));
      }

      if (event.key === 'ArrowRight') {
        setActiveIndex(prev => wrapIndex(prev + 1, sceneCategories.length));
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isZooming, sceneCategories.length]);

  function goTo(index: number) {
    if (sceneCategories.length === 0 || isZooming) return;
    setActiveIndex(wrapIndex(index, sceneCategories.length));
  }

  function handleShopCategory() {
    if (!activeCategory || isZooming) return;

    setIsZooming(true);
    timeoutRef.current = window.setTimeout(() => {
      navigate(`/category/${activeCategory.slug}`, {
        state: {
          fromScene: 'home-category-zoom',
          categorySlug: activeCategory.slug,
        },
      });
    }, 620);
  }

  return (
    <main id="main-content" className="home-page">
      <section className={`home-hero${isZooming ? ' is-zooming' : ''}`} aria-label="Category showcase hero">
        <span className="scene-orb scene-orb--violet" aria-hidden="true" />
        <span className="scene-orb scene-orb--gold" aria-hidden="true" />
        <span className="scene-orb scene-orb--rose" aria-hidden="true" />

        <div className="home-hero__shell">
          <div className="home-copy">
            <p className="eyebrow">AArvi Curated Catalog</p>
            <h1>Trade the basic grid for a cinematic storefront.</h1>
            <p>
              Browse categories as collectible cards, then dive straight into product scenes that keep the same purple-and-gold atmosphere all the way through.
            </p>

            <div className="home-copy__meta" aria-label="Store highlights">
              <span><Sparkles size={16} aria-hidden="true" /> Cinematic category browsing</span>
              <span><Search size={16} aria-hidden="true" /> Fast search across {allProducts.length || 'hundreds of'} products</span>
              <span><Waves size={16} aria-hidden="true" /> Gold-on-violet motion system</span>
            </div>

            <div className="home-search glass-panel">
              <p className="home-search__caption">Jump directly into the catalog</p>
              <SearchBar />
            </div>
          </div>

          <div className="home-scene">
            <p className="home-scene__hint">Tap to focus · tap active card to enter</p>

            <button
              type="button"
              className="scene-nav scene-nav--prev"
              aria-label="Previous category"
              onClick={() => goTo(activeIndex - 1)}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>

            <div className="home-stage" aria-live="polite">
              {sceneCategories.map((cat, index) => (
                <CategoryCard
                  key={cat.slug}
                  cat={cat}
                  active={index === activeIndex}
                  style={getCardStyle(index, activeIndex, sceneCategories.length)}
                  onSelect={() => {
                    if (index === activeIndex) {
                      handleShopCategory();
                      return;
                    }

                    goTo(index);
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className="scene-nav scene-nav--next"
              aria-label="Next category"
              onClick={() => goTo(activeIndex + 1)}
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>

            <div className="home-scene__meta">
              <p className="home-scene__label">{activeVisual.eyebrow}</p>
              <h2 className="home-scene__title">{activeCategory?.label}</h2>
              <p className="home-scene__count">{activeCategory?.count} products staged for this collection</p>
            </div>

            <div className="scene-dots" aria-label="Choose category scene">
              {sceneCategories.map((cat, index) => (
                <button
                  key={cat.slug}
                  type="button"
                  className={`scene-dot${index === activeIndex ? ' is-active' : ''}`}
                  aria-label={`Go to ${cat.label}`}
                  aria-pressed={index === activeIndex}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-featured" aria-labelledby="featured-heading">
        <div className="home-featured__shell glass-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Featured Orbit</p>
              <h2 id="featured-heading">Current product highlights</h2>
            </div>
            <p>
              The homepage now leads with motion first, but the catalog still stays one step away with featured products ready below the hero scene.
            </p>
          </div>

          <ProductGrid products={featured} loading={!isLoaded} skeletonCount={8} />
        </div>
      </section>
    </main>
  );
}
