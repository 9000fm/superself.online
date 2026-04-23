'use client';

import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../types';
import { translations } from '../../translations';
import type { UseShoutboxResult } from '../../hooks/useShoutbox';
import { MAX_BODY, NICK_STORAGE_KEY, formatTimeShort } from '../../lib/shoutbox-helpers';

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

// IRC bg blends 50/50 with site theme — dark purple on purple site, grey on white, near-black on dark.
const C_BG = 'color-mix(in srgb, #0c0c0c 50%, var(--background) 50%)';
// IRC primary text follows the site's theme foreground (white on dark, user-fg on color, black on white).
const C_FG = 'var(--foreground)';
const C_AMBER = '#ffae00';
const C_DIM = '#6a6a6a';
const C_OWN = '#ffae00';

const IRC_COLORS = ['var(--foreground)', '#00e7ff', '#ffd500', '#ff2fe6'] as const;
function ircColor(nick: string): string {
  let h = 5381;
  for (let i = 0; i < nick.length; i++) h = ((h << 5) + h + nick.charCodeAt(i)) | 0;
  return IRC_COLORS[Math.abs(h) % IRC_COLORS.length];
}

export default function VCIrcTerminal({ hook, language, onClose, onCycleSkin, skinLabel, onTitlebarDragStart, isDragging, positionStyle }: Props) {
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
      border: `1px solid ${C_FG}`,
      width: 'min(820px, 96vw)',
      ...positionStyle,
    }}>
      {/* Single header line */}
      <div
        onMouseDown={onTitlebarDragStart}
        onTouchStart={onTitlebarDragStart}
        style={{
          padding: '6px 10px', fontSize: 13,
          borderBottom: `1px dashed ${C_DIM}`,
          display: 'flex', gap: 10, alignItems: 'center',
          cursor: onTitlebarDragStart ? (isDragging ? 'grabbing' : 'grab') : 'default',
          touchAction: onTitlebarDragStart ? 'none' : undefined,
        }}
      >
        <span>— [ <span style={{ color: C_AMBER }}>#superself</span> ]</span>
        <span>[ {viewers} USERS ]</span>
        <span style={{ flex: 1 }} />
        {onCycleSkin && (
          <button type="button" onClick={onCycleSkin}
            onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
            title={skinLabel} aria-label="change skin" style={{
            background: 'transparent', border: 'none', color: C_FG,
            fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
            padding: 0, marginRight: 10,
          }}>[ SKIN ]</button>
        )}
        <button type="button" onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}
          aria-label="disconnect" style={{
          background: 'transparent', border: 'none', color: C_AMBER,
          fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
          padding: 0,
        }}>[ DISCONNECT ]</button>
      </div>

      {/* /names line */}
      <div style={{ padding: '4px 10px', fontSize: 12, color: C_DIM, borderBottom: `1px dashed ${C_DIM}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Users on #superself:{' '}
        {mergedUsers.map((u, i) => (
          <span key={u.name} style={{ color: u.online ? C_FG : C_DIM, opacity: u.online ? 1 : 0.7 }}>
            {i > 0 && <span style={{ color: C_DIM }}>, </span>}
            {u.online ? u.name : `(${u.name})`}
          </span>
        ))} <span style={{ color: C_DIM }}>({viewers} online · {mergedUsers.length} total)</span>
      </div>

      {/* Log */}
      <div
        ref={logRef}
        onScroll={() => { const el = logRef.current; if (el) atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}
        style={{
          minHeight: 240, maxHeight: 360, overflowY: 'auto',
          padding: '8px 10px', fontSize: 13, lineHeight: 1.4,
          display: 'flex', flexDirection: 'column', gap: 2,
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

      {/* Prompt */}
      <div style={{
        padding: '6px 10px', borderTop: `1px dashed ${C_DIM}`,
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
          placeholder="type command or message..."
          maxLength={MAX_BODY}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C_FG, fontFamily: 'inherit', fontSize: 13, padding: 0 }}
          autoComplete="off"
        />
        <span className="blink-slow" style={{ color: C_FG }}>_</span>
      </div>

      <div style={{ padding: '3px 10px', fontSize: 11, color: error ? '#ff5555' : C_DIM, borderTop: `1px dashed ${C_DIM}` }}>
        {error ?? (cooldownRemaining > 0 ? `-- flood protection · wait ${cooldownRemaining}s --` : '-- enter to send · ESC to disconnect --')}
      </div>

      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
    </div>
  );
}
