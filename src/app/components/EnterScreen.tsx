'use client';

import React from 'react';
import { WIN_FONT } from '../constants';

interface EnterScreenProps {
  displayText: string;
  onEnter: () => void;
}

export function EnterScreen({ displayText, onEnter }: EnterScreenProps) {
  return (
    <div
      onClick={onEnter}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 100,
        animation: 'fadeIn 0.4s ease-out',
      }}
    >
      <div
        style={{
          fontFamily: WIN_FONT,
          fontSize: 'clamp(3rem, 11vw, 6rem)',
          color: 'var(--foreground, #fff)',
          letterSpacing: '0.15em',
          textAlign: 'center',
          userSelect: 'none',
          minHeight: '1.2em',
        }}
      >
        {displayText}
        <span className="blink" style={{ opacity: displayText ? 1 : 0 }}>_</span>
      </div>
    </div>
  );
}
