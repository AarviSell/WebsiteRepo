// src/components/layout/Footer.tsx
import { MessageCircle } from 'lucide-react';
import { WhatsAppCaptchaButton } from '@/components/contact/WhatsAppCaptchaButton';
import { BrandMark } from '@/components/layout/BrandMark';
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
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <BrandMark size="md" />
              </div>
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
