'use client';

import React, { useState, useEffect, useRef } from 'react';
import { mixes } from '../data/mixes';
import type { Language } from '../types';
import { WIN_FONT, SCRAMBLE_CHARS } from '../constants';
import { translations } from '../translations';

interface MixesProps {
  language: Language;
  onClose: () => void;
  position?: { x: number; y: number };
  isActive?: boolean;
  onActivate?: () => void;
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: boolean;
  transitionStyle?: React.CSSProperties;
  scrambledHeader?: string;
}

export default function Mixes({
  language,
  onClose,
  position = { x: 0, y: 0 },
  isActive = true,
  onActivate,
  onDragStart,
  isDragging = false,
  transitionStyle,
  scrambledHeader,
}: MixesProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [loadedIframes, setLoadedIframes] = useState<Record<number, boolean>>({});
  const t = translations[language];

  const prevLangRef = useRef<Language>(language);
  const [scrambledTitle, setScrambledTitle] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (prevLangRef.current !== language) {
      prevLangRef.current = language;

      const newTitle = t.mixesTitle;
      const baseChars = SCRAMBLE_CHARS.base;
      const jpChars = SCRAMBLE_CHARS.japanese;

      let frame = 0;
      const maxFrames = 8;

      const scrambleText = (text: string, locked: number) => {
        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < locked) {
            result += text[i];
          } else if (text[i] === ' ') {
            result += ' ';
          } else {
            const code = text.charCodeAt(i);
            const isWide = code > 0x7F;
            const chars = isWide ? jpChars : baseChars;
            result += chars[Math.floor(Math.random() * chars.length)];
          }
        }
        return result;
      };

      const interval = setInterval(() => {
        frame++;
        setScrambledTitle(scrambleText(newTitle, Math.floor((frame / maxFrames) * newTitle.length)));

        if (frame >= maxFrames) {
          clearInterval(interval);
          setScrambledTitle('');
        }
      }, 40);

      return () => {
        clearInterval(interval);
        setScrambledTitle('');
      };
    }
  }, [language, t]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: isMobile ? 'env(safe-area-inset-top, 20px)' : 0,
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 20px)' : 0,
        zIndex: isActive ? 160 : 90,
        pointerEvents: 'none',
      }}
    >
      <div
        className="popup-window"
        onMouseDown={() => onActivate?.()}
        onTouchStart={() => onActivate?.()}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...transitionStyle,
          backgroundColor: 'var(--popup-bg)',
          border: '1px solid var(--panel-border)',
          fontFamily: WIN_FONT,
          color: 'var(--popup-fg)',
          width: isMobile ? '92vw' : 'clamp(400px, 40vw, 520px)',
          maxWidth: '92vw',
          maxHeight: isMobile ? 'calc(100svh - 40px)' : undefined,
          position: position.x || position.y ? 'fixed' : 'relative',
          top: position.y || undefined,
          left: position.x || undefined,
          pointerEvents: 'auto',
          overflow: isMobile ? 'hidden auto' : 'hidden',
        }}
      >
        {/* Flat titlebar */}
        <div
          onMouseDown={(e) => { if (!isMobile && onDragStart) { e.preventDefault(); onDragStart(e); } }}
          onTouchStart={(e) => { if (onDragStart) { onDragStart(e); } }}
          style={{
            background: 'var(--titlebar-bg)',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
            borderBottom: '1px solid var(--panel-border)',
            touchAction: 'none',
          }}
        >
          <span style={{
            color: 'var(--titlebar-fg)',
            fontFamily: WIN_FONT,
            fontSize: '16px',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}>
            {scrambledTitle || t.mixesTitle}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            aria-label={t.close}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--titlebar-fg)',
              fontFamily: WIN_FONT,
              fontSize: '15px',
              cursor: 'pointer',
              padding: '2px 10px',
              lineHeight: 1.3,
              touchAction: 'manipulation',
              whiteSpace: 'nowrap',
            }}
          >
            [ {t.close.toLowerCase()} ]
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '16px 14px' : '20px 22px',
          animation: 'fadeIn 0.3s ease-out',
        }}>
          <div style={{ color: 'var(--panel-prompt)', marginBottom: '14px', letterSpacing: '0.04em' }}>## {(scrambledHeader && scrambledHeader.length > 0) ? scrambledHeader : t.mixes.replace('> ', '')}</div>

          {mixes.map((mix, idx) => (
            <div key={mix.id}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: isMobile ? '0.98rem' : '1.08rem',
                marginBottom: '10px',
                letterSpacing: '0.03em',
              }}>
                <span style={{ color: 'var(--panel-prompt)' }}>▸</span>
                <span>{mix.number} — {mix.artist}</span>
              </div>

              <div style={{
                border: '1px solid var(--panel-border)',
                background: 'rgba(0,0,0,0.4)',
                overflow: 'hidden',
                position: 'relative',
                minHeight: '120px',
              }}>
                {!loadedIframes[mix.id] && (
                  <div aria-hidden style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--panel-muted)',
                    fontFamily: WIN_FONT,
                    fontSize: '0.95em',
                    letterSpacing: '0.05em',
                    pointerEvents: 'none',
                  }}>
                    <span className="blink-slow">[ loading mix... ]</span>
                  </div>
                )}
                <iframe
                  width="100%"
                  height="120"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(mix.soundcloudUrl)}&color=%23ffffff&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`}
                  onLoad={() => setLoadedIframes(prev => ({ ...prev, [mix.id]: true }))}
                  style={{
                    display: 'block',
                    opacity: loadedIframes[mix.id] ? 1 : 0,
                    transition: 'opacity 300ms ease',
                  }}
                  title={`${mix.number} — ${mix.artist}`}
                />
              </div>

              {idx < mixes.length - 1 && (
                <div aria-hidden style={{
                  height: '1px',
                  background: 'var(--panel-divider)',
                  margin: '18px 0',
                }} />
              )}
            </div>
          ))}

          {/* Coming soon placeholder — soft hint that more is on the way */}
          <div aria-hidden style={{
            height: '1px',
            background: 'var(--panel-divider)',
            margin: '18px 0',
          }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: isMobile ? '0.98rem' : '1.08rem',
            color: 'var(--panel-muted)',
            letterSpacing: '0.03em',
          }}>
            <span>▸</span>
            <span>{String(mixes.length + 1).padStart(3, '0')} — [ coming soon ]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
