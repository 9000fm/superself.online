import { useState, useEffect, useCallback, useRef } from 'react';
import { Phase, Language } from '../types';
import { SCRAMBLE_CHARS } from '../constants';

interface UseMainEntranceProps {
  phase: Phase;
  language: Language;
  skipMode: boolean;
  replayTrigger: number;
  onSkipModeComplete: () => void;
  onShowWelcomePopup: () => void;
}

interface UseMainEntranceReturn {
  showFrame: boolean;
  showTitlePrompt: boolean;
  typedTitle: string;
  showTitleCursor: boolean;
  showFooter: boolean;
  burgerVisible: boolean;
  handleReplayEntrance: () => void;
  resetEntranceState: () => void;
}

export function useMainEntrance({
  phase,
  language,
  skipMode,
  replayTrigger,
  onSkipModeComplete,
  onShowWelcomePopup,
}: UseMainEntranceProps): UseMainEntranceReturn {
  const scrambleChars = language === 'JP' ? SCRAMBLE_CHARS.japanese : SCRAMBLE_CHARS.base;

  const [showFrame, setShowFrame] = useState(false);
  const [showTitlePrompt, setShowTitlePrompt] = useState(false);
  const [typedTitle, setTypedTitle] = useState('');
  const [showTitleCursor, setShowTitleCursor] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [burgerVisible, setBurgerVisible] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  const resetEntranceState = useCallback(() => {
    setShowFrame(false);
    setShowTitlePrompt(false);
    setTypedTitle('');
    setShowTitleCursor(false);
    setShowFooter(false);
    setBurgerVisible(false);
  }, []);

  const handleReplayEntrance = useCallback(() => {
    setIsReplaying(true);
    resetEntranceState();

    // Wait briefly for elements to hide, then restart entrance
    setTimeout(() => {
      setIsReplaying(false);
    }, 150);
  }, [resetEntranceState]);

  // Main content entrance sequence
  useEffect(() => {
    if (phase === 'main') {
      const titleText = 'superself';

      // Timings depend on skip mode
      // Footer/burger appear after the scramble finishes (~5.5s after title start)
      const timings = skipMode
        ? { frame: 300, title: 800, footer: 1500, burger: 2000, popup: 12000 }
        : { frame: 800, title: 1500, footer: 7500, burger: 8000, popup: 18000 + Math.random() * 4000 };

      // Step 1: Show frame first
      const frameTimer = setTimeout(() => {
        setShowFrame(true);
      }, timings.frame);

      // Step 2: Start title scramble after frame is visible
      let scrambleTimeout: ReturnType<typeof setTimeout> | null = null;
      const titleTimer = setTimeout(() => {
        setShowTitlePrompt(true);
        setShowTitleCursor(true);

        // ── Per-character slot-machine resolve with dramatic variation ──
        // Each character spins like a slot machine with its own personality:
        // different chaos speeds, resolve durations, and a dramatic freeze before lock.
        const len = titleText.length;

        // Timing parameters
        const initialChaos = skipMode ? 250 : 1000;           // all chars scramble together before any resolves
        const baseStagger = skipMode ? 80 : 300;              // base gap between char resolve starts
        const baseResolveDuration = skipMode ? 500 : 1600;    // base resolve window (randomized per-char)
        const startInterval = skipMode ? 100 : 150;           // tick speed at start of resolve (slow)
        const peakInterval = skipMode ? 20 : 25;              // tick speed at peak (fastest)
        const endInterval = skipMode ? 140 : 250;             // tick speed at end of resolve (slower — settling)
        const tickRate = 25;                                   // render loop interval (ms)

        // Randomize resolve order: shuffle indices so chars don't resolve left-to-right
        const resolveOrder = Array.from({ length: len }, (_, i) => i);
        for (let i = resolveOrder.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [resolveOrder[i], resolveOrder[j]] = [resolveOrder[j], resolveOrder[i]];
        }

        // Per-character resolve duration: ±40% random variation
        // Some chars settle fast (960ms), others linger (2240ms)
        const charResolveDuration = new Array(len).fill(0);
        for (let i = 0; i < len; i++) {
          charResolveDuration[i] = baseResolveDuration * (0.6 + Math.random() * 0.8);
        }

        // Per-character chaos speed: some flicker fast (30ms), others rotate lazily (120ms)
        const charChaosInterval = new Array(len).fill(0);
        for (let i = 0; i < len; i++) {
          charChaosInterval[i] = 30 + Math.random() * 90;
        }

        // Stagger with jitter: accumulate with ±100ms random gaps (±30ms in skip)
        const staggerJitter = skipMode ? 30 : 100;
        const charResolveStart = new Array(len).fill(0);
        let accum = initialChaos;
        for (let rank = 0; rank < len; rank++) {
          charResolveStart[resolveOrder[rank]] = accum;
          accum += baseStagger + (Math.random() * staggerJitter * 2 - staggerJitter);
        }

        // Total duration: latest possible resolve end
        let maxEnd = 0;
        for (let i = 0; i < len; i++) {
          const end = charResolveStart[i] + charResolveDuration[i];
          if (end > maxEnd) maxEnd = end;
        }
        const totalDuration = maxEnd;
        const startTime = performance.now();

        // Per-character state
        const charLastChange = new Array(len).fill(0);        // last time this char changed its random display
        const charCurrentRandom = new Array(len).fill('');     // current displayed random char
        const charChangeCount = new Array(len).fill(0);        // how many times this char has changed during resolve

        // Initialize with random chars
        for (let i = 0; i < len; i++) {
          charCurrentRandom[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        }

        // Near-miss charset: letters close to the target in the alphabet
        function getNearMissChar(targetChar: string): string {
          const lower = 'abcdefghijklmnopqrstuvwxyz';
          const idx = lower.indexOf(targetChar.toLowerCase());
          if (idx === -1) return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          const offset = Math.floor(Math.random() * 7) - 3; // ±3 positions
          const nearIdx = ((idx + offset) % 26 + 26) % 26;
          return lower[nearIdx];
        }

        function tick() {
          const elapsed = performance.now() - startTime;
          let display = '';
          let allLocked = true;

          for (let i = 0; i < len; i++) {
            const rStart = charResolveStart[i];
            const rEnd = rStart + charResolveDuration[i];

            if (elapsed >= rEnd) {
              // ── Locked — show final character ──
              display += titleText[i];
            } else if (elapsed >= rStart) {
              // ── Seeking phase — slot machine spin with asymmetric easing ──
              allLocked = false;
              const localElapsed = elapsed - rStart;
              const t = localElapsed / charResolveDuration[i]; // 0 → 1

              // Dramatic pause: freeze on near-miss in the final 8% before snapping to lock
              if (t > 0.92) {
                // Frozen — hold current near-miss char, building tension before snap
                display += charCurrentRandom[i];
              } else if (t > 0.75) {
                // Near-miss zone — pick from nearby letters, slowing down
                const sinVal = Math.sin(Math.PI * t);
                const interval = endInterval + (peakInterval - endInterval) * sinVal;

                if (elapsed - charLastChange[i] >= interval) {
                  charLastChange[i] = elapsed;
                  charChangeCount[i]++;
                  charCurrentRandom[i] = getNearMissChar(titleText[i]);
                }
                display += charCurrentRandom[i];
              } else {
                // Main spin — asymmetric sinusoidal speed curve
                const sinVal = Math.sin(Math.PI * t);
                let interval: number;
                if (t < 0.5) {
                  interval = startInterval + (peakInterval - startInterval) * sinVal;
                } else {
                  interval = endInterval + (peakInterval - endInterval) * sinVal;
                }

                if (elapsed - charLastChange[i] >= interval) {
                  charLastChange[i] = elapsed;
                  charChangeCount[i]++;
                  charCurrentRandom[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
                }
                display += charCurrentRandom[i];
              }
            } else {
              // ── Waiting phase — per-char chaos speed (some fast, some lazy) ──
              allLocked = false;
              if (elapsed - charLastChange[i] >= charChaosInterval[i]) {
                charLastChange[i] = elapsed;
                charCurrentRandom[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
              }
              display += charCurrentRandom[i];
            }
          }
          setTypedTitle(display);

          if (allLocked || elapsed >= totalDuration) {
            setTypedTitle(titleText);
            if (skipMode) onSkipModeComplete();
          } else {
            scrambleTimeout = setTimeout(tick, tickRate);
          }
        }
        // Kick off
        scrambleTimeout = setTimeout(tick, tickRate);
      }, timings.title);

      // Step 3: Show ASCII background
      const bgTimer = setTimeout(() => {
        setShowFooter(true);
      }, timings.footer);

      // Step 4: Show burger (icons and language)
      const burgerTimer = setTimeout(() => {
        setBurgerVisible(true);
      }, timings.burger);

      // Step 5: Show welcome popup
      const welcomeTimer = setTimeout(() => {
        onShowWelcomePopup();
      }, timings.popup);

      return () => {
        if (scrambleTimeout) clearTimeout(scrambleTimeout);
        clearTimeout(frameTimer);
        clearTimeout(titleTimer);
        clearTimeout(bgTimer);
        clearTimeout(burgerTimer);
        clearTimeout(welcomeTimer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, replayTrigger]);

  return {
    showFrame,
    showTitlePrompt,
    typedTitle,
    showTitleCursor,
    showFooter,
    burgerVisible,
    handleReplayEntrance,
    resetEntranceState,
  };
}
