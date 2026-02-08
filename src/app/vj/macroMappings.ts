import type { Config } from '../AsciiArt';
import { DEFAULTS } from '../AsciiArt';

export const MACRO_NAMES = [
  'DITHER', 'MOTION', 'GLOW', 'TRAIL',
  'BURST', 'PULSE', 'GHOST', 'NOISE',
] as const;

export type MacroName = (typeof MACRO_NAMES)[number];
export type MacroState = Record<MacroName, number>;

export const MACRO_DEFAULTS: MacroState = {
  DITHER: 0.5,
  MOTION: 0.5,
  GLOW: 0.5,
  TRAIL: 0.5,
  BURST: 0.5,
  PULSE: 0.5,
  GHOST: 0.5,
  NOISE: 0.5,
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
  // MOTION = old MOTION + SPEED
  MOTION: {
    waveSpeed1:      { low: 0.005, high: 0.25 },
    waveSpeed2:      { low: 0.005, high: 0.22 },
    waveSpeed3:      { low: 0.005, high: 0.24 },
    friction:        { low: 0.98,  high: 0.82 },
    pointerLerpRate: { low: 0.06,  high: 0.7 },
    blobLerp:        { low: 0.04,  high: 0.45 },
    blobFadeLerp:    { low: 0.02,  high: 0.35 },
    masterSpeed:     { low: 0.1,   high: 2.0 },
  },
  // GLOW (unchanged)
  GLOW: {
    blobHoverIntensity: { low: 0.1,  high: 2.8 },
    blobPressIntensity: { low: 0.2,  high: 3.5 },
    afterglowIntensity: { low: 0.05, high: 0.95 },
    trailIntensityMultiplier: { low: 0.15, high: 2.2 },
    scatterValueBoost:  { low: 0.1,  high: 1.8 },
    whiteBaseOpacity:   { low: 0.33, high: 0.66 },
    whitePulseAmount:   { low: 0.005, high: 0.15 },
  },
  // TRAIL (unchanged)
  TRAIL: {
    trailSpawnDistance:    { low: 3.5,   high: 0.4 },
    trailMaxLength:       { low: 20,    high: 250 },
    trailDecayPress:      { low: 0.06,  high: 0.006 },
    trailExpDecayBase:    { low: 0.93,  high: 0.997 },
    trailLinearDecayFloor: { low: 0.012, high: 0.0005 },
  },
  // BURST (unchanged)
  BURST: {
    scatterCount:              { low: 3,    high: 50 },
    scatterSpeed:              { low: 0.3,  high: 5.5 },
    scatterFriction:           { low: 0.97, high: 0.83 },
    scatterDecay:              { low: 0.008, high: 0.09 },
    scatterVelocityInheritance: { low: 0.05, high: 0.9 },
  },
  // PULSE (unchanged)
  PULSE: {
    pulseFreq1: { low: 0.15, high: 3.8 },
    pulseFreq2: { low: 0.2,  high: 3.5 },
    pulseFreq3: { low: 0.08, high: 2.5 },
    pulseMix1:  { low: 0.1,  high: 0.95 },
    pulseMix2:  { low: 0.05, high: 0.8 },
    pulseMix3:  { low: 0.05, high: 0.7 },
  },
  // GHOST = old GHOST + REACH
  GHOST: {
    afterglowDecay:       { low: 0.035, high: 0.001 },
    afterglowMorphAmp1:   { low: 0.2,   high: 5.5 },
    afterglowMorphAmp2:   { low: 0.1,   high: 4.5 },
    blobHoverRadiusFrac:  { low: 0.025, high: 0.25 },
    blobPressRadiusFrac:  { low: 0.006, high: 0.12 },
    trailRadiusFrac:      { low: 0.015, high: 0.18 },
    afterglowRadiusFrac:  { low: 0.015, high: 0.18 },
    puddleMaxRFrac:       { low: 0.015, high: 0.22 },
  },
  // NOISE = old DENSITY + COLOR + PUDDLE
  NOISE: {
    sparkleSpawnChance:  { low: 0.1,  high: 1.0 },
    sparkleMaxCount:     { low: 5,    high: 80 },
    sparkleDecayRate:    { low: 0.12, high: 0.02 },
    overlayHue:          { low: 180,  high: 330 },
    blueMaxOpacity:      { low: 0.1,  high: 0.85 },
    puddleStartRFrac:   { low: 0.001, high: 0.04 },
    puddleGrowFrames:   { low: 40,    high: 5 },
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

  return result as Partial<Config>;
}

/**
 * Generate random macro values (each 0-1).
 */
export function randomizeMacros(): MacroState {
  const state = { ...MACRO_DEFAULTS };
  for (const name of MACRO_NAMES) {
    state[name] = Math.random();
  }
  return state;
}

// Re-export for convenience
export { DEFAULTS };
