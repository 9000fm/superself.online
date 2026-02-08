'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
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

interface SfxPanelProps {
  onConfigChange: (overrides: Partial<Config>) => void;
  onPaletteChange: (palette: string) => void;
  onClose: () => void;
  onCapture: () => void;
}

/* ── Presets ─────────────────────────────────────────────── */

const PRESETS: Record<string, { macros: MacroState; palette: string }> = {
  INIT:   { macros: { ...MACRO_DEFAULTS }, palette: 'blocks' },
  CLEAN:  { macros: { DITHER: 0.2, MOTION: 0.3, GLOW: 0.2, TRAIL: 0.1, BURST: 0.1, PULSE: 0.2, GHOST: 0.1, NOISE: 0.1 }, palette: 'lines' },
  CHAOS:  { macros: { DITHER: 0.9, MOTION: 0.95, GLOW: 0.85, TRAIL: 0.9, BURST: 0.95, PULSE: 0.8, GHOST: 0.7, NOISE: 0.9 }, palette: 'signal' },
  VAPOR:  { macros: { DITHER: 0.6, MOTION: 0.3, GLOW: 0.8, TRAIL: 0.7, BURST: 0.2, PULSE: 0.6, GHOST: 0.8, NOISE: 0.3 }, palette: 'braille' },
  STATIC: { macros: { DITHER: 0.8, MOTION: 0.1, GLOW: 0.4, TRAIL: 0.2, BURST: 0.3, PULSE: 0.1, GHOST: 0.3, NOISE: 0.95 }, palette: 'binary' },
  DEEP:   { macros: { DITHER: 0.4, MOTION: 0.5, GLOW: 0.7, TRAIL: 0.8, BURST: 0.4, PULSE: 0.7, GHOST: 0.9, NOISE: 0.2 }, palette: 'circles' },
};

const PRESET_KEYS = Object.keys(PRESETS);

/* ── Signal status ───────────────────────────────────────── */

function getSignalStatus(macros: MacroState): { text: string; blink: boolean } {
  const avg = MACRO_NAMES.reduce((sum, n) => sum + macros[n], 0) / MACRO_NAMES.length * 100;
  if (avg <= 15) return { text: 'signal: dormant', blink: false };
  if (avg <= 35) return { text: 'signal: stable', blink: false };
  if (avg <= 55) return { text: 'signal: active', blink: false };
  if (avg <= 75) return { text: 'signal: volatile', blink: false };
  return { text: 'signal: overload', blink: true };
}

/* ── Component ───────────────────────────────────────────── */

export default function SfxPanel({ onConfigChange, onPaletteChange, onClose, onCapture }: SfxPanelProps) {
  const [macros, setMacros] = useState<MacroState>({ ...MACRO_DEFAULTS });
  const [palette, setPalette] = useState<string>(DEFAULT_PALETTE);
  const [preset, setPreset] = useState<string>('INIT');

  // Internal drag state — start at bottom-left
  const [pos, setPos] = useState<{ x: number; y: number | null }>({ x: 20, y: null });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const signal = useMemo(() => getSignalStatus(macros), [macros]);

  const handleMacroChange = useCallback((name: keyof MacroState, value: number) => {
    setMacros(prev => {
      const next = { ...prev, [name]: value };
      onConfigChange(computeConfigFromMacros(next));
      return next;
    });
    setPreset(''); // Clear preset indicator when manually changing
  }, [onConfigChange]);

  const handlePaletteChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPalette(val);
    onPaletteChange(val);
  }, [onPaletteChange]);

  const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    const p = PRESETS[key];
    if (!p) return;
    setPreset(key);
    setMacros({ ...p.macros });
    setPalette(p.palette);
    onConfigChange(computeConfigFromMacros(p.macros));
    onPaletteChange(p.palette);
  }, [onConfigChange, onPaletteChange]);

  const handleRandomize = useCallback(() => {
    const next = randomizeMacros();
    setMacros(next);
    onConfigChange(computeConfigFromMacros(next));
    // Also randomize palette
    const keys = PALETTE_KEYS.filter(k => k !== palette);
    const pick = keys[Math.floor(Math.random() * keys.length)];
    setPalette(pick);
    onPaletteChange(pick);
    setPreset('');
  }, [onConfigChange, onPaletteChange, palette]);

  const handleReset = useCallback(() => {
    const p = PRESETS.INIT;
    setMacros({ ...p.macros });
    setPalette(p.palette);
    setPreset('INIT');
    onConfigChange(computeConfigFromMacros(p.macros));
    onPaletteChange(p.palette);
  }, [onConfigChange, onPaletteChange]);

  // Ref to the panel wrapper for resolving bottom-anchored position
  const panelRef = useRef<HTMLDivElement>(null);

  // Titlebar drag handlers
  const handleTitlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    // Resolve actual top if panel is bottom-anchored
    let origY = pos.y ?? 0;
    if (pos.y === null && panelRef.current) {
      origY = panelRef.current.getBoundingClientRect().top;
      setPos(p => ({ ...p, y: origY }));
    }
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY,
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

  const selectStyle: React.CSSProperties = {
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
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: pos.x,
        ...(pos.y === null ? { bottom: 20 } : { top: pos.y }),
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
            sfx.exe
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
      <div style={{ padding: '8px 10px 10px' }}>
        {/* Preset row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '4px',
        }}>
          <span style={{ fontSize: '11px', flexShrink: 0 }}>PRESET</span>
          <select
            value={preset}
            onChange={handlePresetChange}
            style={selectStyle}
          >
            {preset === '' && <option value="">--</option>}
            {PRESET_KEYS.map(k => (
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

        {/* Palette row */}
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
            style={selectStyle}
          >
            {PALETTE_KEYS.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <Win95Button
            onClick={onCapture}
            style={{ padding: '2px 8px', fontSize: '11px' }}
          >
            pic
          </Win95Button>
        </div>

        {/* Groove separator */}
        <div style={{
          height: '1px',
          margin: '2px 0 4px',
          borderTop: '1px solid #808080',
          borderBottom: '1px solid #ffffff',
        }} />

        {/* All 8 macro sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {MACRO_NAMES.map(name => (
            <Win95Trackbar
              key={name}
              label={name}
              value={macros[name]}
              onChange={(v) => handleMacroChange(name, v)}
            />
          ))}
        </div>

        {/* Status line */}
        <div style={{
          marginTop: '6px',
          fontSize: '11px',
          fontFamily: '"MS Sans Serif", Arial, sans-serif',
          color: '#808080',
        }}>
          <span className={signal.blink ? 'blink-slow' : undefined}>
            {signal.text}
          </span>
        </div>
      </div>
    </div>
  );
}
