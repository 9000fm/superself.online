'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { WIN95_STYLES } from '../constants';
import Win95Trackbar from './Win95Trackbar';
import Win95Checkbox from './Win95Checkbox';
import Win95Button from './Win95Button';
import {
  MACRO_NAMES,
  MACRO_DEFAULTS,
  BOOLEAN_MACROS,
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
  CLEAN:  { macros: { DITHER: 0.2, MOTION: 0.3, GLOW: 0.2, TRAIL: 0.1, BURST: 0.1, PULSE: 0.2, GHOST: 0.1, DENSITY: 0.5, WARP: 0.0, FADE: 0.6, SCALE: 0.4, ZOOM: 0, INVERT: 0, SCAN: 0, VOID: 0, DRIFT: 0.1, FOCUS: 0.3, SHAPE: 0 }, palette: 'code' },
  CHAOS:  { macros: { DITHER: 0.9, MOTION: 0.95, GLOW: 0.85, TRAIL: 0.9, BURST: 0.95, PULSE: 0.8, GHOST: 0.7, DENSITY: 0.7, WARP: 0.8, FADE: 0.8, SCALE: 0.7, ZOOM: 0.5, INVERT: 0, SCAN: 0, VOID: 0.2, DRIFT: 0.6, FOCUS: 0.1, SHAPE: 0.7 }, palette: 'signal' },
  VAPOR:  { macros: { DITHER: 0.6, MOTION: 0.3, GLOW: 0.8, TRAIL: 0.7, BURST: 0.2, PULSE: 0.6, GHOST: 0.8, DENSITY: 0.4, WARP: 0.4, FADE: 0.3, SCALE: 0.6, ZOOM: 0.2, INVERT: 0, SCAN: 0, VOID: 0.1, DRIFT: 0.4, FOCUS: 0.6, SHAPE: 0.3 }, palette: 'braille' },
  STATIC: { macros: { DITHER: 0.8, MOTION: 0.1, GLOW: 0.4, TRAIL: 0.2, BURST: 0.3, PULSE: 0.1, GHOST: 0.3, DENSITY: 0.5, WARP: 0.1, FADE: 0.4, SCALE: 0.5, ZOOM: 0.1, INVERT: 1, SCAN: 1, VOID: 0.3, DRIFT: 0, FOCUS: 0.2, SHAPE: 0.5 }, palette: 'binary' },
  DEEP:   { macros: { DITHER: 0.4, MOTION: 0.5, GLOW: 0.7, TRAIL: 0.8, BURST: 0.4, PULSE: 0.7, GHOST: 0.9, DENSITY: 0.3, WARP: 0.6, FADE: 0.2, SCALE: 0.65, ZOOM: 0.3, INVERT: 0, SCAN: 0, VOID: 0.15, DRIFT: 0.3, FOCUS: 0.4, SHAPE: 0 }, palette: 'code' },
  PULSE:  { macros: { DITHER: 0.4, MOTION: 0.6, GLOW: 0.8, TRAIL: 0.5, BURST: 0.3, PULSE: 0.95, GHOST: 0.5, DENSITY: 0.5, WARP: 0.1, FADE: 0.4, SCALE: 0.5, ZOOM: 0.15, INVERT: 0, SCAN: 0, VOID: 0.05, DRIFT: 0.2, FOCUS: 0.3, SHAPE: 0 }, palette: 'signal' },
  DRIFT:  { macros: { DITHER: 0.3, MOTION: 0.2, GLOW: 0.5, TRAIL: 0.85, BURST: 0.1, PULSE: 0.3, GHOST: 0.7, DENSITY: 0.4, WARP: 0.2, FADE: 0.2, SCALE: 0.55, ZOOM: 0.1, INVERT: 0, SCAN: 0, VOID: 0.05, DRIFT: 0.8, FOCUS: 0.5, SHAPE: 0 }, palette: 'braille' },
  VOID:   { macros: { DITHER: 0.3, MOTION: 0.3, GLOW: 0.1, TRAIL: 0.3, BURST: 0.2, PULSE: 0.2, GHOST: 0.4, DENSITY: 0.2, WARP: 0.15, FADE: 0.2, SCALE: 0.4, ZOOM: 0.1, INVERT: 1, SCAN: 0, VOID: 0.7, DRIFT: 0.1, FOCUS: 0.2, SHAPE: 0.8 }, palette: 'slash' },
  GLITCH: { macros: { DITHER: 0.7, MOTION: 0.5, GLOW: 0.4, TRAIL: 0.1, BURST: 0.5, PULSE: 0.3, GHOST: 0.1, DENSITY: 0.5, WARP: 0.9, FADE: 0.6, SCALE: 0.5, ZOOM: 0.6, INVERT: 0, SCAN: 1, VOID: 0.15, DRIFT: 0.3, FOCUS: 0.1, SHAPE: 0.6 }, palette: 'binary' },
  MATRIX: { macros: { DITHER: 0.5, MOTION: 0.9, GLOW: 0.5, TRAIL: 0.6, BURST: 0.15, PULSE: 0.4, GHOST: 0.4, DENSITY: 0.6, WARP: 0.2, FADE: 0.5, SCALE: 0.5, ZOOM: 0.2, INVERT: 0, SCAN: 0, VOID: 0, DRIFT: 0.7, FOCUS: 0.2, SHAPE: 0.4 }, palette: 'katakana' },
};

const PRESET_KEYS = Object.keys(PRESETS);

/* ── Component ───────────────────────────────────────────── */

export default function SfxPanel({ onConfigChange, onPaletteChange, onClose, onCapture }: SfxPanelProps) {
  const [macros, setMacros] = useState<MacroState>({ ...MACRO_DEFAULTS });
  const [palette, setPalette] = useState<string>(DEFAULT_PALETTE);
  const [preset, setPreset] = useState<string>('INIT');

  // Internal drag state — start centered horizontally, bottom-anchored
  const [pos, setPos] = useState<{ x: number; y: number | null }>({
    x: typeof window !== 'undefined' ? Math.max(20, (window.innerWidth - 350) / 2) : 20,
    y: null,
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Clamp position on viewport resize
  useEffect(() => {
    const clamp = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setPos(prev => {
        const ny = prev.y !== null ? Math.min(prev.y, vh - 50) : prev.y;
        const nx = Math.min(prev.x, vw - 100);
        if (nx !== prev.x || ny !== prev.y) return { x: Math.max(0, nx), y: ny !== null ? Math.max(0, ny) : null };
        return prev;
      });
    };
    window.addEventListener('resize', clamp);
    window.addEventListener('orientationchange', clamp);
    return () => {
      window.removeEventListener('resize', clamp);
      window.removeEventListener('orientationchange', clamp);
    };
  }, []);

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
    borderColor: 'var(--win95-dark, #808080) var(--win95-highlight, #dfdfdf) var(--win95-highlight, #dfdfdf) var(--win95-dark, #808080)',
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
        backgroundColor: 'var(--win95-bg, #c0c0c0)',
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        fontSize: '11px',
        color: 'var(--win95-text, #000)',
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
            <rect x="1" y="3" width="14" height="10" fill="var(--win95-bg, #c0c0c0)" stroke="var(--win95-text, #000)" strokeWidth="1" />
            <rect x="3" y="5" width="10" height="6" fill="var(--nav-hover-fg, #000080)" />
            <rect x="0" y="12" width="16" height="3" fill="var(--win95-dark, #808080)" />
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
            backgroundColor: 'var(--win95-bg, #c0c0c0)',
            border: 'none',
            boxShadow: 'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf), inset -2px -2px 0 var(--win95-dark, #808080), inset 2px 2px 0 var(--win95-highlight, #dfdfdf)',
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

      {/* Content */}
      <div style={{ padding: '6px 8px 8px' }}>
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
            aria-label="Preset"
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
            aria-label="Randomize"
          >
            ?
          </Win95Button>
          <Win95Button
            onClick={handleReset}
            style={{ padding: '2px 8px', fontSize: '11px' }}
            aria-label="Reset"
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
            aria-label="Palette"
            style={selectStyle}
          >
            {PALETTE_KEYS.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <Win95Button
            onClick={onCapture}
            style={{ padding: '2px 8px', fontSize: '11px' }}
            aria-label="Capture screenshot"
          >
            pic
          </Win95Button>
        </div>

        {/* Groove separator */}
        <div style={{
          height: '1px',
          margin: '1px 0 3px',
          borderTop: '1px solid var(--win95-dark, #808080)',
          borderBottom: '1px solid var(--win95-highlight, #dfdfdf)',
        }} />

        {/* Macro sliders */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: '8px',
          rowGap: '0px',
        }}>
          {MACRO_NAMES.filter(name => !BOOLEAN_MACROS.has(name)).map(name => (
            <Win95Trackbar
              key={name}
              label={name}
              value={macros[name]}
              onChange={(v) => handleMacroChange(name, v)}
            />
          ))}
        </div>

        {/* Boolean checkboxes */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '4px',
        }}>
          {MACRO_NAMES.filter(name => BOOLEAN_MACROS.has(name)).map(name => (
            <Win95Checkbox
              key={name}
              label={name}
              checked={macros[name] >= 0.5}
              onChange={(checked) => handleMacroChange(name, checked ? 1 : 0)}
            />
          ))}
        </div>

        {/* Status line */}
        <div style={{
          marginTop: '4px',
          fontSize: '11px',
          fontFamily: '"MS Sans Serif", Arial, sans-serif',
          color: 'var(--win95-dark, #808080)',
        }}>
          PALETTE: {palette}
        </div>
      </div>
    </div>
  );
}
