'use client';

import { useRef, useCallback } from 'react';

interface Win95TrackbarProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
}

export default function Win95Trackbar({
  value,
  onChange,
  label,
  min = 0,
  max = 1,
  step = 0.01,
}: Win95TrackbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateValue = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(Math.max(min, Math.min(max, stepped)));
  }, [min, max, step, onChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValue(e.clientX);
  }, [updateValue]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    e.preventDefault();
    updateValue(e.clientX);
  }, [updateValue]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const pct = Math.round(((value - min) / (max - min)) * 100);
  const thumbPos = ((value - min) / (max - min)) * 100;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      height: '22px',
      userSelect: 'none',
    }}>
      {/* Label */}
      <span style={{
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: '11px',
        color: '#000',
        width: '52px',
        flexShrink: 0,
        textAlign: 'right',
      }}>
        {label}
      </span>

      {/* Track container — 44px tall touch target */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'relative',
          flex: 1,
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      >
        {/* Sunken groove */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#808080',
          boxShadow: 'inset 1px 1px 0 #404040, inset -1px -1px 0 #dfdfdf',
        }} />

        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${thumbPos}% - 5px)`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '11px',
          height: '21px',
          backgroundColor: '#c0c0c0',
          boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Center notch */}
          <div style={{
            width: '1px',
            height: '7px',
            backgroundColor: '#808080',
          }} />
        </div>
      </div>

      {/* Percentage — sunken readout */}
      <span style={{
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: '10px',
        color: '#000',
        width: '32px',
        flexShrink: 0,
        textAlign: 'center',
        backgroundColor: '#fff',
        border: '2px solid',
        borderColor: '#808080 #ffffff #ffffff #808080',
        padding: '1px 2px',
        lineHeight: '14px',
      }}>
        {pct}%
      </span>
    </div>
  );
}
