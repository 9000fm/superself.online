import { useState, useEffect, useRef } from 'react';
import { Phase, Language } from '../types';
import { translations } from '../translations';
import { SCRAMBLE_CHARS } from '../constants';

interface UseLanguageScrambleProps {
  phase: Phase;
  language: Language;
}

interface ScrambledTexts {
  about: string;
  shop: string;
  message: string;
  copyright: string;
  welcomeMsg: string;
  aboutText: string;
  shopMsg: string;
  close: string;
  cancel: string;
  ok: string;
  confirm: string;
  subscribePrompt: string;
}

interface UseLanguageScrambleReturn {
  scrambled: ScrambledTexts;
}

const emptyScrambled: ScrambledTexts = {
  about: '',
  shop: '',
  message: '',
  copyright: '',
  welcomeMsg: '',
  aboutText: '',
  shopMsg: '',
  close: '',
  cancel: '',
  ok: '',
  confirm: '',
  subscribePrompt: '',
};

export function useLanguageScramble({
  phase,
  language,
}: UseLanguageScrambleProps): UseLanguageScrambleReturn {
  const t = translations[language];
  const scrambleChars = language === 'JP' ? SCRAMBLE_CHARS.japanese : SCRAMBLE_CHARS.base;

  const [scrambled, setScrambled] = useState<ScrambledTexts>(emptyScrambled);
  const isScrambling = useRef(false);
  const prevLangRef = useRef<Language>(language);

  useEffect(() => {
    if (phase !== 'main') {
      // Keep prevLangRef in sync when not in main phase so
      // entering main doesn't trigger a stale scramble
      prevLangRef.current = language;
      return;
    }
    if (isScrambling.current) return;

    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      isScrambling.current = true;

      // Get new texts
      const newTexts = {
        about: t.about,
        shop: t.shop,
        message: t.message,
        copyright: t.allRightsReserved,
        welcomeMsg: t.welcomeMessage,
        aboutText: t.aboutText,
        shopMsg: t.shopMessage,
        close: t.close,
        cancel: t.cancel,
        ok: t.ok,
        confirm: t.confirm,
        subscribePrompt: t.subscribePrompt,
      };

      let frame = 0;
      const maxFrames = 18;

      // Per-character random lock frame: each char resolves independently
      // instead of sweeping left-to-right. Creates an in-place morph effect.
      const charLockFrames: Record<string, number[]> = {};
      for (const key of Object.keys(newTexts) as (keyof typeof newTexts)[]) {
        const textLen = newTexts[key].length;
        charLockFrames[key] = Array.from({ length: textLen }, () =>
          Math.floor(Math.random() * (maxFrames - 2)) + 2 // lock between frame 2 and maxFrames
        );
      }

      const scrambleInterval = setInterval(() => {
        frame++;

        // In-place morph: each character resolves at its own random frame
        const scrambleText = (newText: string, lockFrames: number[]) => {
          let result = '';
          for (let i = 0; i < newText.length; i++) {
            if (frame >= lockFrames[i]) {
              result += newText[i];
            } else if (newText[i] === ' ' || newText[i] === '\n') {
              result += newText[i];
            } else {
              result += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            }
          }
          return result;
        };

        setScrambled({
          about: scrambleText(newTexts.about, charLockFrames.about),
          shop: scrambleText(newTexts.shop, charLockFrames.shop),
          message: scrambleText(newTexts.message, charLockFrames.message),
          copyright: scrambleText(newTexts.copyright, charLockFrames.copyright),
          welcomeMsg: scrambleText(newTexts.welcomeMsg, charLockFrames.welcomeMsg),
          aboutText: scrambleText(newTexts.aboutText, charLockFrames.aboutText),
          shopMsg: scrambleText(newTexts.shopMsg, charLockFrames.shopMsg),
          close: scrambleText(newTexts.close, charLockFrames.close),
          cancel: scrambleText(newTexts.cancel, charLockFrames.cancel),
          ok: scrambleText(newTexts.ok, charLockFrames.ok),
          confirm: scrambleText(newTexts.confirm, charLockFrames.confirm),
          subscribePrompt: scrambleText(newTexts.subscribePrompt, charLockFrames.subscribePrompt),
        });

        if (frame >= maxFrames) {
          // Clear scrambled states to show actual translations
          setScrambled(emptyScrambled);
          clearInterval(scrambleInterval);
          isScrambling.current = false;
        }
      }, 40);

      return () => {
        clearInterval(scrambleInterval);
        setScrambled(emptyScrambled);
        isScrambling.current = false;
      };
    }
  }, [language, phase, t, scrambleChars]);

  return { scrambled };
}
