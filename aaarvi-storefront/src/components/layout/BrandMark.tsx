import { Link } from 'react-router-dom';
import { BRAND_HEADER_TEXT, BRAND_NAME } from '@/constants/brand';
import logoSrc from '@/assets/logo.png';

interface BrandMarkProps {
  href?: string;
  className?: string;
  ariaLabel?: string;
}

export function BrandMark({ href, className = 'basic-logo', ariaLabel }: BrandMarkProps) {
  const content = (
    <>
      <img src={logoSrc} alt={`${BRAND_NAME} logo`} />
      <span>{BRAND_HEADER_TEXT}</span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className} aria-label={ariaLabel ?? `${BRAND_NAME} home`}>
        {content}
      </Link>
    );
  }

  return <span className={className}>{content}</span>;
}
