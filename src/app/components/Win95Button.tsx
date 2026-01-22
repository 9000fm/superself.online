'use client';

import React from 'react';
import { WIN95_STYLES } from '../constants';

interface Win95ButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLButtonElement>) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  width?: string;
}

export default function Win95Button({
  onClick,
  onTouchStart,
  onTouchEnd,
  onMouseDown,
  children,
  type = 'button',
  disabled = false,
  style = {},
  className = '',
  width,
}: Win95ButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: '"MS Sans Serif", Arial, sans-serif',
    fontSize: '11px',
    color: disabled ? '#808080' : '#000',
    padding: '8px 24px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    touchAction: 'manipulation',
    ...WIN95_STYLES.button,
    ...(width && { width, minWidth: width, maxWidth: width, textAlign: 'center' as const }),
    ...style,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      disabled={disabled}
      className={`win-btn ${className}`}
      style={baseStyle}
    >
      {children}
    </button>
  );
}
