'use client';

import React from 'react';
import { WIN_FONT, COLORS } from '../constants';

interface ToastProps {
  message: string;
  position: { x: number; y: number };
  visible: boolean;
  variant?: 'info' | 'error' | 'success';
}

export default function Toast({ message, position, visible, variant = 'info' }: ToastProps) {
  if (!visible) return null;

  const bgColors = {
    info: '#fff',
    error: '#fff',
    success: '#fff',
  };

  const textColors = {
    info: 'var(--accent, #0000FF)',
    error: 'var(--accent, #0000FF)',
    success: 'var(--accent, #0000FF)',
  };

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: position.y - 40,
        left: position.x,
        transform: 'translateX(-50%)',
        fontFamily: WIN_FONT,
        fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
        color: textColors[variant],
        backgroundColor: bgColors[variant],
        padding: '6px 14px',
        zIndex: 200,
        pointerEvents: 'none',
        animation: 'fadeInUp 0.2s ease-out',
      }}
    >
      {message}
    </div>
  );
}
