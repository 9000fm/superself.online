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
  mixes: string;
  message: string;
  welcomeMsg: string;
  aboutBio: string;
  aboutCta: string;
  aboutHeader: string;
  shopMsg: string;
  close: string;
  cancel: string;
  ok: string;
  confirm: string;
  subscribePrompt: string;
  subscribeHeader: string;
  mixesHeader: string;
  chatTitlebar: string;
  chatHeader: string;
  chatUsers: string;
  chatPrompt: string;
  chatFooter: string;
  chatOnline: string;
  badgeOne: string;
  badgeMany: string;
}

interface UseLanguageScrambleReturn {
  scrambled: ScrambledTexts;
}

const emptyScrambled: ScrambledTexts = {
  about: '',
  shop: '',
  mixes: '',
  message: '',
  welcomeMsg: '',
  aboutBio: '',
  aboutCta: '',
  aboutHeader: '',
  shopMsg: '',
  close: '',
  cancel: '',
  ok: '',
  confirm: '',
  subscribePrompt: '',
  subscribeHeader: '',
  mixesHeader: '',
  chatTitlebar: '',
  chatHeader: '',
  chatUsers: '',
  chatPrompt: '',
  chatFooter: '',
  chatOnline: '',
  badgeOne: '',
  badgeMany: '',
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
      prevLangRef.current = language;
      return;
    }
    if (isScrambling.current) return;

    if (prevLangRef.current !== language) {
      prevLangRef.current = language;
      isScrambling.current = true;

      const newTexts: Record<keyof ScrambledTexts, string> = {
        about: t.about,
        shop: t.shop,
        mixes: t.mixes,
        message: t.message,
        welcomeMsg: t.welcomeMessage,
        aboutBio: t.aboutBio,
        aboutCta: t.aboutCta,
        aboutHeader: t.aboutHeader,
        shopMsg: t.shopMessage,
        close: t.close,
        cancel: t.cancel,
        ok: t.ok,
        confirm: t.confirm,
        subscribePrompt: t.subscribePrompt,
        subscribeHeader: t.subscribe.toLowerCase(),
        mixesHeader: t.mixes.replace('> ', ''),
        chatTitlebar: t.shoutbox.titlebar,
        chatHeader: t.shoutbox.header,
        chatUsers: t.shoutbox.usersLabel,
        chatPrompt: t.shoutbox.promptHint,
        chatFooter: t.shoutbox.footerHint,
        chatOnline: t.shoutbox.onAir,
        badgeOne: t.shoutbox.badgeOne,
        badgeMany: t.shoutbox.badgeMany,
      };

      let frame = 0;
      const maxFrames = 18;

      const charLockFrames: Record<string, number[]> = {};
      for (const key of Object.keys(newTexts) as (keyof typeof newTexts)[]) {
        const textLen = newTexts[key].length;
        charLockFrames[key] = Array.from({ length: textLen }, () =>
          Math.floor(Math.random() * (maxFrames - 2)) + 2
        );
      }

      const scrambleInterval = setInterval(() => {
        frame++;

        const scrambleText = (newText: string, lockFrames: number[]) => {
          let result = '';
          for (let i = 0; i < newText.length; i++) {
            if (frame >= lockFrames[i]) {
              result += newText[i];
            } else if (newText[i] === ' ' || newText[i] === '\n') {
              result += newText[i];
            } else if (newText[i] === '{' || newText[i] === '}' || newText[i] === '-' || newText[i] === '·') {
              // preserve template/structural characters so {n} substitution still works
              result += newText[i];
            } else {
              result += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            }
          }
          return result;
        };

        const next: ScrambledTexts = { ...emptyScrambled };
        for (const key of Object.keys(newTexts) as (keyof ScrambledTexts)[]) {
          next[key] = scrambleText(newTexts[key], charLockFrames[key]);
        }
        setScrambled(next);

        if (frame >= maxFrames) {
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
