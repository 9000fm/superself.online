'use client';

import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { WIN_FONT } from '../constants';

interface ErrorScreenProps {
  language: Language;
  errorCode: string;
}

export function ErrorScreen({ language, errorCode }: ErrorScreenProps) {
  const t = translations[language];
  const winFont = WIN_FONT;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: winFont,
        color: 'white',
        width: 'clamp(320px, 90vw, 650px)',
        textAlign: 'center',
      }}
    >
      {/* ERROR header box */}
      <div
        style={{
          backgroundColor: '#C0C0C0',
          color: 'var(--accent, #0000FF)',
          padding: '0.2em 0.5em',
          marginBottom: '2.5rem',
          fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
          letterSpacing: '0.15em',
          fontWeight: 'bold',
        }}
      >
        {t.errorTitle}
      </div>

      {/* Error message */}
      <div
        style={{
          fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
          lineHeight: 1.8,
          letterSpacing: '0.03em',
        }}
      >
        {t.errorException}
        <br />
        {errorCode}.
        <br />
        {t.errorTerminated}
      </div>

      {/* Press any key */}
      <div
        style={{
          marginTop: '3rem',
          fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
          letterSpacing: '0.03em',
        }}
      >
        {t.errorPressKey}
        <span className="blink">_</span>
      </div>
    </div>
  );
}
