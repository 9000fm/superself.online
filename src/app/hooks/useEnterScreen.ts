import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Phase } from '../types';
import { SCRAMBLE_CHARS, ENTER_TRANSLATIONS, ENTER_TIMING, ENTER_FIXED_COUNT } from '../constants';

interface UseEnterScreenProps {
  phase: Phase;
  onEnter: () => void;
}

interface UseEnterScreenReturn {
  displayText: React.ReactNode;
  handleEnter: () => void;
}

/**
 * Per-character slot-machine resolve — chars appear one-by-one (typing effect),
 * each spinning independently before locking. Same approach as the "superself" title.
 */
function animateWord(
  targetWord: string,
  scrambleChars: string,
  onFrame: (node: React.ReactNode) => void,
  onComplete: () => void,
): () => void {
  const len = targetWord.length;
  if (len === 0) { onComplete(); return () => {}; }

  // Typing stagger — each char appears with dramatic tension between them
  const baseCharDelay = 280;     // ms base between each char appearing
  const baseChaos = 900;         // ms base spinning per char before it locks
  const tickRate = 25;           // render loop interval

  // Per-character state
  const charVisible = new Array(len).fill(false);
  const charLocked = new Array(len).fill(false);
  const charCurrent = new Array(len).fill('');
  const charLastChange = new Array(len).fill(0);

  // Vary timing per character — some chars take longer to appear and resolve
  const charAppearAt = new Array(len).fill(0);
  const charLockAt = new Array(len).fill(0);
  let accumDelay = 0;
  for (let i = 0; i < len; i++) {
    // Jitter on delay: ±40% variation
    const delayJitter = baseCharDelay * (0.6 + Math.random() * 0.8);
    accumDelay += i === 0 ? 0 : delayJitter;
    charAppearAt[i] = accumDelay;
    // Jitter on chaos duration: ±50% variation — some chars spin longer
    const chaosJitter = baseChaos * (0.5 + Math.random() * 1.0);
    charLockAt[i] = charAppearAt[i] + chaosJitter;
  }

  const startTime = performance.now();
  let cancelled = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  function tick() {
    if (cancelled) return;
    const elapsed = performance.now() - startTime;
    const spans: React.ReactElement[] = [];
    let allDone = true;

    for (let i = 0; i < len; i++) {
      // Not visible yet — don't render
      if (elapsed < charAppearAt[i]) {
        allDone = false;
        continue;
      }

      charVisible[i] = true;

      if (elapsed >= charLockAt[i]) {
        // Locked — show final character
        charLocked[i] = true;
        spans.push(
          React.createElement('span', { key: i, style: { opacity: 1 } }, targetWord[i])
        );
      } else {
        // Spinning — show random chars with organic timing
        allDone = false;
        const chaosDuration = charLockAt[i] - charAppearAt[i];
        const localT = (elapsed - charAppearAt[i]) / chaosDuration; // 0→1

        // Speed curve: fast at start, slows near lock (settling effect)
        let interval: number;
        if (localT > 0.8) {
          // Near-miss zone — slow, picking close chars
          interval = 120 + (localT - 0.8) * 800;
        } else if (localT > 0.5) {
          // Deceleration
          interval = 50 + (localT - 0.5) * 200;
        } else {
          // Fast spin
          interval = 35 + localT * 30;
        }

        if (elapsed - charLastChange[i] >= interval) {
          charLastChange[i] = elapsed;
          // Near-miss for last 20%
          if (localT > 0.8 && targetWord[i].match(/[a-zA-Z]/)) {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const idx = alphabet.indexOf(targetWord[i].toUpperCase());
            if (idx !== -1) {
              const offset = Math.floor(Math.random() * 5) - 2;
              const nearIdx = ((idx + offset) % 26 + 26) % 26;
              charCurrent[i] = targetWord[i] === targetWord[i].toUpperCase()
                ? alphabet[nearIdx]
                : alphabet[nearIdx].toLowerCase();
            } else {
              charCurrent[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            }
          } else {
            charCurrent[i] = scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }

        // Flicker opacity
        const opacity = localT > 0.7 ? 0.85 + Math.random() * 0.15 : 0.6 + Math.random() * 0.4;
        spans.push(
          React.createElement('span', { key: i, style: { opacity } }, charCurrent[i])
        );
      }
    }

    onFrame(spans.length > 0 ? spans : '');

    if (allDone) {
      onFrame(targetWord);
      onComplete();
    } else {
      timeout = setTimeout(tick, tickRate);
    }
  }

  timeout = setTimeout(tick, tickRate);

  return () => {
    cancelled = true;
    if (timeout) clearTimeout(timeout);
  };
}

/**
 * Quick scramble for language transitions — all chars visible immediately,
 * resolves left-to-right in ~400ms. Feels more instant.
 */
function scrambleTransition(
  targetWord: string,
  scrambleChars: string,
  onFrame: (node: React.ReactNode) => void,
  onComplete: () => void,
): () => void {
  const len = targetWord.length;
  if (len === 0) { onComplete(); return () => {}; }

  const totalFrames = 18;
  const interval = 45; // ~810ms total — slower, more dramatic
  let frame = 0;
  let cancelled = false;

  // Per-char lock frame — wider spread so chars resolve at different times
  const lockAt = new Array(len).fill(0).map(() =>
    Math.floor(Math.random() * (totalFrames - 4)) + 4
  );

  const timer = setInterval(() => {
    if (cancelled) { clearInterval(timer); return; }
    frame++;
    let text = '';
    for (let i = 0; i < len; i++) {
      if (frame >= lockAt[i]) {
        text += targetWord[i];
      } else if (targetWord[i] === ' ') {
        text += ' ';
      } else {
        text += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      }
    }
    onFrame(text);
    if (frame >= totalFrames) {
      clearInterval(timer);
      onFrame(targetWord);
      onComplete();
    }
  }, interval);

  return () => { cancelled = true; clearInterval(timer); };
}

export function useEnterScreen({ phase, onEnter }: UseEnterScreenProps): UseEnterScreenReturn {
  const [displayText, setDisplayText] = useState<React.ReactNode>('');
  const cleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const wordIndexRef = useRef(0);
  const shuffledRef = useRef<string[]>([]);
  const isFirstWord = useRef(true);
  const pendingEnterRef = useRef(false);
  const isResolved = useRef(false); // true when current word is fully resolved and holding
  const hasTriggered = useRef(false); // guard: once enter fired, ignore all subsequent calls

  const cleanup = useCallback(() => {
    activeRef.current = false;
    pendingEnterRef.current = false;
    isResolved.current = false;
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const handleEnter = useCallback(() => {
    if (phase !== 'enter') return;
    if (hasTriggered.current) return; // already entering — ignore re-triggers
    if (isResolved.current) {
      // Word is already resolved — go immediately
      hasTriggered.current = true;
      cleanup();
      onEnter();
    } else {
      // Mid-scramble — set flag, will fire when current word finishes resolving
      pendingEnterRef.current = true;
    }
  }, [phase, onEnter, cleanup]);

  // Keyboard
  useEffect(() => {
    if (phase !== 'enter') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEnter(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleEnter]);

  // Main cycling
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- phase-change reset of the typing buffer; effect mirrors external (parent phase) state.
    if (phase !== 'enter') { cleanup(); setDisplayText(''); return; }
    // Entering the enter phase fresh — reset trigger guard
    hasTriggered.current = false;

    activeRef.current = true;
    isFirstWord.current = true;
    const chars = SCRAMBLE_CHARS.base;
    const { holdDuration, initialDelay } = ENTER_TIMING;

    // First ENTER_FIXED_COUNT entries stay in order, rest get shuffled
    const fixed = [...ENTER_TRANSLATIONS].slice(0, ENTER_FIXED_COUNT);
    const pool = [...ENTER_TRANSLATIONS].slice(ENTER_FIXED_COUNT);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    shuffledRef.current = [...fixed, ...pool];
    wordIndexRef.current = 0;

    function doWord() {
      if (!activeRef.current) return;
      const word = shuffledRef.current[wordIndexRef.current];
      const onFrame = (node: React.ReactNode) => { if (activeRef.current) setDisplayText(node); };
      const onDone = () => {
        if (!activeRef.current) return;
        isResolved.current = true;
        // If user clicked during scramble, trigger enter now
        if (pendingEnterRef.current && !hasTriggered.current) {
          hasTriggered.current = true;
          cleanup();
          onEnter();
          return;
        }
        timerRef.current = setTimeout(() => {
          isResolved.current = false;
          if (!activeRef.current) return;
          wordIndexRef.current = (wordIndexRef.current + 1) % shuffledRef.current.length;
          if (wordIndexRef.current === 0) {
            // Only re-shuffle the random pool (after fixed entries)
            const arr = shuffledRef.current;
            for (let i = arr.length - 1; i > ENTER_FIXED_COUNT; i--) {
              const j = ENTER_FIXED_COUNT + Math.floor(Math.random() * (i - ENTER_FIXED_COUNT + 1));
              [arr[i], arr[j]] = [arr[j], arr[i]];
            }
          }
          isFirstWord.current = false;
          doWord();
        }, holdDuration);
      };

      // First word: dramatic typing. Subsequent: quick scramble transition.
      if (isFirstWord.current) {
        cleanupRef.current = animateWord(word, chars, onFrame, onDone);
      } else {
        cleanupRef.current = scrambleTransition(word, chars, onFrame, onDone);
      }
    }

    timerRef.current = setTimeout(() => {
      if (activeRef.current) doWord();
    }, initialDelay);

    return cleanup;
  }, [phase, cleanup]);

  return { displayText, handleEnter };
}
