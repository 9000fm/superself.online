'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase';
import type { Language } from '../types';
import { translations } from '../translations';

type Props = {
  language: Language;
  onClick: () => void;
  scrambled?: { badgeOne?: string; badgeMany?: string };
};

export default function ShoutboxBadge({ language, onClick, scrambled }: Props) {
  const t = translations[language].shoutbox;
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowser();

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/shoutbox', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json() as { total: number };
        if (!cancelled) setTotal(data.total);
      } catch {}
    };
    fetchCount();

    const channel = supabase
      .channel('shoutbox_badge_count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shoutbox_messages' },
        () => {
          setTotal((prev) => (prev === null ? prev : prev + 1));
        }
      )
      .subscribe();

    const refreshInterval = window.setInterval(fetchCount, 60_000);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.clearInterval(refreshInterval);
    };
  }, []);

  const n = total ?? 0;
  const nDisplay = n > 99 ? '99+' : String(n);
  const oneTpl = (scrambled?.badgeOne && scrambled.badgeOne.length > 0) ? scrambled.badgeOne : t.badgeOne;
  const manyTpl = (scrambled?.badgeMany && scrambled.badgeMany.length > 0) ? scrambled.badgeMany : t.badgeMany;
  const label = n === 1 ? oneTpl : manyTpl.replace('{n}', nDisplay);
  const ariaLabel = t.open.replace('{n}', total === null ? '…' : String(total));

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        cursor: 'pointer',
        background: 'transparent',
        border: 'none',
        padding: 0,
        margin: 0,
        color: 'var(--text-primary, rgba(255,255,255,0.75))',
        fontFamily: 'var(--font-terminal, monospace)',
        fontSize: 'clamp(0.85rem, 2vw, 1.3rem)',
        letterSpacing: '0.02em',
        lineHeight: 1,
        textAlign: 'left',
      }}
    >
      <span className="blink-slow">▶</span> [{label}]
    </button>
  );
}
