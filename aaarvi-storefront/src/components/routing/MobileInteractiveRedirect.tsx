import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIsMobileViewport } from '@/hooks/useViewport';

function getBasicRedirectPath(pathname: string): string | null {
  if (pathname === '/interactive') return '/basic';

  const categoryMatch = pathname.match(/^\/category\/([^/]+)/);
  if (categoryMatch) return `/basic/category/${categoryMatch[1]}`;

  return null;
}

export function MobileInteractiveRedirect({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobileViewport();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = getBasicRedirectPath(location.pathname);

  useEffect(() => {
    if (!isMobile || !redirectPath) return;
    navigate(redirectPath, { replace: true });
  }, [isMobile, navigate, redirectPath]);

  if (isMobile && redirectPath) return null;

  return <>{children}</>;
}
