// src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useProductStore } from '@/store/useProductStore';

const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
const CategoryPage = lazy(() => import('@/pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

function PageLoader() {
  return (
    <div
      className="mx-auto px-4 py-8"
      style={{
        maxWidth: 'var(--content-wide)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function App() {
  const { theme, loadData } = useProductStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <HashRouter>
      <div
        className="flex flex-col min-h-dvh"
        style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
      >
        <Header />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/category/:slug/:subSlug" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </HashRouter>
  );
}
