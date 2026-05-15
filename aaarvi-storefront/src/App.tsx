// src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useProductStore } from '@/store/useProductStore';
import { HomePageScene } from '@/pages/HomePageScene';
import './App.css';

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

/** Layout with header + footer used for all non-home pages */
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="app-shell flex flex-col min-h-dvh"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}
    >
      <Header />
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
      <Footer />
    </div>
  );
}

/** Forces CategoryPage to fully remount when slug changes so isExiting state never carries over */
function CategoryPageWrapper() {
  const { slug } = useParams<{ slug: string }>();
  return <CategoryPage key={slug} />;
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
      <Routes>
        {/* Homepage — fullscreen Three.js scene, no layout wrapper */}
        <Route path="/" element={<HomePageScene />} />

        {/* All other pages use the standard header/footer layout */}
        <Route path="/search" element={
          <AppLayout><SearchResultsPage /></AppLayout>
        } />
        <Route path="/category/:slug" element={
          <AppLayout><CategoryPageWrapper /></AppLayout>
        } />
        <Route path="/category/:slug/:subSlug" element={
          <AppLayout><CategoryPageWrapper /></AppLayout>
        } />
        <Route path="/product/:id" element={
          <AppLayout><ProductDetailPage /></AppLayout>
        } />
        <Route path="*" element={
          <AppLayout><NotFoundPage /></AppLayout>
        } />
      </Routes>
    </HashRouter>
  );
}
