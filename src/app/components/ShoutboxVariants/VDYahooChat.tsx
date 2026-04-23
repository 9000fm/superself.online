'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../types';
import { translations } from '../../translations';
import type { UseShoutboxResult } from '../../hooks/useShoutbox';
import {
  nickToColor, countryToFlag, formatTimeShort,
  MAX_BODY, NICK_STORAGE_KEY,
} from '../../lib/shoutbox-helpers';

type Props = {
  hook: UseShoutboxResult;
  language: Language;
  onClose: () => void;
  onCycleSkin?: () => void;
  skinLabel?: string;
  onTitlebarDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: boolean;
  positionStyle?: React.CSSProperties;
};

// Woohoo bg blends 50/50 with site theme.
const C_BG = 'color-mix(in srgb, #f2f0f7 50%, var(--background) 50%)';
const C_FG = '#231536';
const C_PURPLE = '#6001d2';
const C_YELLOW = '#ffd500';
const C_BORDER = '#c5bddc';
const C_OWN_BORDER = '#6001d2';

const EMOTICONS = [':)', ':(', ':D', ';)', ':P', '<3'] as const;

export default function VDYahooChat({ hook, language, onClose, onCycleSkin, skinLabel, onTitlebarDragStart, isDragging, positionStyle }: Props) {
  const t = translations[language].shoutbox;
  const { messages, loaded, viewers, mergedUsers, cooldownRemaining, sending, error, ownIds, send, clearError } = hook;

  const [nick, setNick] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem(NICK_STORAGE_KEY) ?? ''; } catch { return ''; }
  });
  const [body, setBody] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  useEffect(() => { try { if (nick) localStorage.setItem(NICK_STORAGE_KEY, nick); } catch {} }, [nick]);
  useEffect(() => { const el = logRef.current; if (el && atBottomRef.current) el.scrollTop = el.scrollHeight; }, [messages]);

  const onSend = async () => {
    if (!body.trim() || sending || cooldownRemaining > 0) return;
    const r = await send({ nickname: nick, body });
    if (r === 'ok') setBody('');
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };


  return (
    <div className="popup-window" style={{
      background: C_BG, color: C_FG,
      fontFamily: 'Verdana, Geneva, Tahoma, sans-serif',
      border: `1px solid ${C_BORDER}`,
      width: 'min(820px, 96vw)',
      ...positionStyle,
    }}>
      {/* Woohoo titlebar */}
      <div
        onMouseDown={onTitlebarDragStart}
        onTouchStart={onTitlebarDragStart}
        style={{
          background: C_PURPLE, color: '#fff',
          padding: '5px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12,
          cursor: onTitlebarDragStart ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: onTitlebarDragStart ? 'none' : undefined,
        }}
      >
        <span style={{ fontWeight: 900, fontStyle: 'italic', letterSpacing: '-0.03em' }}>
          WOOHOO<span style={{ color: C_YELLOW }}>!</span> Chat
        </span>
        <span style={{ opacity: 0.8 }}>— superself</span>
        <span style={{ flex: 1 }} />
        {onCycleSkin && (
          <button type="button" onClick={onCycleSkin}
            onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
            title={skinLabel} aria-label="change skin" style={{
            background: C_YELLOW, color: C_PURPLE, border: 'none',
            width: 18, height: 16, padding: 0, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
            marginRight: 4,
          }}>◐</button>
        )}
        <button type="button" onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
          aria-label="close" style={{
          background: '#fff', color: C_PURPLE, border: 'none',
          width: 18, height: 16, padding: 0, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
        }}>×</button>
      </div>

      {/* Body */}
      <div className="shoutbox-body" style={{ display: 'grid', gridTemplateColumns: '4fr 1fr' }}>
        <div
          ref={logRef}
          onScroll={() => { const el = logRef.current; if (el) atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
          className="shoutbox-log"
          style={{ minHeight: 240, maxHeight: 360, overflowY: 'auto', padding: '8px 10px', fontSize: 12, lineHeight: 1.5, borderRight: `1px solid ${C_BORDER}` }}
        >
          {!loaded && <div style={{ color: '#888' }}>...</div>}
          {loaded && messages.length === 0 && <div style={{ color: '#888' }}>{t.empty}</div>}
          {messages.map((m) => {
            const color = nickToColor(m.nickname);
            const flag = countryToFlag(m.country_code);
            const isOwn = ownIds.has(m.id);
            return (
              <div key={m.id} style={{
                padding: '3px 0',
                paddingLeft: 8,
                borderLeft: isOwn ? `3px solid ${C_OWN_BORDER}` : '3px solid transparent',
                wordBreak: 'break-word',
              }}>
                <span style={{ color: '#888', fontSize: 11 }}>{formatTimeShort(m.created_at)} </span>
                {flag && <span aria-hidden style={{ marginRight: 4 }}>{flag}</span>}
                <span style={{ color, fontWeight: 700 }}>{m.nickname}</span>
                <span style={{ color: '#555' }}> says, </span>
                <span style={{ color: C_FG }}>&ldquo;{m.body}&rdquo;</span>
              </div>
            );
          })}
        </div>

        <div className="shoutbox-sidebar" style={{ padding: 8, fontSize: 11 }}>
          <div style={{ fontWeight: 700, color: C_PURPLE, borderBottom: `1px solid ${C_BORDER}`, paddingBottom: 3, marginBottom: 5 }}>
            {viewers} people here
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 240, overflowY: 'auto' }}>
            {mergedUsers.map((u) => (
              <div key={u.name} style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: u.online ? 1 : 0.6 }}>
                <span aria-hidden style={{
                  fontSize: 9, padding: '1px 5px',
                  background: u.online ? C_PURPLE : '#c5bddc',
                  color: '#fff',
                  borderRadius: 8, letterSpacing: '0.08em',
                }}>{u.online ? 'ON' : 'OFF'}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Emoticon bar */}
      <div style={{
        display: 'flex', gap: 6, padding: '4px 8px',
        borderTop: `1px solid ${C_BORDER}`, background: '#fff',
        fontSize: 12,
      }}>
        {EMOTICONS.map((e) => (
          <button key={e} type="button"
            onClick={() => setBody((b) => (b + ' ' + e).slice(0, MAX_BODY))}
            style={{
              background: '#fff', border: `1px solid ${C_BORDER}`,
              color: C_PURPLE, padding: '1px 6px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12,
            }}>{e}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '6px 8px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', gap: 6, background: '#fff' }}>
        <input
          type="text" value={nick}
          onChange={(e) => setNick(e.target.value.slice(0, 16))}
          placeholder="yahoo id"
          maxLength={16}
          style={{ width: 110, border: `1px solid ${C_BORDER}`, fontFamily: 'inherit', fontSize: 12, padding: '3px 6px', outline: 'none', background: '#fff', color: C_FG }}
        />
        <input
          type="text" value={body}
          onChange={(e) => { clearError(); setBody(e.target.value.replace(/[\r\n]+/g, ' ').slice(0, MAX_BODY)); }}
          onKeyDown={onKey}
          placeholder="say something..."
          maxLength={MAX_BODY}
          style={{ flex: 1, border: `1px solid ${C_BORDER}`, fontFamily: 'inherit', fontSize: 12, padding: '3px 6px', outline: 'none', background: '#fff', color: C_FG }}
          autoComplete="off"
        />
        <button type="button" onClick={onSend} disabled={sending || cooldownRemaining > 0 || body.trim().length === 0} style={{
          background: C_PURPLE, color: '#fff', border: 'none', padding: '0 16px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          opacity: (sending || cooldownRemaining > 0 || body.trim().length === 0) ? 0.5 : 1,
        }}>
          {cooldownRemaining > 0 ? `${cooldownRemaining}s` : 'Send'}
        </button>
      </div>
      <div style={{ padding: '2px 8px', fontSize: 10, color: error ? '#c00' : '#666', borderTop: `1px solid ${C_BORDER}` }}>
        {error ?? (cooldownRemaining > 0 ? t.rateLimited.replace('{n}', String(cooldownRemaining)) : 'Conectado · superself chat')}
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
