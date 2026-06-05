// src/components/layout/Footer.tsx
import { MessageCircle } from 'lucide-react';
import { WhatsAppCaptchaButton } from '@/components/contact/WhatsAppCaptchaButton';
import { BRAND_NAME } from '@/constants/brand';
import {
  CONTACT_EMAIL,
  buildWhatsAppHref,
  getWhatsAppNumber,
} from '@/utils/contact';

export function Footer() {
  const whatsappHref = buildWhatsAppHref(
    getWhatsAppNumber(),
    `Hi ${BRAND_NAME}, I would like to inquire about your products. Please share pricing and availability.`,
  );

  return (
    <footer
      style={{
        marginTop: 'auto',
        padding: 'var(--space-12) var(--space-4) var(--space-6)',
        background: 'linear-gradient(180deg, rgba(13, 4, 20, 0), rgba(13, 4, 20, 0.88) 26%, rgba(13, 4, 20, 0.98))',
      }}
    >
      <div style={{ maxWidth: 'var(--content-wide)', margin: '0 auto' }}>
        <div className="glass-panel" style={{ borderRadius: '2rem', padding: 'var(--space-8)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
              gap: 'var(--space-8)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: 'var(--space-3)' }}>
                <svg width="28" height="28" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                  <circle cx="17" cy="17" r="16" stroke="url(#ftLg)" strokeWidth="1.5" />
                  <path d="M17 7 L26 25 H8 Z" fill="url(#ftLg2)" opacity="0.92" />
                  <path d="M12 19 H22" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="ftLg" x1="0" y1="0" x2="34" y2="34">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#f0b429" />
                    </linearGradient>
                    <linearGradient id="ftLg2" x1="17" y1="7" x2="17" y2="25">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#f0b429" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                </svg>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #e9d5ff, #fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {BRAND_NAME}
                </span>
              </span>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.8, maxWidth: 320, margin: 0 }}>
                Discover and shop curated products from top Indian sources.
              </p>
            </div>

            <div>
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 var(--space-3)' }}>
                Contact
              </p>
              <div className="contact-stack">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  style={{ display: 'inline-flex', alignItems: 'center', minHeight: 40, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textDecoration: 'none' }}
                >
                  {CONTACT_EMAIL}
                </a>
                <WhatsAppCaptchaButton
                  captchaSeed="footer"
                  whatsappHref={whatsappHref}
                  buttonLabel="WhatsApp"
                  verifiedLabel="Open WhatsApp"
                  triggerClassName="basic-button basic-button--secondary basic-button--whatsapp"
                  verifiedClassName="basic-button basic-button--secondary basic-button--whatsapp"
                  icon={<MessageCircle size={16} aria-hidden="true" />}
                />
              </div>
              <p style={{ margin: 'var(--space-4) 0 0', color: 'var(--color-text-faint)', fontSize: 'var(--text-xs)', lineHeight: 1.8 }}>
                Ask for pricing, custom sourcing, or collection-specific recommendations.
              </p>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--space-5)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
            }}
          >
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', margin: 0 }}>
              © {new Date().getFullYear()} {BRAND_NAME}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', margin: 0 }}>
              Prices & availability subject to change.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
