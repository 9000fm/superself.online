'use client';

import { useState, useRef, useCallback } from 'react';
import { WIN95_STYLES } from '../constants';
import Win95Trackbar from './Win95Trackbar';
import Win95Button from './Win95Button';
import {
  MACRO_NAMES,
  MACRO_DEFAULTS,
  computeConfigFromMacros,
  randomizeMacros,
} from '../vj';
import type { MacroState } from '../vj';
import { PALETTE_KEYS, DEFAULT_PALETTE } from '../AsciiArt';
import type { Config } from '../AsciiArt';

interface VJPanelProps {
  onConfigChange: (overrides: Partial<Config>) => void;
  onPaletteChange: (palette: string) => void;
  onClose: () => void;
}

const ORIGINAL_COUNT = 8; // TEXTURE..PULSE

export default function VJPanel({ onConfigChange, onPaletteChange, onClose }: VJPanelProps) {
  const [macros, setMacros] = useState<MacroState>({ ...MACRO_DEFAULTS });
  const [palette, setPalette] = useState<string>(DEFAULT_PALETTE);

  // Internal drag state
  const [pos, setPos] = useState({ x: 20, y: 80 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const handleMacroChange = useCallback((name: keyof MacroState, value: number) => {
    setMacros(prev => {
      const next = { ...prev, [name]: value };
      onConfigChange(computeConfigFromMacros(next));
      return next;
    });
  }, [onConfigChange]);

  const handlePaletteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPalette(val);
    onPaletteChange(val);
  }, [onPaletteChange]);

  const handleRandomize = useCallback(() => {
    const next = randomizeMacros();
    setMacros(next);
    onConfigChange(computeConfigFromMacros(next));
    // Also randomize palette
    const keys = PALETTE_KEYS.filter(k => k !== palette);
    const pick = keys[Math.floor(Math.random() * keys.length)];
    setPalette(pick);
    onPaletteChange(pick);
  }, [onConfigChange, onPaletteChange, palette]);

  const handleReset = useCallback(() => {
    const next = { ...MACRO_DEFAULTS };
    setMacros(next);
    setPalette(DEFAULT_PALETTE);
    onConfigChange(computeConfigFromMacros(next));
    onPaletteChange(DEFAULT_PALETTE);
  }, [onConfigChange, onPaletteChange]);

  // Titlebar drag handlers
  const handleTitlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  }, [pos]);

  const handleTitlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: dragRef.current.origX + dx,
      y: dragRef.current.origY + dy,
    });
  }, []);

  const handleTitlePointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const originalMacros = MACRO_NAMES.slice(0, ORIGINAL_COUNT);
  const newMacros = MACRO_NAMES.slice(ORIGINAL_COUNT);

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: '350px',
        maxWidth: 'calc(100vw - 20px)',
        zIndex: 170,
        backgroundColor: '#c0c0c0',
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: '11px',
        color: '#000',
        ...WIN95_STYLES.windowBorder,
      }}
    >
      {/* Titlebar */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
        style={{
          background: WIN95_STYLES.titlebarGradient,
          padding: '3px 4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: dragRef.current ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', flex: 1 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            style={{ marginTop: '-1px', flexShrink: 0 }}
          >
            <rect x="1" y="3" width="14" height="10" fill="#c0c0c0" stroke="#000" strokeWidth="1" />
            <rect x="3" y="5" width="10" height="6" fill="#000080" />
            <rect x="0" y="12" width="16" height="3" fill="#808080" />
          </svg>
          <span style={{
            color: 'white',
            fontFamily: 'Segoe UI, Tahoma, sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            ctrl.exe
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            width: '22px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            touchAction: 'manipulation',
            backgroundColor: '#c0c0c0',
            border: 'none',
            boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
          }}
        >
          <svg width="10" height="9" viewBox="0 0 8 7" fill="none">
            <path
              d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z"
              fill="#000"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '6px 8px 8px' }}>
        {/* Palette row + action buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '6px',
        }}>
          <span style={{ fontSize: '11px', flexShrink: 0 }}>PALETTE</span>
          <select
            value={palette}
            onChange={handlePaletteChange}
            style={{
              flex: 1,
              backgroundColor: '#fff',
              border: '2px solid',
              borderColor: '#808080 #ffffff #ffffff #808080',
              fontFamily: '"MS Sans Serif", Arial, sans-serif',
              fontSize: '11px',
              color: '#000',
              padding: '2px 4px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {PALETTE_KEYS.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <Win95Button
            onClick={handleRandomize}
            style={{ padding: '2px 8px', fontSize: '11px' }}
          >
            ?
          </Win95Button>
          <Win95Button
            onClick={handleReset}
            style={{ padding: '2px 8px', fontSize: '11px' }}
          >
            {'<<'}
          </Win95Button>
        </div>

        {/* Original macro sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {originalMacros.map(name => (
            <Win95Trackbar
              key={name}
              label={name}
              value={macros[name]}
              onChange={(v) => handleMacroChange(name, v)}
            />
          ))}
        </div>

        {/* Win95 groove separator */}
        <div style={{
          height: '2px',
          margin: '6px 0',
          borderTop: '1px solid #808080',
          borderBottom: '1px solid #ffffff',
        }} />

        {/* New macro sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {newMacros.map(name => (
            <Win95Trackbar
              key={name}
              label={name}
              value={macros[name]}
              onChange={(v) => handleMacroChange(name, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
