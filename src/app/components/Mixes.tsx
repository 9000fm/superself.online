'use client';

import React, { useState, useEffect, useRef } from 'react';
import { mixes } from '../data/mixes';
import type { Language } from '../types';
import { WIN_FONT, WIN95_STYLES, SCRAMBLE_CHARS } from '../constants';
import { translations } from '../translations';

interface MixesProps {
  language: Language;
  onClose: () => void;
  position?: { x: number; y: number };
  isActive?: boolean;
  onActivate?: () => void;
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  isDragging?: boolean;
}

export default function Mixes({
  language,
  onClose,
  position = { x: 0, y: 0 },
  isActive = true,
  onActivate,
  onDragStart,
  isDragging = false,
}: MixesProps) {
  const [isMobile, setIsMobile] = useState(false);
  const t = translations[language];

  // Scramble effect state
  const prevLangRef = useRef<Language>(language);
  const [scrambledTitle, setScrambledTitle] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Language change scramble effect
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
          backgroundColor: 'var(--win95-bg, #c0c0c0)',
          border: '2px solid',
          borderColor: 'var(--win95-highlight, #dfdfdf) var(--win95-shadow, #0a0a0a) var(--win95-shadow, #0a0a0a) var(--win95-highlight, #dfdfdf)',
          boxShadow: '2px 2px 0 #000',
          fontFamily: WIN_FONT,
          color: 'var(--win95-text, #000)',
          width: isMobile ? '92vw' : 'clamp(380px, 32vw, 480px)',
          maxWidth: '92vw',
          position: position.x || position.y ? 'fixed' : 'relative',
          top: position.y || undefined,
          left: position.x || undefined,
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Win95 Title Bar */}
        <div
          onMouseDown={(e) => { if (!isMobile && onDragStart) { e.preventDefault(); onDragStart(e); } }}
          style={{
            background: WIN95_STYLES.titlebarGradient,
            padding: '4px 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {/* Music note icon */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginTop: '-1px' }}>
              <path d="M6 2v9a3 3 0 1 0 2 0V4h4V2H6z" fill="#fff" stroke="var(--win95-text, #000)" strokeWidth="0.5"/>
            </svg>
            <span style={{
              color: 'white',
              fontFamily: 'Segoe UI, Tahoma, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              {scrambledTitle || t.mixesTitle}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              width: '22px',
              height: '20px',
              backgroundColor: 'var(--win95-bg, #c0c0c0)',
              border: 'none',
              boxShadow: 'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf), inset -2px -2px 0 var(--win95-dark, #808080), inset 2px 2px 0 var(--win95-highlight, #dfdfdf)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg width="10" height="9" viewBox="0 0 8 7" fill="none">
              <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="var(--win95-text, #000)"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: isMobile ? '12px' : '16px' }}>
          {mixes.map((mix) => (
            <div key={mix.id} style={{ marginBottom: '16px' }}>
              {/* Mix label */}
              <div style={{
                fontFamily: WIN_FONT,
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'var(--win95-text, #000)',
                marginBottom: '10px',
                letterSpacing: '0.05em',
              }}>
                ▶ {mix.number} — {mix.artist}
              </div>

              {/* SoundCloud embed — compact waveform player */}
              <div style={{
                border: '2px inset var(--win95-dark, #808080)',
                backgroundColor: '#000',
                overflow: 'hidden',
              }}>
                <iframe
                  width="100%"
                  height="120"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(mix.soundcloudUrl)}&color=%230000ff&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`}
                  style={{ display: 'block' }}
                  title={`${mix.number} — ${mix.artist}`}
                />
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
