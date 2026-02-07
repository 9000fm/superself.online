import { useState, useEffect, useCallback, useRef } from 'react';
import { Phase, Language } from '../types';
import { translations, getDotChar } from '../translations';

interface UseShutdownSequenceProps {
  phase: Phase;
  language: Language;
  onPhaseChange: (phase: Phase) => void;
  onRebootComplete: () => void;
}

interface UseShutdownSequenceReturn {
  shutdownText: string;
  shutdownDots: string;
  errorCode: string;
  fadeFromBlack: boolean;
  startShutdown: () => void;
  handleReboot: () => void;
}

export function useShutdownSequence({
  phase,
  language,
  onPhaseChange,
  onRebootComplete,
}: UseShutdownSequenceProps): UseShutdownSequenceReturn {
  const t = translations[language];
  const dotChar = getDotChar(language);

  const [shutdownText, setShutdownText] = useState('');
  const [shutdownDots, setShutdownDots] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [fadeFromBlack, setFadeFromBlack] = useState(false);
  const rebootTimers = useRef<NodeJS.Timeout[]>([]);

  const startShutdown = useCallback(() => {
    setShutdownText('');
    setShutdownDots('');
    onPhaseChange('shutdown');
  }, [onPhaseChange]);

  const handleReboot = useCallback(() => {
    // Clear any existing reboot timers
    rebootTimers.current.forEach(t => clearTimeout(t));
    rebootTimers.current = [];

    // First go to black screen (abrupt, no fade)
    setFadeFromBlack(false);
    onPhaseChange('off');

    // After 4 seconds of black, fade to blue
    const t1 = setTimeout(() => {
      // Enable fade transition and go to pause phase (just blue, no content)
      setFadeFromBlack(true);
      onPhaseChange('pause');

      // After fade completes + pause on blue, trigger reboot
      const t2 = setTimeout(() => {
        setFadeFromBlack(false);
        onRebootComplete();
      }, 1500);
      rebootTimers.current.push(t2);
    }, 4000);
    rebootTimers.current.push(t1);
  }, [onPhaseChange, onRebootComplete]);

  // Clean up reboot timers on unmount
  useEffect(() => {
    return () => {
      rebootTimers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Shutdown typing effect
  useEffect(() => {
    if (phase !== 'shutdown') return;

    const shutdownBaseText = t.shuttingDown;
    const d = dotChar;
    let charIndex = 0;
    const timers: NodeJS.Timeout[] = [];
    const intervals: NodeJS.Timeout[] = [];

    // Wait a moment before starting to type
    const startDelay = setTimeout(() => {
      // Type out each character
      const typeInterval = setInterval(() => {
        if (charIndex < shutdownBaseText.length) {
          setShutdownText(shutdownBaseText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);

          // After typing complete, animate dots
          let dotCount = 0;
          let dotCycle = 0;
          const dotsInterval = setInterval(() => {
            dotCount++;
            if (dotCount > 3) {
              dotCount = 1;
              dotCycle++;
            }
            setShutdownDots(d.repeat(dotCount));

            // After 2 full cycles, go to error screen
            if (dotCycle >= 2 && dotCount === 3) {
              clearInterval(dotsInterval);
              timers.push(
                setTimeout(() => {
                  onPhaseChange('error');
                }, 400)
              );
            }
          }, 350);
          intervals.push(dotsInterval);
        }
      }, 60);
      intervals.push(typeInterval);
    }, 600);
    timers.push(startDelay);

    return () => {
      timers.forEach((t) => clearTimeout(t));
      intervals.forEach((i) => clearInterval(i));
    };
  }, [phase, t.shuttingDown, dotChar, onPhaseChange]);

  // BSOD error screen - generate random error code and listen for reboot
  useEffect(() => {
    if (phase !== 'error') return;

    // Generate random hex error code
    const randomHex = () =>
      Math.floor(Math.random() * 0xffffffff)
        .toString(16)
        .toUpperCase()
        .padStart(8, '0');
    setErrorCode(`0028:${randomHex().slice(0, 8)} in VXD VMM(01) + ${randomHex().slice(0, 8)}`);

    const handleRebootTrigger = () => {
      handleReboot();
    };

    // Listen for any key or click/tap
    window.addEventListener('keydown', handleRebootTrigger);
    window.addEventListener('click', handleRebootTrigger);
    window.addEventListener('touchstart', handleRebootTrigger);

    return () => {
      window.removeEventListener('keydown', handleRebootTrigger);
      window.removeEventListener('click', handleRebootTrigger);
      window.removeEventListener('touchstart', handleRebootTrigger);
    };
  }, [phase, handleReboot]);

  return {
    shutdownText,
    shutdownDots,
    errorCode,
    fadeFromBlack,
    startShutdown,
    handleReboot,
  };
}
