'use client';

import { useRef, useCallback, useState } from 'react';

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
  const [isDragging, setIsDragging] = useState(false);

  const snapToNearest5 = useCallback((raw: number) => {
    // Snap to nearest 5% if within 2% on release
    const pct = ((raw - min) / (max - min)) * 100;
    const nearest5 = Math.round(pct / 5) * 5;
    if (Math.abs(pct - nearest5) <= 2) {
      return min + (nearest5 / 100) * (max - min);
    }
    return raw;
  }, [min, max]);

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
    setIsDragging(true);
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
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    // Snap on release
    const snapped = snapToNearest5(value);
    if (snapped !== value) {
      onChange(Math.max(min, Math.min(max, snapped)));
    }
  }, [snapToNearest5, value, onChange, min, max]);

  const intVal = Math.round(((value - min) / (max - min)) * 100);
  const thumbPos = ((value - min) / (max - min)) * 100;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: '34px',
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
        textTransform: 'uppercase',
      }}>
        {label}
      </span>

      {/* Track container */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'relative',
          flex: 1,
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          touchAction: 'none',
        }}
      >
        {/* Tick marks above the track */}
        <div style={{
          position: 'absolute',
          top: '3px',
          left: 0,
          right: 0,
          height: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}>
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              style={{
                width: '1px',
                height: '4px',
                backgroundColor: '#808080',
              }}
            />
          ))}
        </div>

        {/* Track background (sunken) */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#fff',
          boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #dfdfdf',
          position: 'relative',
        }}>
          {/* Filled portion */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${thumbPos}%`,
            height: '100%',
            backgroundColor: '#000080',
          }} />
        </div>

        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${thumbPos}% - 5px)`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '11px',
          height: '18px',
          backgroundColor: '#c0c0c0',
          boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
        }}>
          {/* Center grip lines */}
          <div style={{ width: '5px', height: '1px', backgroundColor: '#808080' }} />
          <div style={{ width: '5px', height: '1px', backgroundColor: '#fff' }} />
        </div>

        {/* Tooltip while dragging */}
        {isDragging && (
          <div style={{
            position: 'absolute',
            left: `calc(${thumbPos}% - 14px)`,
            top: '-20px',
            backgroundColor: '#ffffe1',
            border: '1px solid #000',
            padding: '1px 4px',
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            fontSize: '10px',
            color: '#000',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            {intVal}
          </div>
        )}
      </div>

      {/* Integer readout (0-100) */}
      <span style={{
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: '11px',
        color: '#000',
        width: '26px',
        flexShrink: 0,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {intVal}
      </span>
    </div>
  );
}
