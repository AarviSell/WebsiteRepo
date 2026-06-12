// src/App.tsx
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useProductStore } from '@/store/useProductStore';
import { MobileInteractiveRedirect } from '@/components/routing/MobileInteractiveRedirect';
import { ExperienceGate } from '@/pages/ExperienceGate';
import { BasicExperiencePage, BasicProductPage } from '@/pages/BasicExperiencePage';
import { BRAND_PAGE_TITLE } from '@/constants/brand';
import { getCategoryPageSceneComponent, getHomePageSceneComponent, preloadCategoryPageScene, preloadHomePageScene } from '@/pages/interactivePreload';
import './App.css';

const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage').then(m => ({ default: m.SearchResultsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

type SceneComponent = ComponentType;

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

function InteractiveLoader() {
  return (
    <main className="experience-gate experience-gate--interactive-start" aria-live="polite">
      <div className="experience-gate__ambient" aria-hidden="true" />
      <section className="experience-gate__panel">
        <div className="experience-intro">
          <p className="experience-gate__eyebrow">Interactive mode</p>
          <h1 className="experience-intro__line">Let's get started! Please select your price range.</h1>
          <div className="experience-gate__bar experience-gate__bar--interactive" role="progressbar" aria-label="Preparing interactive experience">
            <span style={{ width: '92%' }} />
          </div>
        </div>
      </section>
    </main>
  );
}

function InteractiveHomeRoute() {
  const [Scene, setScene] = useState<SceneComponent | null>(() => getHomePageSceneComponent());

  useEffect(() => {
    if (Scene) return undefined;
    let cancelled = false;
    preloadHomePageScene().then(module => {
      if (!cancelled) setScene(() => module.HomePageScene);
    });
    return () => {
      cancelled = true;
    };
  }, [Scene]);

  return Scene ? <Scene /> : <InteractiveLoader />;
}

function InteractiveCategoryRoute() {
  const [Scene, setScene] = useState<SceneComponent | null>(() => getCategoryPageSceneComponent());

  useEffect(() => {
    if (Scene) return undefined;
    let cancelled = false;
    preloadCategoryPageScene().then(module => {
      if (!cancelled) setScene(() => module.CategoryPageScene);
    });
    return () => {
      cancelled = true;
    };
  }, [Scene]);

  return Scene ? <Scene /> : <InteractiveLoader />;
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
    document.title = BRAND_PAGE_TITLE;
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <HashRouter>
      <Routes>
        {/* Pre-home loader + experience choice */}
        <Route path="/" element={<ExperienceGate />} />

        {/* Interactive experience — fullscreen Three.js scene, loaded only on demand */}
        <Route path="/interactive" element={
          <MobileInteractiveRedirect><InteractiveHomeRoute /></MobileInteractiveRedirect>
        } />

        {/* Basic experience — catalog layout using the same product data */}
        <Route path="/basic" element={<BasicExperiencePage />} />
        <Route path="/basic/search" element={<BasicExperiencePage />} />
        <Route path="/basic/category/:slug" element={<BasicExperiencePage />} />
        <Route path="/basic/product/:id" element={<BasicProductPage />} />

        {/* All other pages use the standard header/footer layout */}
        <Route path="/search" element={
          <AppLayout><SearchResultsPage /></AppLayout>
        } />
        {/* Category pages — fullscreen Three.js cube scene, loaded only on demand */}
        <Route path="/category/:slug" element={
          <MobileInteractiveRedirect><InteractiveCategoryRoute /></MobileInteractiveRedirect>
        } />
        <Route path="/category/:slug/:subSlug" element={
          <MobileInteractiveRedirect><InteractiveCategoryRoute /></MobileInteractiveRedirect>
        } />
        <Route path="*" element={
          <AppLayout><NotFoundPage /></AppLayout>
        } />
      </Routes>
    </HashRouter>
  );
}
