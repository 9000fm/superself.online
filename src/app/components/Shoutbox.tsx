'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '../types';
import { translations } from '../translations';
import { useShoutbox } from '../hooks/useShoutbox';
import { MAX_BODY, NICK_STORAGE_KEY, formatTimeShort } from '../lib/shoutbox-helpers';

type ScrambleSlice = {
  chatTitlebar?: string;
  chatHeader?: string;
  chatUsers?: string;
  chatPrompt?: string;
  chatFooter?: string;
  chatOnline?: string;
  close?: string;
};

type Props = {
  language: Language;
  onClose: () => void;
  onTitlebarDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: boolean;
  positionStyle?: React.CSSProperties;
  scrambled?: ScrambleSlice;
};

// Chat body — always a light paper regardless of site theme, for readability.
const C_BG = '#fafaf7';
const C_FG = '#0a0a0a';
const C_DIM = '#888';
const C_DASH = '#c8c8c0';
const C_AMBER = '#b45309';
const C_OWN = '#b45309';
const C_ONLINE = '#15803d';

// IRC nick palette tuned for readable contrast on a light paper background.
const IRC_COLORS = ['#0a0a0a', '#0e7490', '#9d174d', '#6d28d9'] as const;
function ircColor(nick: string): string {
  let h = 5381;
  for (let i = 0; i < nick.length; i++) h = ((h << 5) + h + nick.charCodeAt(i)) | 0;
  return IRC_COLORS[Math.abs(h) % IRC_COLORS.length];
}

const EMOTICONS = [':)', ':(', ':D', ';)', ':P', '<3'] as const;

export default function Shoutbox({ language, onClose, onTitlebarDragStart, isDragging, positionStyle, scrambled }: Props) {
  const t = translations[language].shoutbox;
  const tRoot = translations[language];
  const sx = (scrambledVal: string | undefined, fallback: string) => (scrambledVal && scrambledVal.length > 0 ? scrambledVal : fallback);
  const hook = useShoutbox(language);
  const { messages, loaded, viewers, mergedUsers, cooldownRemaining, sending, error, ownIds, send, clearError } = hook;

  const [nick, setNick] = useState<string>(() => {
    if (typeof window === 'undefined') return 'anon';
    try { return localStorage.getItem(NICK_STORAGE_KEY) ?? 'anon'; } catch { return 'anon'; }
  });
  const [body, setBody] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  useEffect(() => { try { if (nick) localStorage.setItem(NICK_STORAGE_KEY, nick); } catch {} }, [nick]);
  useEffect(() => { const el = logRef.current; if (el && atBottomRef.current) el.scrollTop = el.scrollHeight; }, [messages]);

  const onKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!body.trim() || sending || cooldownRemaining > 0) return;
      const r = await send({ nickname: nick, body });
      if (r === 'ok') setBody('');
    }
  };

  return (
    <div className="popup-window" style={{
      background: C_BG, color: C_FG,
      fontFamily: '"Courier New", "Courier Prime", monospace',
      border: '1px solid var(--panel-border)',
      width: 'min(820px, 96vw)',
      ...positionStyle,
    }}>
      {/* Site-native titlebar — matches acerca / tienda / sesiones */}
      <div
        onMouseDown={onTitlebarDragStart}
        onTouchStart={onTitlebarDragStart}
        style={{
          background: 'var(--titlebar-bg)',
          color: 'var(--titlebar-fg)',
          padding: '6px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--panel-border)',
          fontFamily: 'var(--font-terminal, monospace)',
          cursor: onTitlebarDragStart ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: onTitlebarDragStart ? 'none' : undefined,
        }}
      >
        <span style={{ fontSize: '16px', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          {sx(scrambled?.chatTitlebar, t.titlebar)}
        </span>
        <button
          type="button"
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          aria-label={tRoot.close}
          style={{
            background: 'transparent', border: 'none', color: 'var(--titlebar-fg)',
            fontFamily: 'inherit', fontSize: '15px', cursor: 'pointer',
            padding: '2px 10px', lineHeight: 1.3, touchAction: 'manipulation', whiteSpace: 'nowrap',
          }}
        >
          [ {sx(scrambled?.close, tRoot.close.toLowerCase())} ]
        </button>
      </div>

      {/* Channel heading */}
      <div style={{
        padding: '10px 12px 4px', fontSize: 15,
        color: C_FG, fontWeight: 700, letterSpacing: '0.04em',
      }}>
        <span style={{ color: C_DIM, marginRight: 4 }}>##</span>
        {sx(scrambled?.chatHeader, t.header)}
      </div>

      {/* Channel meta row */}
      <div style={{
        padding: '0 12px 6px', fontSize: 12, color: C_DIM,
        borderBottom: `1px dashed ${C_DASH}`,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span>[ <span style={{ color: C_AMBER }}>#superself</span> ]</span>
        <span>· {viewers} {sx(scrambled?.chatOnline, t.onAir)}</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: C_DIM }}>{mergedUsers.length} total</span>
      </div>

      {/* Log + right sidebar */}
      <div className="shoutbox-body" style={{ display: 'grid', gridTemplateColumns: '1fr 160px' }}>
        <div
          ref={logRef}
          onScroll={() => { const el = logRef.current; if (el) atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
          className="shoutbox-log"
          style={{
            minHeight: 240, maxHeight: 360, overflowY: 'auto',
            padding: '8px 10px', fontSize: 13, lineHeight: 1.4,
            display: 'flex', flexDirection: 'column', gap: 2,
            borderRight: `1px dashed ${C_DASH}`,
          }}
        >
          {!loaded && <div style={{ color: C_DIM }}>connecting...</div>}
          {loaded && messages.length === 0 && <div style={{ color: C_DIM }}>* no traffic on this channel</div>}
          {messages.map((m) => {
            const color = ircColor(m.nickname);
            const isOwn = ownIds.has(m.id);
            return (
              <div key={m.id} style={{ wordBreak: 'break-word' }}>
                <span style={{ color: C_DIM }}>[{formatTimeShort(m.created_at)}]</span>{' '}
                <span style={{ color: isOwn ? C_OWN : color, fontWeight: 700 }}>&lt;{m.nickname}&gt;</span>{' '}
                <span style={{ color: C_FG }}>{m.body}</span>
              </div>
            );
          })}
        </div>

        {/* Sidebar — connected + seeded users */}
        <div className="shoutbox-sidebar" style={{
          padding: '8px 10px', fontSize: 12,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{
            color: C_AMBER, letterSpacing: '0.12em', textTransform: 'uppercase',
            paddingBottom: 3, borderBottom: `1px dashed ${C_DASH}`, fontSize: 11,
          }}>
            {sx(scrambled?.chatUsers, t.usersLabel)} · {viewers}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 320, overflowY: 'auto' }}>
            {mergedUsers.map((u) => (
              <div key={u.name} style={{
                display: 'flex', gap: 6, alignItems: 'center',
                color: u.online ? C_FG : C_DIM,
                opacity: u.online ? 1 : 0.7,
              }}>
                <span style={{ color: u.online ? C_ONLINE : C_DIM, fontSize: 10, width: 10 }}>
                  {u.online ? '●' : '○'}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emoticon bar */}
      <div style={{
        display: 'flex', gap: 6, padding: '4px 10px',
        borderTop: `1px dashed ${C_DASH}`,
        fontSize: 12,
      }}>
        {EMOTICONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setBody((b) => (b + (b.endsWith(' ') || b.length === 0 ? '' : ' ') + e).slice(0, MAX_BODY))}
            style={{
              background: 'transparent', border: `1px dashed ${C_DASH}`,
              color: C_FG, padding: '1px 7px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12,
            }}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <div style={{
        padding: '6px 10px', borderTop: `1px dashed ${C_DASH}`,
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
      }}>
        <span style={{ color: C_DIM }}>[{formatTimeShort(new Date().toISOString())}]</span>
        <span style={{ color: C_FG }}>&lt;</span>
        <input
          type="text" value={nick}
          onChange={(e) => setNick(e.target.value.slice(0, 16))}
          placeholder="nick"
          maxLength={16}
          style={{ width: 96, background: 'transparent', border: 'none', outline: 'none', color: C_FG, fontFamily: 'inherit', fontSize: 13, padding: 0 }}
        />
        <span style={{ color: C_FG }}>&gt;</span>
        <input
          type="text" value={body}
          onChange={(e) => { clearError(); setBody(e.target.value.replace(/[\r\n]+/g, ' ').slice(0, MAX_BODY)); }}
          onKeyDown={onKey}
          placeholder={sx(scrambled?.chatPrompt, t.promptHint)}
          maxLength={MAX_BODY}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C_FG, fontFamily: 'inherit', fontSize: 13, padding: 0 }}
          autoComplete="off"
        />
        <span className="blink-slow" style={{ color: C_FG }}>_</span>
      </div>

      {/* Footer status */}
      <div style={{
        padding: '3px 10px', fontSize: 11,
        color: error ? '#ff5555' : C_DIM,
        borderTop: `1px dashed ${C_DASH}`,
      }}>
        {error ?? (cooldownRemaining > 0
          ? `-- flood protection · wait ${cooldownRemaining}s --`
          : sx(scrambled?.chatFooter, t.footerHint))}
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
