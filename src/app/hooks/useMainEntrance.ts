import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  typedTitle: React.ReactNode;
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
  const [typedTitle, setTypedTitle] = useState<React.ReactNode>('');
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
      // Footer/burger appear while title is still scrambling
      const timings = skipMode
        ? { frame: 300, title: 800, footer: 1500, burger: 2000, popup: 12000 }
        : { frame: 800, title: 1500, footer: 3500, burger: 5000, popup: 18000 + Math.random() * 4000 };

      // Step 1: Show frame first
      const frameTimer = setTimeout(() => {
        setShowFrame(true);
      }, timings.frame);

      // Step 2: Start title scramble after frame is visible
      let scrambleTimeout: ReturnType<typeof setTimeout> | null = null;
      const titleTimer = setTimeout(() => {
        setShowTitlePrompt(true);

        // ── Per-character slot-machine resolve with dramatic variation ──
        // Each character spins like a slot machine with its own personality:
        // different chaos speeds, resolve durations, and a dramatic freeze before lock.
        // Characters appear one-by-one from left (typing effect) before resolving.
        const len = titleText.length;

        // Timing parameters
        const initialChaos = skipMode ? 250 : 800;            // chaos phase before any resolves
        const baseStagger = skipMode ? 120 : 380;             // base gap between char resolve starts
        const baseResolveDuration = skipMode ? 600 : 2000;    // base resolve window (randomized per-char)
        const startInterval = skipMode ? 100 : 50;            // tick speed at start of resolve (fast)
        const peakInterval = skipMode ? 25 : 50;              // tick speed at peak
        const endInterval = skipMode ? 160 : 350;             // tick speed at end of resolve (settling)
        const tickRate = 25;                                   // render loop interval (ms)

        // Per-character appearance time (near-simultaneous flash-in)
        const appearStagger = skipMode ? 15 : 30;             // ms between each char appearing
        const charAppearTime = new Array(len).fill(0);
        for (let i = 0; i < len; i++) {
          charAppearTime[i] = i * appearStagger;
        }

        // Sequential resolve order (left-to-right) — no shuffle
        const resolveOrder = Array.from({ length: len }, (_, i) => i);

        // Per-character resolve duration: ±50% random variation
        // Some chars settle fast, others linger
        const charResolveDuration = new Array(len).fill(0);
        for (let i = 0; i < len; i++) {
          charResolveDuration[i] = baseResolveDuration * (0.5 + Math.random() * 1.0);
        }

        // Per-character chaos speed: wider range — some flicker fast (20ms), others rotate lazily (140ms)
        const charChaosInterval = new Array(len).fill(0);
        for (let i = 0; i < len; i++) {
          charChaosInterval[i] = 20 + Math.random() * 120;
        }

        // Stagger with jitter: accumulate with ±60ms random gaps (±15ms in skip)
        const staggerJitter = skipMode ? 15 : 60;
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
        const charOpacity = new Array(len).fill(0);            // current opacity per char

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
          const spans: React.ReactElement[] = [];
          let allLocked = true;

          for (let i = 0; i < len; i++) {
            const rStart = charResolveStart[i];
            const rEnd = rStart + charResolveDuration[i];

            // Character hasn't appeared yet — skip entirely so cursor tracks typing front
            if (elapsed < charAppearTime[i]) {
              allLocked = false;
              charOpacity[i] = 0;
              continue;
            }

            if (elapsed >= rEnd) {
              // ── Locked — show final character ──
              charOpacity[i] = 1;
              spans.push(
                React.createElement('span', {
                  key: i,
                  style: { opacity: 1 },
                }, titleText[i])
              );
            } else if (elapsed >= rStart) {
              // ── Seeking phase — slot machine spin with asymmetric easing ──
              allLocked = false;
              const localElapsed = elapsed - rStart;
              const t = localElapsed / charResolveDuration[i]; // 0 → 1

              if (t > 0.88) {
                // Wind-down — exponential deceleration like a machine losing power
                const windT = (t - 0.88) / 0.12;          // 0 → 1
                const windBase = skipMode ? 60 : 120;
                const windRange = skipMode ? 300 : 600;
                const interval = windBase + windT * windT * windRange; // quadratic ramp

                if (elapsed - charLastChange[i] >= interval) {
                  charLastChange[i] = elapsed;
                  charChangeCount[i]++;
                  charCurrentRandom[i] = getNearMissChar(titleText[i]);
                }
                // Higher base opacity in wind-down (settling)
                charOpacity[i] = 0.85 + Math.random() * 0.15;
              } else if (t > 0.75) {
                // Near-miss zone — pick from nearby letters, slowing down
                const sinVal = Math.sin(Math.PI * t);
                const interval = endInterval + (peakInterval - endInterval) * sinVal;

                if (elapsed - charLastChange[i] >= interval) {
                  charLastChange[i] = elapsed;
                  charChangeCount[i]++;
                  charCurrentRandom[i] = getNearMissChar(titleText[i]);
                }
                charOpacity[i] = 0.8 + Math.random() * 0.2;
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
                // Flicker opacity during main spin
                charOpacity[i] = 0.7 + Math.random() * 0.3;
              }

              spans.push(
                React.createElement('span', {
                  key: i,
                  style: { opacity: charOpacity[i] },
                }, charCurrentRandom[i])
              );
            } else {
              // ── Waiting phase — per-char chaos speed (some fast, some lazy) ──
              allLocked = false;
              if (elapsed - charLastChange[i] >= charChaosInterval[i]) {
                charLastChange[i] = elapsed;
                charCurrentRandom[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
              }
              // Flicker opacity during chaos
              charOpacity[i] = 0.7 + Math.random() * 0.3;

              spans.push(
                React.createElement('span', {
                  key: i,
                  style: { opacity: charOpacity[i] },
                }, charCurrentRandom[i])
              );
            }
          }
          setTypedTitle(spans);

          if (allLocked || elapsed >= totalDuration) {
            setTypedTitle(titleText);
            setShowTitleCursor(true);
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
