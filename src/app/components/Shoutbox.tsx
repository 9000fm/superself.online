'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Language } from '../types';
import { useShoutbox } from '../hooks/useShoutbox';
import VCIrcTerminal from './ShoutboxVariants/VCIrcTerminal';
import VAAolClassic from './ShoutboxVariants/VAAolClassic';
import VBMsnMessenger from './ShoutboxVariants/VBMsnMessenger';
import VDYahooChat from './ShoutboxVariants/VDYahooChat';

type Props = {
  language: Language;
  onClose: () => void;
  onTitlebarDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: boolean;
  positionStyle?: React.CSSProperties;
};

const SKINS = ['irc', 'aol', 'msn', 'yahoo'] as const;
type Skin = typeof SKINS[number];

const SKIN_LABELS: Record<Skin, string> = {
  irc: 'IRC Terminal',
  aol: 'AOL Classic',
  msn: 'MSN Messenger',
  yahoo: 'Yahoo Chat',
};

const SKIN_STORAGE_KEY = 'superself.shoutbox.skin';

export default function Shoutbox({ language, onClose, onTitlebarDragStart, isDragging, positionStyle }: Props) {
  const hook = useShoutbox(language);

  const [skin, setSkin] = useState<Skin>(() => {
    if (typeof window === 'undefined') return 'irc';
    try {
      const s = localStorage.getItem(SKIN_STORAGE_KEY);
      return (s && SKINS.includes(s as Skin)) ? (s as Skin) : 'irc';
    } catch {
      return 'irc';
    }
  });

  useEffect(() => {
    try { localStorage.setItem(SKIN_STORAGE_KEY, skin); } catch {}
  }, [skin]);

  const cycleSkin = useCallback(() => {
    setSkin((prev) => {
      const idx = SKINS.indexOf(prev);
      return SKINS[(idx + 1) % SKINS.length];
    });
  }, []);

  const nextLabel = (() => {
    const idx = SKINS.indexOf(skin);
    const next = SKINS[(idx + 1) % SKINS.length];
    return `skin: ${SKIN_LABELS[skin]} → ${SKIN_LABELS[next]}`;
  })();

  const common = {
    hook,
    language,
    onClose,
    onCycleSkin: cycleSkin,
    skinLabel: nextLabel,
    onTitlebarDragStart,
    isDragging,
    positionStyle,
  };

  if (skin === 'irc') return <VCIrcTerminal {...common} />;
  if (skin === 'aol') return <VAAolClassic {...common} />;
  if (skin === 'msn') return <VBMsnMessenger {...common} />;
  return <VDYahooChat {...common} />;
}
