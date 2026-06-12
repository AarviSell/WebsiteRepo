import { Link } from 'react-router-dom';
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/constants/brand';

type BrandLogoSize = 'sm' | 'md' | 'lg';

interface BrandMarkProps {
  href?: string;
  className?: string;
  ariaLabel?: string;
  size?: BrandLogoSize;
}

const LOGO_SIZE_CLASS: Record<BrandLogoSize, string> = {
  sm: 'brand-logo__image--sm',
  md: 'brand-logo__image--md',
  lg: 'brand-logo__image--lg',
};

export function BrandMark({
  href,
  className = 'basic-logo',
  ariaLabel,
  size = 'md',
}: BrandMarkProps) {
  const image = (
    <img
      src={BRAND_LOGO_SRC}
      alt={`${BRAND_NAME} logo`}
      className={`brand-logo__image ${LOGO_SIZE_CLASS[size]}`}
    />
  );

  if (href) {
    return (
      <Link to={href} className={className} aria-label={ariaLabel ?? `${BRAND_NAME} home`}>
        {image}
      </Link>
    );
  }

  return <span className={className}>{image}</span>;
}
