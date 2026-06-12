import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, MonitorPlay, Sparkles } from 'lucide-react';
import { useIsMobileViewport } from '@/hooks/useViewport';
import { preloadInteractiveExperience } from '@/pages/interactivePreload';
import { BRAND_HEADER_TEXT, BRAND_NAME } from '@/constants/brand';
import logoSrc from '@/assets/logo.png';

type GatePhase = 'choice' | 'interactive-perfect' | 'interactive-start' | 'interactive-reveal';

const INTERACTIVE_PERFECT_MS = 1200;
const INTERACTIVE_START_MIN_MS = 2600;
const INTERACTIVE_COMPLETE_MS = 560;
const INTERACTIVE_REVEAL_MS = 720;
const INTERACTIVE_PROGRESS_TICK_MS = 180;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });
}

export function ExperienceGate() {
  const navigate = useNavigate();
  const isMobile = useIsMobileViewport();
  const [phase, setPhase] = useState<GatePhase>('choice');
  const [progress, setProgress] = useState(0);
  const [isInteractiveStarting, setIsInteractiveStarting] = useState(false);
  const progressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile) return;
    navigate('/basic', { replace: true });
  }, [isMobile, navigate]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current !== null) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  if (isMobile) return null;

  async function chooseInteractive() {
    if (isInteractiveStarting) return;

    setIsInteractiveStarting(true);
    setPhase('interactive-perfect');
    setProgress(8);

    progressTimerRef.current = window.setInterval(() => {
      setProgress(value => Math.min(value + 4, 92));
    }, INTERACTIVE_PROGRESS_TICK_MS);

    const interactiveLoadPromise = preloadInteractiveExperience().catch(() => undefined);

    await delay(INTERACTIVE_PERFECT_MS);
    setPhase('interactive-start');
    setProgress(value => Math.max(value, 42));

    await Promise.all([interactiveLoadPromise, delay(INTERACTIVE_START_MIN_MS)]);

    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    setProgress(100);
    await delay(INTERACTIVE_COMPLETE_MS);
    setPhase('interactive-reveal');
    await delay(INTERACTIVE_REVEAL_MS);
    navigate('/interactive');
  }

  return (
    <main className={`experience-gate experience-gate--${phase}`} aria-live="polite">
      <div className="experience-gate__ambient" aria-hidden="true" />
      <section className="experience-gate__panel">
        <div className="experience-gate__brand" aria-label={BRAND_NAME}>
          <img src={logoSrc} alt={`${BRAND_NAME} logo`} />
          <span>{BRAND_HEADER_TEXT}</span>
        </div>

        {phase === 'choice' && (
          <div className="experience-choice">
            <p className="experience-gate__eyebrow">Choose an experience</p>
            <h1>How would you like to browse?</h1>
            <div className="experience-choice__actions">
              <button type="button" className="experience-choice__button" onClick={() => navigate('/basic')}>
                <Box size={20} aria-hidden="true" />
                <span>Normal</span>
              </button>
              <button type="button" className="experience-choice__button experience-choice__button--primary" onClick={chooseInteractive} disabled={isInteractiveStarting}>
                <MonitorPlay size={20} aria-hidden="true" />
                <span>Interactive</span>
              </button>
            </div>
          </div>
        )}

        {(phase === 'interactive-perfect' || phase === 'interactive-start' || phase === 'interactive-reveal') && (
          <div className="experience-intro">
            <Sparkles size={28} aria-hidden="true" />
            {phase === 'interactive-perfect' && <h1 key="perfect" className="experience-intro__line">Perfect!</h1>}
            {(phase === 'interactive-start' || phase === 'interactive-reveal') && (
              <h1 key="start" className="experience-intro__line">Let's get started! Please select your price range.</h1>
            )}
            <div className="experience-gate__bar experience-gate__bar--interactive" role="progressbar" aria-label="Preparing interactive experience" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}