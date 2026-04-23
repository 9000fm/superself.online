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

// MSN palette — bg blends 50/50 with site theme.
const C_BG = 'color-mix(in srgb, #eaf4fd 50%, var(--background) 50%)';
const C_FG = '#0a0a0a';
const C_OWN = '#d5eafd';
const C_BORDER = '#9fb3c8';
const C_ONLINE = '#22c55e';

export default function VBMsnMessenger({ hook, language, onClose, onCycleSkin, skinLabel, onTitlebarDragStart, isDragging, positionStyle }: Props) {
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


  const titlebarBtn: React.CSSProperties = {
    width: 18, height: 16, padding: 0, cursor: 'pointer',
    background: 'rgba(255,255,255,0.2)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.35)',
    fontFamily: 'inherit', fontSize: 11, lineHeight: 1,
  };

  return (
    <div className="popup-window" style={{
      background: C_BG, color: C_FG,
      fontFamily: '"Trebuchet MS", Tahoma, sans-serif',
      border: `1px solid ${C_BORDER}`,
      width: 'min(820px, 96vw)',
      ...positionStyle,
    }}>
      {/* MSN titlebar */}
      <div
        onMouseDown={onTitlebarDragStart}
        onTouchStart={onTitlebarDragStart}
        style={{
          background: 'linear-gradient(180deg, #006e6a 0%, #0a9b94 100%)',
          color: '#fff', padding: '4px 6px',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12,
          cursor: onTitlebarDragStart ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: onTitlebarDragStart ? 'none' : undefined,
        }}
      >
        <span aria-hidden style={{
          width: 18, height: 18, background: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: '#006e6a', fontWeight: 800, fontSize: 9, letterSpacing: '-0.1em',
        }}>SSS</span>
        <span style={{ flex: 1, fontWeight: 700 }}>MSN Messenger — #chat</span>
        {onCycleSkin && (
          <button type="button" onClick={onCycleSkin}
            onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
            title={skinLabel} aria-label="change skin" style={titlebarBtn}>◐</button>
        )}
        <button type="button" onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
          aria-label="close" style={{ ...titlebarBtn, background: '#d93025' }}>×</button>
      </div>

      {/* Body */}
      <div className="shoutbox-body" style={{ display: 'grid', gridTemplateColumns: '4fr 1fr' }}>
        <div
          ref={logRef}
          onScroll={() => { const el = logRef.current; if (el) atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
          className="shoutbox-log"
          style={{ minHeight: 240, maxHeight: 360, overflowY: 'auto', padding: '8px 10px', fontSize: 13, lineHeight: 1.45, display: 'flex', flexDirection: 'column', gap: 8, borderRight: `1px solid ${C_BORDER}` }}
        >
          {!loaded && <div style={{ color: '#888' }}>...</div>}
          {loaded && messages.length === 0 && <div style={{ color: '#888' }}>{t.empty}</div>}
          {messages.map((m) => {
            const color = nickToColor(m.nickname);
            const flag = countryToFlag(m.country_code);
            const isOwn = ownIds.has(m.id);
            return (
              <div key={m.id} style={{
                padding: '4px 6px', borderRadius: 2,
                background: isOwn ? C_OWN : 'transparent',
              }}>
                <div style={{ fontSize: 12 }}>
                  <span style={{ color, fontWeight: 700 }}>{m.nickname}</span>
                  {flag && <span aria-hidden style={{ margin: '0 4px' }}>{flag}</span>}
                  <span style={{ color: '#666' }}> dice:</span>
                </div>
                <div style={{ paddingLeft: 14, wordBreak: 'break-word' }}>{m.body}</div>
              </div>
            );
          })}
        </div>

        <div className="shoutbox-sidebar" style={{ padding: 8, fontSize: 11 }}>
          <div style={{ fontWeight: 700, borderBottom: `1px solid ${C_BORDER}`, paddingBottom: 3, marginBottom: 5 }}>
            Contactos · {viewers}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
            {mergedUsers.map((u) => {
              const color = nickToColor(u.name);
              return (
                <div key={u.name} style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: u.online ? 1 : 0.55 }}>
                  <span aria-hidden style={{
                    width: 16, height: 16, background: color, color: '#fff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, border: '1px solid rgba(0,0,0,0.15)',
                    filter: u.online ? 'none' : 'grayscale(0.7)',
                  }}>{u.name[0]?.toUpperCase() ?? '?'}</span>
                  <span style={{ color: u.online ? C_ONLINE : '#aaa', fontSize: 9 }}>●</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${C_BORDER}`, background: '#fff', display: 'flex', gap: 6 }}>
        <input
          type="text" value={nick}
          onChange={(e) => setNick(e.target.value.slice(0, 16))}
          placeholder="tu nombre"
          maxLength={16}
          style={{ width: 110, border: `1px solid ${C_BORDER}`, fontFamily: 'inherit', fontSize: 12, padding: '3px 6px', outline: 'none', background: '#fff', color: C_FG }}
        />
        <input
          type="text" value={body}
          onChange={(e) => { clearError(); setBody(e.target.value.replace(/[\r\n]+/g, ' ').slice(0, MAX_BODY)); }}
          onKeyDown={onKey}
          placeholder="escribe un mensaje..."
          maxLength={MAX_BODY}
          style={{ flex: 1, border: `1px solid ${C_BORDER}`, fontFamily: 'inherit', fontSize: 13, padding: '3px 6px', outline: 'none', background: '#fff', color: C_FG }}
          autoComplete="off"
        />
        <button type="button" aria-label="wink" style={{
          width: 28, background: 'transparent', border: `1px solid ${C_BORDER}`, cursor: 'pointer',
        }}>😊</button>
        <button type="button" onClick={onSend} disabled={sending || cooldownRemaining > 0 || body.trim().length === 0} style={{
          background: '#006e6a', color: '#fff', border: 'none', padding: '0 14px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          opacity: (sending || cooldownRemaining > 0 || body.trim().length === 0) ? 0.5 : 1,
        }}>
          {cooldownRemaining > 0 ? `${cooldownRemaining}s` : 'Enviar'}
        </button>
      </div>
      <div style={{ padding: '2px 10px', fontSize: 10, color: error ? '#d93025' : '#666', borderTop: `1px solid ${C_BORDER}` }}>
        {error ?? (cooldownRemaining > 0 ? t.rateLimited.replace('{n}', String(cooldownRemaining)) : 'Estado: En línea')}
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
