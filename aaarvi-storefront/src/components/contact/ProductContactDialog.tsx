import { createPortal } from 'react-dom';
import { Mail, MessageCircle, X } from 'lucide-react';
import type { Product } from '@/types/product';
import { WhatsAppCaptchaButton } from '@/components/contact/WhatsAppCaptchaButton';

type ProductContactDialogProps = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  mailHref: string;
  whatsappHref: string;
  variant?: 'basic' | 'interactive';
  title?: string;
};

export function ProductContactDialog({
  product,
  open,
  onClose,
  mailHref,
  whatsappHref,
  variant = 'basic',
  title = 'Contact for price',
}: ProductContactDialogProps) {
  if (!open || !product) return null;

  const isInteractive = variant === 'interactive';
  const rootClass = isInteractive ? 'interactive-contact-dialog' : 'basic-contact-dialog';
  const backdropClass = isInteractive ? 'interactive-contact-dialog__backdrop' : 'basic-contact-dialog__backdrop';
  const panelClass = isInteractive ? 'interactive-contact-dialog__panel' : 'basic-contact-dialog__panel';
  const headClass = isInteractive ? 'interactive-contact-dialog__head' : 'basic-contact-dialog__head';
  const closeClass = isInteractive ? 'interactive-contact-dialog__close' : 'basic-contact-dialog__close';
  const actionsClass = isInteractive ? 'interactive-contact-dialog__actions' : 'basic-contact-dialog__actions';
  const emailClass = isInteractive
    ? 'interactive-contact-dialog__email'
    : 'basic-button basic-button--primary';

  return createPortal(
    <div className={rootClass} role="dialog" aria-modal="true" aria-label={`Contact options for ${product.name}`}>
      <button type="button" className={backdropClass} aria-label="Close contact options" onClick={onClose} />
      <div className={panelClass}>
        <div className={headClass}>
          <div>
            <h3>{title}</h3>
            <p>{product.name}</p>
          </div>
          <button type="button" className={closeClass} aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className={actionsClass}>
          <a href={mailHref} className={emailClass} onClick={onClose}>
            <Mail size={16} aria-hidden="true" />
            Email
          </a>
          <WhatsAppCaptchaButton
            captchaSeed={product.id}
            whatsappHref={whatsappHref}
            buttonLabel="WhatsApp"
            verifiedLabel="Open WhatsApp"
            onVerified={onClose}
            className={isInteractive ? 'whatsapp-captcha--interactive' : undefined}
            triggerClassName={
              isInteractive
                ? 'whatsapp-captcha--interactive-trigger'
                : 'basic-button basic-button--secondary basic-button--whatsapp'
            }
            verifiedClassName={
              isInteractive
                ? 'whatsapp-captcha--interactive-verified'
                : 'basic-button basic-button--secondary basic-button--whatsapp'
            }
            icon={<MessageCircle size={16} aria-hidden="true" />}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
