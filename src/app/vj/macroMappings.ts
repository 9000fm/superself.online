import type { Config } from '../AsciiArt';
import { DEFAULTS } from '../AsciiArt';

export const MACRO_NAMES = [
  'DITHER', 'MOTION', 'GLOW', 'TRAIL',
  'BURST', 'PULSE', 'GHOST',
  'DENSITY', 'WARP', 'FADE', 'SCALE',
  'ZOOM', 'INVERT', 'SCAN', 'VOID', 'DRIFT',
  'FOCUS', 'SHAPE',
] as const;

export type MacroName = (typeof MACRO_NAMES)[number];
export type MacroState = Record<MacroName, number>;

export const BOOLEAN_MACROS = new Set<MacroName>(['INVERT', 'SCAN']);

export const MACRO_DEFAULTS: MacroState = {
  DITHER: 0.5,
  MOTION: 0.5,
  GLOW: 0.5,
  TRAIL: 0.5,
  BURST: 0.5,
  PULSE: 0.5,
  GHOST: 0.5,
  DENSITY: 0.5,
  WARP: 0,
  FADE: 0.5,
  SCALE: 0.5,
  ZOOM: 0,
  INVERT: 0,
  SCAN: 0,
  VOID: 0,
  DRIFT: 0,
  FOCUS: 0,
  SHAPE: 0,
};

// Each macro maps to multiple Config keys.
// low = value at macro 0, high = value at macro 1.
// At 0.5, the result approximates DEFAULTS.
type Endpoint = { low: number; high: number };
type MacroEndpoints = Partial<Record<keyof Config, Endpoint>>;

const ENDPOINTS: Record<MacroName, MacroEndpoints> = {
  // DITHER = old TEXTURE
  DITHER: {
    waveFreq1:    { low: 2,    high: 25 },
    wavePhase1ny: { low: 0.5,  high: 10 },
    waveFreq2:    { low: 1,    high: 22 },
    wavePhase2ny: { low: 0.5,  high: 10 },
    waveFreq3ny:  { low: 1,    high: 25 },
    wavePhase3nx: { low: 0.3,  high: 9 },
    waveMix1:     { low: 0.8,  high: 0.3 },
    waveMix2:     { low: 0.1,  high: 0.5 },
    waveMix3:     { low: 0.1,  high: 0.4 },
    centerFadeFalloff: { low: 0.1, high: 0.9 },
  },
  // MOTION — wave speeds + physics (lerp/decay moved to FADE)
  MOTION: {
    waveSpeed1:      { low: 0.005, high: 0.20 },
    waveSpeed2:      { low: 0.005, high: 0.20 },
    waveSpeed3:      { low: 0.005, high: 0.22 },
    friction:        { low: 0.98,  high: 0.90 },
    pointerLerpRate: { low: 0.06,  high: 0.38 },
    masterSpeed:     { low: 0.1,   high: 1.8 },
  },
  // GLOW — intensities + sparkles
  GLOW: {
    blobHoverIntensity: { low: 0.1,  high: 4.0 },
    blobPressIntensity: { low: 0.2,  high: 5.0 },
    afterglowIntensity: { low: 0.05, high: 1.5 },
    trailIntensityMultiplier: { low: 0.15, high: 2.2 },
    scatterValueBoost:  { low: 0.1,  high: 1.8 },
    whiteBaseOpacity:   { low: 0.33, high: 0.66 },
    whitePulseAmount:   { low: 0.005, high: 0.15 },
    sparkleSpawnChance: { low: 0.1,  high: 1.0 },
    sparkleMaxCount:    { low: 5,    high: 150 },
  },
  // TRAIL — spawn distance + max length only (decay moved to FADE)
  TRAIL: {
    trailSpawnDistance:    { low: 3.5,   high: 1.175 },
    trailMaxLength:       { low: 20,    high: 192 },
  },
  // BURST — scatter + puddle (press-related)
  BURST: {
    scatterCount:              { low: 3,    high: 80 },
    scatterSpeed:              { low: 0.3,  high: 8.0 },
    scatterFriction:           { low: 0.97, high: 0.80 },
    scatterDecay:              { low: 0.005, high: 0.12 },
    scatterVelocityInheritance: { low: 0.05, high: 0.9 },
    blueMaxOpacity:            { low: 0.1,  high: 1.0 },
    puddleStartRFrac:          { low: 0.001, high: 0.04 },
    puddleGrowFrames:          { low: 40,    high: 5 },
  },
  // PULSE (reworked — subtler frequencies and mixes)
  PULSE: {
    pulseFreq1: { low: 0.15, high: 1.2 },
    pulseFreq2: { low: 0.2,  high: 1.0 },
    pulseFreq3: { low: 0.08, high: 0.6 },
    pulseMix1:  { low: 0.1,  high: 0.45 },
    pulseMix2:  { low: 0.05, high: 0.35 },
    pulseMix3:  { low: 0.05, high: 0.25 },
  },
  // GHOST — reduced radius highs (~40% smaller at midpoint), wider morph/decay
  GHOST: {
    afterglowDecay:       { low: 0.05,  high: 0.013 },
    afterglowMorphAmp1:   { low: 0.2,   high: 6.8 },
    afterglowMorphAmp2:   { low: 0.1,   high: 5.3 },
    blobHoverRadiusFrac:  { low: 0.025, high: 0.12 },
    blobPressRadiusFrac:  { low: 0.006, high: 0.054 },
    trailRadiusFrac:      { low: 0.015, high: 0.086 },
    afterglowRadiusFrac:  { low: 0.015, high: 0.086 },
    puddleMaxRFrac:       { low: 0.015, high: 0.10 },
  },
  // DENSITY — grid resolution / character size
  DENSITY: {
    fontSizeMultiplier: { low: 2.0, high: 0.5 },
  },
  // WARP — spatial wave distortion (tamed highs)
  WARP: {
    warpAmp:   { low: 0,   high: 2.5 },
    warpFreq:  { low: 1,   high: 4 },
    warpSpeed: { low: 0.1, high: 1.0 },
    warpMix:   { low: 0,   high: 0.5 },
  },
  // FADE — all lerp/decay/animation speed parameters
  FADE: {
    blobLerp:              { low: 0.02,  high: 0.35 },
    blobFadeLerp:          { low: 0.01,  high: 0.25 },
    opacityLerp:           { low: 0.02,  high: 0.25 },
    blueReleaseLerp:       { low: 0.02,  high: 0.2 },
    trailDecayPress:       { low: 0.01,  high: 0.08 },
    trailExpDecayBase:     { low: 0.99,  high: 0.90 },
    trailLinearDecayFloor: { low: 0.001, high: 0.015 },
    sparkleDecayRate:      { low: 0.02,  high: 0.15 },
  },
  // SCALE — universal radius multiplier
  SCALE: {
    radiusScale: { low: 0.2, high: 1.8 },
  },
  // ZOOM — stacks with fontSizeMultiplier for extreme sizes
  ZOOM: {
    zoomMultiplier: { low: 1.0, high: 5.0 },
  },
  // INVERT — flip character density mapping
  INVERT: {
    invertAmount: { low: 0, high: 1.0 },
  },
  // SCAN — CRT scanline effect (dim odd rows)
  SCAN: {
    scanAmount: { low: 0, high: 1.0 },
  },
  // VOID — threshold below which cells are blank
  VOID: {
    voidThreshold: { low: 0, high: 0.5 },
  },
  // DRIFT — constant spatial panning of sampling coordinates
  DRIFT: {
    driftSpeedX: { low: 0, high: 0.03 },
    driftSpeedY: { low: 0, high: 0.02 },
  },
  // FOCUS — spatial smoothing (reduces wave frequencies)
  FOCUS: {
    focusAmount: { low: 0, high: 1.0 },
  },
  // SHAPE — circle-to-square morphing of center fade
  SHAPE: {
    centerFadeShape: { low: 0, high: 1.0 },
  },
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const INTEGER_KEYS = new Set<string>(['scatterCount', 'trailMaxLength', 'puddleGrowFrames', 'sparkleMaxCount']);

/**
 * Compute a partial Config from the current macro state.
 * Each macro at 0.5 approximates DEFAULTS; moving toward 0 or 1
 * interpolates between carefully chosen low/high endpoints.
 */
export function computeConfigFromMacros(macros: MacroState): Partial<Config> {
  const result: Record<string, number> = {};

  for (const macroName of MACRO_NAMES) {
    const t = macros[macroName];
    const endpoints = ENDPOINTS[macroName];
    for (const [key, ep] of Object.entries(endpoints)) {
      const { low, high } = ep as Endpoint;
      let val = lerp(low, high, t);
      if (INTEGER_KEYS.has(key)) val = Math.round(val);
      result[key] = val;
    }
  }

  result['depthLevels'] = 16; // Always max fidelity
  return result as Partial<Config>;
}

/**
 * Generate random macro values (each 0-1).
 */
export function randomizeMacros(): MacroState {
  const state = { ...MACRO_DEFAULTS };
  for (const name of MACRO_NAMES) {
    state[name] = BOOLEAN_MACROS.has(name)
      ? (Math.random() > 0.5 ? 1 : 0)
      : Math.random();
  }
  return state;
}

// Re-export for convenience
export { DEFAULTS };
