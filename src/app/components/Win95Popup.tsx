'use client';

import React from 'react';
import { ActiveWindow } from '../types';
import { WIN_FONT } from '../constants';

interface Win95PopupProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  position: { x: number; y: number };
  width?: string;
  windowId?: 'welcome' | 'about' | 'shop';
  activeWindow: ActiveWindow;
  onActivate: () => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  isDragging: boolean;
}

export function Win95Popup({
  title,
  children,
  onClose,
  position,
  width = '340px',
  windowId = 'welcome',
  activeWindow,
  onActivate,
  onDragStart,
  isDragging,
}: Win95PopupProps) {
  return (
    <div
      className="popup-window"
      onMouseDown={onActivate}
      style={{
        position: 'fixed',
        top: position.y || '50%',
        left: position.x || '50%',
        transform: position.x || position.y ? 'none' : 'translate(-50%, -50%)',
        zIndex: activeWindow === windowId ? 160 : 150,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--win95-bg, #c0c0c0)',
          border: '2px solid',
          borderColor: 'var(--win95-highlight, #dfdfdf) var(--win95-shadow, #0a0a0a) var(--win95-shadow, #0a0a0a) var(--win95-highlight, #dfdfdf)',
          boxShadow: '1px 1px 0 #000',
          width,
          minWidth: width,
          maxWidth: width,
        }}
      >
        {/* Titlebar - only this is draggable */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            onDragStart(e);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            onDragStart(e);
          }}
          style={{
            background: 'var(--win95-title, linear-gradient(90deg, #000080, #1084d0))',
            padding: '4px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{ marginTop: '-1px', flexShrink: 0 }}
            >
              <rect x="1" y="3" width="14" height="10" fill="var(--win95-bg, #c0c0c0)" stroke="var(--win95-text, #000)" strokeWidth="1" />
              <rect x="3" y="5" width="10" height="6" fill="var(--nav-hover-fg, #000080)" />
              <rect x="0" y="12" width="16" height="3" fill="var(--win95-dark, #808080)" />
            </svg>
            <span
              style={{
                color: 'white',
                fontFamily: 'Segoe UI, Tahoma, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{
              width: '22px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              touchAction: 'manipulation',
              backgroundColor: 'var(--win95-bg, #c0c0c0)',
              border: 'none',
              boxShadow:
                'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf), inset -2px -2px 0 var(--win95-dark, #808080), inset 2px 2px 0 var(--win95-highlight, #dfdfdf)',
            }}
          >
            <svg width="10" height="9" viewBox="0 0 8 7" fill="none">
              <path
                d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z"
                fill="var(--win95-text, #000)"
              />
            </svg>
          </button>
        </div>
        <div style={{ padding: '16px 20px' }}>{children}</div>
      </div>
    </div>
  );
}
