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

// AOL palette — hardcoded identity colors, but background blends 50/50 with site theme.
const C_BG = 'color-mix(in srgb, #ffffff 50%, var(--background) 50%)';
const C_FG = '#000000';
const C_TITLEBAR = '#0054a8';
const C_ACCENT_LINK = '#0054a8';
const C_OWN_BG = '#fff9c4';
const C_CLOSE = '#d93025';
const C_BORDER = '#9fb3c8';

export default function VAAolClassic({ hook, language, onClose, onCycleSkin, skinLabel, onTitlebarDragStart, isDragging, positionStyle }: Props) {
  const t = translations[language].shoutbox;
  const { messages, loaded, viewers, mergedUsers, cooldownRemaining, sending, error, ownIds, send, clearError } = hook;

  const [nick, setNick] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem(NICK_STORAGE_KEY) ?? ''; } catch { return ''; }
  });
  const [body, setBody] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    try { if (nick) localStorage.setItem(NICK_STORAGE_KEY, nick); } catch {}
  }, [nick]);
  useEffect(() => {
    const el = logRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

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
      fontFamily: 'Tahoma, "MS Sans Serif", sans-serif',
      border: `1px solid ${C_BORDER}`,
      width: 'min(820px, 96vw)',
      ...positionStyle,
    }}>
      {/* AOL titlebar */}
      <div
        onMouseDown={onTitlebarDragStart}
        onTouchStart={onTitlebarDragStart}
        style={{
          background: C_TITLEBAR, color: '#fff',
          padding: '4px 8px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '12px', fontWeight: 700,
          cursor: onTitlebarDragStart ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: onTitlebarDragStart ? 'none' : undefined,
        }}
      >
        <span style={{ flex: 1 }}>Live Chat</span>
        {onCycleSkin && (
          <button type="button" onClick={onCycleSkin}
            onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
            title={skinLabel} aria-label="change skin" style={{
            background: '#f0f0f0', color: '#0054a8', border: '1px outset #fff',
            width: 18, height: 16, padding: 0, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '11px', fontWeight: 700,
            marginRight: 2,
          }}>◐</button>
        )}
        <button type="button" onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
          aria-label="close" style={{
          background: C_CLOSE, color: '#fff', border: '1px outset #fff',
          width: 18, height: 16, padding: 0, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '11px', fontWeight: 700,
        }}>×</button>
      </div>

      {/* Toolbar row */}
      <div style={{
        padding: '4px 8px',
        borderBottom: `1px solid ${C_BORDER}`,
        display: 'flex', gap: 6, fontSize: '11px', color: '#444',
      }}>
        <span style={{ padding: '1px 6px', border: `1px solid ${C_BORDER}`, background: '#f0f0f0' }}>✉ Read</span>
        <span style={{ padding: '1px 6px', border: `1px solid ${C_BORDER}`, background: '#f0f0f0' }}>✎ Write</span>
        <span style={{ padding: '1px 6px', border: `1px solid ${C_BORDER}`, background: '#f0f0f0' }}>☆ Favorite</span>
      </div>

      {/* Body */}
      <div className="shoutbox-body" style={{ display: 'grid', gridTemplateColumns: '4fr 1fr' }}>
        <div
          ref={logRef}
          onScroll={() => { const el = logRef.current; if (el) atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
          className="shoutbox-log"
          style={{
            minHeight: 240, maxHeight: 360, overflowY: 'auto',
            borderRight: `1px solid ${C_BORDER}`,
            fontSize: '12px', lineHeight: 1.4,
          }}
        >
          {!loaded && <div style={{ padding: '8px 12px', color: '#888' }}>...</div>}
          {loaded && messages.length === 0 && <div style={{ padding: '8px 12px', color: '#888' }}>{t.empty}</div>}
          {messages.map((m) => {
            const color = nickToColor(m.nickname);
            const flag = countryToFlag(m.country_code);
            const isOwn = ownIds.has(m.id);
            return (
              <div key={m.id} style={{
                padding: '3px 10px',
                background: isOwn ? C_OWN_BG : 'transparent',
                wordBreak: 'break-word',
              }}>
                <span style={{ color: '#666', fontSize: '11px' }}>{formatTimeShort(m.created_at)}</span>
                {flag && <span aria-hidden style={{ margin: '0 5px' }}>{flag}</span>}
                {!flag && ' '}
                <span style={{ color, fontWeight: 700 }}>&lt;{m.nickname}&gt;</span>
                <span style={{ color: '#666' }}>:</span>
                <span style={{ fontWeight: isOwn ? 700 : 400 }}> {m.body}</span>
              </div>
            );
          })}
        </div>

        <div className="shoutbox-sidebar" style={{ padding: '8px', fontSize: '11px' }}>
          <div style={{ fontWeight: 700, color: C_ACCENT_LINK, borderBottom: `1px solid ${C_BORDER}`, paddingBottom: 3, marginBottom: 5 }}>
            People Here: {viewers}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 240, overflowY: 'auto' }}>
            {mergedUsers.map((u) => (
              <div key={u.name} style={{ color: u.online ? C_ACCENT_LINK : '#999' }}>
                <span style={{ color: u.online ? '#22c55e' : '#bbb' }}>●</span> {u.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input row */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 8px',
        borderTop: `1px solid ${C_BORDER}`, background: '#f4f4f4',
      }}>
        <input
          type="text" value={nick}
          onChange={(e) => setNick(e.target.value.slice(0, 16))}
          placeholder="screen name"
          maxLength={16}
          style={{ width: 110, background: '#fff', border: `1px inset ${C_BORDER}`, color: C_FG, fontFamily: 'inherit', fontSize: 12, padding: '2px 4px', outline: 'none' }}
        />
        <input
          type="text" value={body}
          onChange={(e) => { clearError(); setBody(e.target.value.replace(/[\r\n]+/g, ' ').slice(0, MAX_BODY)); }}
          onKeyDown={onKey}
          placeholder="Type here..."
          maxLength={MAX_BODY}
          style={{ flex: 1, background: '#fff', border: `1px inset ${C_BORDER}`, color: C_FG, fontFamily: 'inherit', fontSize: 12, padding: '2px 4px', outline: 'none' }}
          autoComplete="off"
        />
        <button type="button" onClick={onSend} disabled={sending || cooldownRemaining > 0 || body.trim().length === 0} style={{
          background: C_TITLEBAR, color: '#fff', border: '1px outset #fff',
          padding: '2px 14px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', opacity: (sending || cooldownRemaining > 0 || body.trim().length === 0) ? 0.5 : 1,
        }}>
          {cooldownRemaining > 0 ? `${cooldownRemaining}s` : 'Send'}
        </button>
      </div>

      {/* Status */}
      <div style={{ padding: '3px 8px', fontSize: 10, color: error ? C_CLOSE : '#666', borderTop: `1px solid ${C_BORDER}` }}>
        {error ?? (cooldownRemaining > 0 ? t.rateLimited.replace('{n}', String(cooldownRemaining)) : 'Connected to superself chatroom')}
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
