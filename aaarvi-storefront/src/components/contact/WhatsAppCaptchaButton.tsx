import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { makeCaptchaChallenge } from '@/utils/contact';

type WhatsAppCaptchaButtonProps = {
  captchaSeed: string;
  whatsappHref: string;
  buttonLabel: string;
  verifiedLabel?: string;
  icon?: ReactNode;
  className?: string;
  triggerClassName?: string;
  verifiedClassName?: string;
  onVerified?: () => void;
};

export function WhatsAppCaptchaButton({
  captchaSeed,
  whatsappHref,
  buttonLabel,
  verifiedLabel = 'Open WhatsApp',
  icon,
  className = '',
  triggerClassName = '',
  verifiedClassName = '',
  onVerified,
}: WhatsAppCaptchaButtonProps) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const challenge = useMemo(() => makeCaptchaChallenge(captchaSeed), [captchaSeed]);
  const captchaId = useMemo(
    () => `whatsapp-captcha-${captchaSeed.replace(/[^a-zA-Z0-9_-]/g, '-')}`,
    [captchaSeed],
  );

  function verifyAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Number(answer.trim()) === challenge.total) {
      setVerified(true);
      setError('');
      return;
    }
    setError('Try again');
  }

  useEffect(() => {
    if (!verified) return;

    const popup = window.open(whatsappHref, '_blank', 'noopener,noreferrer');
    if (!popup) return;

    onVerified?.();
    setOpen(false);
    setVerified(false);
    setAnswer('');
  }, [verified, whatsappHref, onVerified]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClassName || undefined}
        style={triggerClassName ? undefined : { width: '100%' }}
      >
        {icon}
        {buttonLabel}
      </button>
    );
  }

  if (verified) {
    return (
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className={verifiedClassName || undefined}
        style={verifiedClassName ? undefined : { width: '100%' }}
      >
        {icon}
        {verifiedLabel}
      </a>
    );
  }

  return (
    <div className={`whatsapp-captcha ${className}`.trim()}>
      <form className="whatsapp-captcha__form" onSubmit={verifyAnswer}>
        <label htmlFor={captchaId} className="whatsapp-captcha__label">
          {challenge.leftOperand} + {challenge.rightOperand}
        </label>
        <input
          id={captchaId}
          className="whatsapp-captcha__input"
          inputMode="numeric"
          value={answer}
          onChange={event => setAnswer(event.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="whatsapp-captcha__verify">Verify</button>
        {error && (
          <span role="alert" className="whatsapp-captcha__error">{error}</span>
        )}
      </form>
    </div>
  );
}
