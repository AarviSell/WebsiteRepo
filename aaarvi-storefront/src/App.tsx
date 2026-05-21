// src/App.tsx
import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useProductStore } from '@/store/useProductStore';
import { HomePageScene } from '@/pages/HomePageScene';
import { CategoryPageScene } from '@/pages/CategoryPageScene';
import './App.css';

const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
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
        {/* Category pages — fullscreen Three.js cube scene, no layout wrapper */}
        <Route path="/category/:slug" element={<CategoryPageScene />} />
        <Route path="/category/:slug/:subSlug" element={<CategoryPageScene />} />
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
