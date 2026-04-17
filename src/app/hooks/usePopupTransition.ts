import { useState, useRef, useCallback } from 'react';

interface PopupBox { x: number; y: number; w: number; h: number }

interface TransitionState {
  sectionId: string;
  originRect: DOMRect;
  targetBox?: PopupBox; // popup's destination rect (for off-center homes)
  phase: 'measuring' | 'animating' | 'done' | 'closing';
}

interface UsePopupTransitionReturn {
  triggerOpen: (navRect: DOMRect, sectionId: string, targetBox?: PopupBox) => void;
  triggerClose: (sectionId: string, currentBox?: PopupBox) => void;
  isAnimating: string | null;
  isClosing: string | null;
  getPopupStyle: (sectionId: string) => React.CSSProperties;
  getContentStyle: (sectionId: string) => React.CSSProperties;
}

const OPEN_DURATION = 440;
const CLOSE_DURATION = 330;
const STEPS = 11;

export function usePopupTransition(): UsePopupTransitionReturn {
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Store last origin rect + target box per section for close animation
  const originsRef = useRef<Record<string, DOMRect>>({});
  const targetsRef = useRef<Record<string, PopupBox | undefined>>({});

  const triggerOpen = useCallback((navRect: DOMRect, sectionId: string, targetBox?: PopupBox) => {
    if (window.innerWidth < 768) { setTransition(null); return; }

    originsRef.current[sectionId] = navRect;
    targetsRef.current[sectionId] = targetBox;
    setTransition({ sectionId, originRect: navRect, targetBox, phase: 'measuring' });

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setTransition(prev => prev ? { ...prev, phase: 'animating' } : null);
      });
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTransition(prev => prev ? { ...prev, phase: 'done' } : null);
      setTimeout(() => setTransition(null), 50);
    }, OPEN_DURATION);
  }, []);

  const triggerClose = useCallback((sectionId: string, currentBox?: PopupBox) => {
    if (window.innerWidth < 768) return;
    const rect = originsRef.current[sectionId];
    if (!rect) return;
    // Use currentBox (popup's actual position after drag) if provided,
    // else fall back to the stored target from open time.
    const targetBox = currentBox || targetsRef.current[sectionId];

    setTransition({ sectionId, originRect: rect, targetBox, phase: 'closing' });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTransition(null);
    }, CLOSE_DURATION);
  }, []);

  const getPopupStyle = useCallback((sectionId: string): React.CSSProperties => {
    if (!transition || transition.sectionId !== sectionId) return {};
    const { originRect, targetBox, phase } = transition;

    // Popup's visual center at its resting position.
    // If targetBox provided (home position), use its center. Else fallback to viewport center.
    const popupCx = targetBox ? targetBox.x + targetBox.w / 2 : window.innerWidth / 2;
    const popupCy = targetBox ? targetBox.y + targetBox.h / 2 : window.innerHeight / 2;

    if (phase === 'measuring') {
      const navCx = originRect.left + originRect.width / 2;
      const navCy = originRect.top + originRect.height / 2;
      const dx = navCx - popupCx;
      const dy = navCy - popupCy;
      return {
        transform: `translate(${dx}px, ${dy}px) scale(0.05, 0.02)`,
        opacity: 1,
        transition: 'none',
        transformOrigin: 'center center',
        zIndex: 200,
      };
    }

    if (phase === 'animating') {
      return {
        transform: 'translate(0, 0) scale(1, 1)',
        opacity: 1,
        transition: `transform ${OPEN_DURATION}ms steps(${STEPS}, end), opacity ${OPEN_DURATION}ms steps(${STEPS}, end)`,
        transformOrigin: 'center center',
        zIndex: 200,
      };
    }

    if (phase === 'closing') {
      const navCx = originRect.left + originRect.width / 2;
      const navCy = originRect.top + originRect.height / 2;
      const dx = navCx - popupCx;
      const dy = navCy - popupCy;
      return {
        transform: `translate(${dx}px, ${dy}px) scale(0.05, 0.02)`,
        opacity: 0,
        transition: `transform ${CLOSE_DURATION}ms steps(${STEPS}, end), opacity ${CLOSE_DURATION}ms steps(${STEPS}, end)`,
        transformOrigin: 'center center',
        zIndex: 200,
        pointerEvents: 'none',
      };
    }

    return {};
  }, [transition]);

  const getContentStyle = useCallback((sectionId: string): React.CSSProperties => {
    if (!transition || transition.sectionId !== sectionId) return {};
    const { phase } = transition;

    if (phase === 'measuring') return { opacity: 0, transition: 'none' };
    if (phase === 'animating') {
      return { opacity: 1, transition: `opacity ${OPEN_DURATION * 0.4}ms ease ${OPEN_DURATION * 0.5}ms` };
    }
    if (phase === 'closing') {
      return { opacity: 0, transition: `opacity ${CLOSE_DURATION * 0.3}ms ease` };
    }
    return {};
  }, [transition]);

  return {
    triggerOpen,
    triggerClose,
    isAnimating: transition && (transition.phase === 'measuring' || transition.phase === 'animating') ? transition.sectionId : null,
    isClosing: transition?.phase === 'closing' ? transition.sectionId : null,
    getPopupStyle,
    getContentStyle,
  };
}
