'use client';

import { useEffect, useState, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

interface AsciiArtProps {
  color?: string;
  isVisible?: boolean;
  configOverrides?: Partial<Config>;
  paletteOverride?: string;
}

interface Sparkle {
  x: number;
  y: number;
  life: number;
  char: string;
}

interface TrailPoint {
  x: number;
  y: number;
  life: number;
  intensity: number;
}

interface ScatterParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  char: string;
}

// Pre-calculated sine lookup table (360 values)
const SINE_TABLE: number[] = [];
for (let i = 0; i < 360; i++) {
  SINE_TABLE[i] = Math.sin((i * Math.PI) / 180);
}

const fastSin = (angle: number): number => {
  const idx = Math.floor(((angle % (2 * Math.PI)) / (2 * Math.PI)) * 360);
  return SINE_TABLE[(idx + 360) % 360];
};

// ─── Character palette presets ───
interface Palette {
  blocks: string[];   // 16 chars — main gradient
  puddle: string[];   // 10 chars — press-hold zone
  sparkle: string[];  //  5 chars — random sparkles
  scatter: string[];  //  6 chars — burst particles
}

export const PALETTES: Record<string, Palette> = {
  blocks: {
    blocks:  [' ','·','·','░','░','▒','▒','▓','█','█','▓','▒','▒','░','░','·'],
    puddle:  [' ','░','▒','▒','▓','▓','▓','█','█','█'],
    sparkle: ['*','+','░','▒','#'],
    scatter: ['█','▓','▒','#','*','+'],
  },
  katakana: {
    blocks:  [' ','ｦ','ｱ','ｳ','ｴ','ｶ','ｷ','ｹ','ｺ','ﾀ','ﾁ','ﾄ','ﾅ','ﾆ','ﾇ','ﾈ'],
    puddle:  [' ','ｦ','ｱ','ｳ','ｴ','ｶ','ｷ','ｹ','ｺ','ﾀ'],
    sparkle: ['ﾀ','ﾁ','ﾄ','ﾅ','ﾆ'],
    scatter: ['ﾀ','ﾁ','ﾄ','ﾅ','ﾆ','ﾇ'],
  },
  slash: {
    blocks:  [' ','·','·','/','\\','|','/','\\','X','╳','X','\\','/','|','\\','/'],
    puddle:  [' ','·','/','/','\\','|','X','╳','╳','╳'],
    sparkle: ['╳','X','|','\\','/'],
    scatter: ['╳','X','|','\\','/','·'],
  },
  code: {
    blocks:  [' ','.',':', ';','=','+','#','$','@','&','@','$','#','+','=',':'],
    puddle:  [' ','.',':',';','=','+','#','$','@','&'],
    sparkle: ['@','&','$','#','+'],
    scatter: ['@','&','$','#','+','='],
  },
  binary: {
    blocks:  [' ','0','0','1','0','1','1','0','1','1','0','1','1','0','0','0'],
    puddle:  [' ','0','0','1','0','1','1','0','1','1'],
    sparkle: ['1','0','1','0','1'],
    scatter: ['1','0','1','0','1','0'],
  },
  braille: {
    blocks:  [' ','⠁','⠃','⠇','⠏','⠟','⠿','⡿','⣿','⣿','⡿','⠿','⠟','⠏','⠇','⠃'],
    puddle:  [' ','⠁','⠃','⠇','⠏','⠟','⠿','⡿','⣿','⣿'],
    sparkle: ['⣿','⡿','⠿','⠟','⠏'],
    scatter: ['⣿','⡿','⠿','⠟','⠏','⠇'],
  },
  signal: {
    blocks:  [' ','.','.',':', ':','+','+','#','@','@','#','+','+',':',':','.'],
    puddle:  [' ','.',':','+','+','#','#','@','@','@'],
    sparkle: ['@','#','+',':','!'],
    scatter: ['@','#','+','!','?','%'],
  },
};

export const PALETTE_KEYS = Object.keys(PALETTES) as (keyof typeof PALETTES)[];
export const DEFAULT_PALETTE = 'blocks';

// ─── Default values for all tunable parameters ───
export const DEFAULTS = {
  // Blob
  blobHoverIntensity: 0.7,
  blobPressIntensity: 1.2,
  blobLerp: 0.18,
  blobFadeLerp: 0.10,
  blobBirthRadiusThreshold: 0.5,
  blobBirthIntensityThreshold: 0.02,
  // Physics
  friction: 0.92,
  minVelocity: 0.3,
  pointerLerpRate: 0.25,
  // Puddle
  puddleStartRFrac: 0.008,
  puddleMaxRFrac: 0.06,
  puddleGrowFrames: 20,
  // Opacity
  whiteBaseOpacity: 0.66,
  whitePulseAmount: 0.02,
  blueMaxOpacity: 0,
  opacityLerp: 0.10,
  blueReleaseLerp: 0.08,
  // Scatter
  scatterCount: 12,
  scatterSpeed: 1.5,
  scatterFriction: 0.94,
  scatterDecay: 0.025,
  scatterVelocityInheritance: 0.3,
  scatterValueBoost: 0.6,
  // Trail
  trailSpawnDistance: 1.5,
  trailMaxLength: 80,
  trailDecayPress: 0.03,
  trailExpDecayBase: 0.97,
  trailLinearDecayFloor: 0.003,
  trailIntensityMultiplier: 0.85,
  // Afterglow
  afterglowDecay: 0.007,
  afterglowMorphAmp1: 1.0,
  afterglowMorphAmp2: 0.5,
  afterglowIntensity: 0.35,
  // Sparkles
  sparkleSpawnChance: 0.7,
  sparkleMaxCount: 35,
  sparkleDecayRate: 0.05,
  sparkleVisibilityThreshold: 0.2,
  // Grid radius fractions
  trailRadiusFrac: 0.05,
  afterglowRadiusFrac: 0.06,
  blobHoverRadiusFrac: 0.08,
  blobPressRadiusFrac: 0.02,
  // Waves
  waveFreq1: 8,
  wavePhase1ny: 2,
  waveFreq2: 5,
  wavePhase2ny: 3,
  waveFreq3ny: 6,
  wavePhase3nx: 2,
  waveMix1: 0.5,
  waveMix2: 0.3,
  waveMix3: 0.2,
  waveSpeed1: 0.06,
  waveSpeed2: 0.04,
  waveSpeed3: 0.05,
  // Background
  centerFadeFalloff: 0.3,
  // Ambient pulse
  pulseFreq1: 0.7,
  pulseFreq2: 1.1,
  pulseFreq3: 0.3,
  pulseMix1: 0.5,
  pulseMix2: 0.3,
  pulseMix3: 0.2,
  // Overlay color
  overlayHue: 240,
  // Density
  fontSizeMultiplier: 1.15,
  // Master speed
  masterSpeed: 1.0,
  // Warp distortion (additive wave offset)
  warpAmp: 0,
  warpFreq: 3,
  warpSpeed: 0.5,
  warpMix: 0,
  // Universal radius scale
  radiusScale: 1.0,
  // SFX macros
  zoomMultiplier: 1.0,
  invertAmount: 0,
  scanAmount: 0,
  voidThreshold: 0,
  driftSpeedX: 0,
  driftSpeedY: 0,
  focusAmount: 0,
  centerFadeShape: 0,
  depthLevels: 16,
} as const;

export type Config = typeof DEFAULTS;

export interface AsciiArtRef {
  handlePointerDown: (clientX: number, clientY: number) => void;
  handlePointerMove: (clientX: number, clientY: number) => void;
  handlePointerUp: (clientX: number, clientY: number) => void;
  handlePointerLeave: () => void;
  getContainer: () => HTMLDivElement | null;
}

const AsciiArt = forwardRef<AsciiArtRef, AsciiArtProps>(function AsciiArt({ color = 'white', isVisible = true, configOverrides, paletteOverride }, ref) {
  const [frame, setFrame] = useState(0);
  const sparklesRef = useRef<Sparkle[]>([]);
  const [gridSize, setGridSize] = useState({ width: 180, height: 120 });
  const [fontSize, setFontSize] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // Pointer tracking refs (no re-renders on mousemove)
  const pointerRef = useRef({ x: -1, y: -1 });
  const targetRef = useRef({ x: -1, y: -1 });
  const isPressingRef = useRef(false);
  const trailRef = useRef<TrailPoint[]>([]);
  const afterglowRef = useRef({ x: -1, y: -1, life: 0 });
  const scatterRef = useRef<ScatterParticle[]>([]);
  const isTouchDeviceRef = useRef(false);

  // Momentum/inertia refs
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const isDriftingRef = useRef(false);
  const isFadingRef = useRef(false);
  const prevPointerRef = useRef({ x: -1, y: -1 });

  // Blob animation refs
  const blobRadiusRef = useRef(12);
  const blobIntensityRef = useRef(0.45);

  // Puddle (press-hold) refs
  const pressHoldTimeRef = useRef(0);
  const whiteOpacityRef = useRef(0.66);
  const blueOpacityRef = useRef(0);

  const config: Config = configOverrides ? { ...DEFAULTS, ...configOverrides } as Config : DEFAULTS;
  const activePaletteKey: string = DEFAULT_PALETTE;

  // Sync config into a ref so the physics RAF loop reads fresh values
  // without needing config in useEffect deps (which would restart the loop)
  const configRef = useRef<Config>(config);
  configRef.current = config;

  // Active palette — computed directly (instant swap, no crossfade)
  const effectivePaletteKey = paletteOverride && PALETTES[paletteOverride] ? paletteOverride : activePaletteKey;
  const activePalette = PALETTES[effectivePaletteKey] || PALETTES[DEFAULT_PALETTE];
  const paletteRef = useRef<{ key: string; blocks: string[]; puddle: string[]; sparkle: string[]; scatter: string[]; blocksLen: number; puddleLen: number }>({
    key: effectivePaletteKey,
    blocks: activePalette.blocks,
    puddle: activePalette.puddle,
    sparkle: activePalette.sparkle,
    scatter: activePalette.scatter,
    blocksLen: activePalette.blocks.length - 1,
    puddleLen: activePalette.puddle.length - 1,
  });
  paletteRef.current = {
    key: effectivePaletteKey,
    blocks: activePalette.blocks,
    puddle: activePalette.puddle,
    sparkle: activePalette.sparkle,
    scatter: activePalette.scatter,
    blocksLen: activePalette.blocks.length - 1,
    puddleLen: activePalette.puddle.length - 1,
  };

  // Convert client coordinates to grid coordinates
  const clientToGrid = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    if (!preRef.current) return { x: -1, y: -1 };
    const rect = preRef.current.getBoundingClientRect();
    const gx = Math.floor(((clientX - rect.left) / rect.width) * gridSize.width);
    const gy = Math.floor(((clientY - rect.top) / rect.height) * gridSize.height);
    return {
      x: Math.max(0, Math.min(gridSize.width - 1, gx)),
      y: Math.max(0, Math.min(gridSize.height - 1, gy)),
    };
  }, [gridSize]);

  // Expose pointer handlers to parent via ref
  useImperativeHandle(ref, () => ({
    handlePointerDown(clientX: number, clientY: number) {
      const grid = clientToGrid(clientX, clientY);
      targetRef.current = { x: grid.x, y: grid.y };
      isPressingRef.current = true;
      isDriftingRef.current = false;
      isFadingRef.current = false;
      afterglowRef.current = { x: -1, y: -1, life: 0 };
      pressHoldTimeRef.current = 0;

      // Fix mobile first-tap bug: snap pointer to target when at invalid position
      if (pointerRef.current.x < 0 || pointerRef.current.y < 0) {
        pointerRef.current = { x: grid.x, y: grid.y };
        blobRadiusRef.current = 0;
        blobIntensityRef.current = 0;
      }
    },
    handlePointerMove(clientX: number, clientY: number) {
      const grid = clientToGrid(clientX, clientY);
      targetRef.current = { x: grid.x, y: grid.y };
    },
    handlePointerUp(_clientX: number, _clientY: number) {
      isPressingRef.current = false;
      if (isTouchDeviceRef.current) {
        targetRef.current = { x: -1, y: -1 };
        isDriftingRef.current = true;
      }
    },
    handlePointerLeave() {
      targetRef.current = { x: -1, y: -1 };
      isDriftingRef.current = true;
      isPressingRef.current = false;
    },
    getContainer() {
      return containerRef.current;
    },
  }), [clientToGrid]);

  // Detect touch device
  useEffect(() => {
    const onTouch = () => { isTouchDeviceRef.current = true; };
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, []);

  // Measure actual rendered character dimensions (handles cross-browser font differences)
  const measureCharRef = useRef<{ w: number; h: number } | null>(null);
  const measureChar = useCallback((size: number, container: HTMLElement, char = 'M') => {
    const span = document.createElement('span');
    span.style.fontFamily = '"Courier New", Consolas, monospace';
    span.style.fontSize = `${size}px`;
    span.style.lineHeight = '1';
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    const N = 40;
    const sample = (char.repeat(N) + '\n').repeat(10).trimEnd();
    span.textContent = sample;
    container.appendChild(span);
    const r = span.getBoundingClientRect();
    const w = r.width / N;   // avg advance width across N chars
    const h = r.height / 10; // average line height across 10 lines
    container.removeChild(span);
    measureCharRef.current = { w, h };
    return { w, h };
  }, []);

  // Calculate grid size and font size to fill container exactly
  const updateSize = useCallback((rect: DOMRect) => {
    if (rect.width === 0 || rect.height === 0) return;
    const container = containerRef.current;
    if (!container) return;

    const mul = configRef.current.fontSizeMultiplier;
    const zoom = configRef.current.zoomMultiplier;
    const baseFontSize = Math.max(4, Math.min(14, Math.min(rect.width, rect.height) * 0.008)) * mul * zoom;

    // Measure actual char dimensions from the browser's rendering engine
    const palBlocks = paletteRef.current.blocks;
    const sampleChar = palBlocks[Math.min(Math.floor(palBlocks.length * 0.6), palBlocks.length - 1)] || 'M';
    const { w: charWidth, h: charHeight } = measureChar(baseFontSize, container, sampleChar);

    const cols = Math.ceil(rect.width / charWidth) + 2;
    const rows = Math.ceil(rect.height / charHeight) + 2;

    setGridSize({ width: cols, height: rows });
    setFontSize(baseFontSize);
  }, [measureChar]);

  // Recalc grid when fontSizeMultiplier or zoomMultiplier changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      updateSize(rect);
    }
  }, [config.fontSizeMultiplier, config.zoomMultiplier, updateSize, effectivePaletteKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        updateSize(entries[0].contentRect as DOMRect);
      }
    });

    observer.observe(container);

    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      updateSize(rect);
    }

    return () => observer.disconnect();
  }, [updateSize]);

  const { width, height } = gridSize;

  // Cache grid diagonal and derived radii
  const gridMetrics = useMemo(() => {
    const c = configRef.current;
    const s = c.radiusScale;
    const gridDiag = Math.sqrt(width * width + height * height);
    return {
      gridDiag,
      trailRadius: Math.max(5, gridDiag * c.trailRadiusFrac * s),
      agRadius: Math.max(6, gridDiag * c.afterglowRadiusFrac * s),
      blobHoverR: Math.max(12, gridDiag * c.blobHoverRadiusFrac * s),
      blobPressR: Math.max(3, gridDiag * c.blobPressRadiusFrac * s),
      puddleStartR: gridDiag * c.puddleStartRFrac * s,
      puddleMaxR: gridDiag * c.puddleMaxRFrac * s,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, configOverrides]);

  const gridMetricsRef = useRef(gridMetrics);
  gridMetricsRef.current = gridMetrics;

  // Pre-calculate normalized coordinates and deltas (centerFade computed inline for SHAPE morphing)
  const gridData = useMemo(() => {
    const data: { nx: number; ny: number; dx: number; dy: number }[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const ny = y / height;
        const dx = (nx - 0.5) * 2;
        const dy = (ny - 0.5) * 2;
        data.push({ nx, ny, dx, dy });
      }
    }
    return data;
  }, [width, height]);

  // Animation frame ticker (character rendering at ~10fps)
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Physics loop: pointer lerp, trail, afterglow, blob, sparkles — all at 60fps via RAF
  useEffect(() => {
    if (!isVisible) return;

    let lastTime = performance.now();
    let rafId: number;
    let sparkleAccum = 0;
    let sparkleDecayAccum = 0;

    const tick = (now: number) => {
      const c = configRef.current;
      const dt = Math.min(now - lastTime, 50);
      const dtNorm = dt / 100;
      lastTime = now;

      // --- Sparkle spawn ---
      sparkleAccum += dt;
      if (sparkleAccum >= 100) {
        sparkleAccum -= 100;
        if (Math.random() < c.sparkleSpawnChance) {
          const newSparkle: Sparkle = {
            x: Math.floor(Math.random() * width),
            y: Math.floor(Math.random() * height),
            life: 1,
            char: paletteRef.current.sparkle[Math.floor(Math.random() * paletteRef.current.sparkle.length)]
          };
          sparklesRef.current = [...sparklesRef.current.slice(-c.sparkleMaxCount), newSparkle];
        }
      }

      // --- Sparkle decay ---
      sparkleDecayAccum += dt;
      if (sparkleDecayAccum >= 60) {
        sparkleDecayAccum -= 60;
        sparklesRef.current = sparklesRef.current
          .map(s => ({ ...s, life: s.life - c.sparkleDecayRate }))
          .filter(s => s.life > 0);
      }

      // --- Pointer lerp with momentum/inertia ---
      const tx = targetRef.current.x;
      const ty = targetRef.current.y;
      const wasOffscreen = prevPointerRef.current.x < 0;

      if (tx >= 0 && ty >= 0) {
        if (prevPointerRef.current.x >= 0 && prevPointerRef.current.y >= 0) {
          velocityRef.current.vx = pointerRef.current.x - prevPointerRef.current.x;
          velocityRef.current.vy = pointerRef.current.y - prevPointerRef.current.y;
        }
        prevPointerRef.current.x = pointerRef.current.x;
        prevPointerRef.current.y = pointerRef.current.y;
        const pointerLerp = 1 - Math.pow(1 - c.pointerLerpRate, dtNorm);
        pointerRef.current.x += (tx - pointerRef.current.x) * pointerLerp;
        pointerRef.current.y += (ty - pointerRef.current.y) * pointerLerp;
        isDriftingRef.current = false;
        isFadingRef.current = false;
      } else if (isDriftingRef.current) {
        const speed = Math.sqrt(
          velocityRef.current.vx * velocityRef.current.vx +
          velocityRef.current.vy * velocityRef.current.vy
        );
        if (speed > c.minVelocity) {
          pointerRef.current.x += velocityRef.current.vx * dtNorm;
          pointerRef.current.y += velocityRef.current.vy * dtNorm;
          const frictionFactor = Math.pow(c.friction, dtNorm);
          velocityRef.current.vx *= frictionFactor;
          velocityRef.current.vy *= frictionFactor;
          pointerRef.current.x = Math.max(0, Math.min(gridSize.width - 1, pointerRef.current.x));
          pointerRef.current.y = Math.max(0, Math.min(gridSize.height - 1, pointerRef.current.y));
        } else {
          isDriftingRef.current = false;
          isFadingRef.current = true;
        }
      } else if (isFadingRef.current) {
        // Fading: pointer stays frozen, blob shrinks via lerp targets below
      } else {
        pointerRef.current.x = -100;
        pointerRef.current.y = -100;
        prevPointerRef.current = { x: -1, y: -1 };
      }

      // Detect blob "birth" — pointer just became valid from offscreen
      if (pointerRef.current.x >= 0 && wasOffscreen) {
        blobRadiusRef.current = 0;
        blobIntensityRef.current = 0;
      }

      // Lerp blob radius and intensity
      const pressing = isPressingRef.current;
      const fading = isFadingRef.current;
      const { blobHoverR, blobPressR } = gridMetricsRef.current;
      const tR = fading ? 0 : (pressing ? blobPressR : blobHoverR);
      const tI = fading ? 0 : (pressing ? c.blobPressIntensity : c.blobHoverIntensity);
      const lerpRate = fading ? c.blobFadeLerp : c.blobLerp;
      const blobLerpFactor = 1 - Math.pow(1 - lerpRate, dtNorm);
      blobRadiusRef.current += (tR - blobRadiusRef.current) * blobLerpFactor;
      blobIntensityRef.current += (tI - blobIntensityRef.current) * blobLerpFactor;

      // Dissolve complete — trigger afterglow and kill pointer
      if (fading && blobRadiusRef.current < c.blobBirthRadiusThreshold && blobIntensityRef.current < c.blobBirthIntensityThreshold) {
        isFadingRef.current = false;
        afterglowRef.current = {
          x: pointerRef.current.x,
          y: pointerRef.current.y,
          life: 1.0,
        };

        // Spawn scatter particles (cap at 80 to prevent accumulation on rapid taps)
        if (scatterRef.current.length <= 80) {
        const sx = pointerRef.current.x;
        const sy = pointerRef.current.y;
        const vx0 = velocityRef.current.vx;
        const vy0 = velocityRef.current.vy;
        for (let i = 0; i < c.scatterCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = c.scatterSpeed * (0.7 + Math.random() * 0.6);
          scatterRef.current.push({
            x: sx, y: sy,
            vx: Math.cos(angle) * speed + vx0 * c.scatterVelocityInheritance,
            vy: Math.sin(angle) * speed + vy0 * c.scatterVelocityInheritance,
            life: 1.0,
            char: paletteRef.current.scatter[Math.floor(Math.random() * paletteRef.current.scatter.length)],
          });
        }
        } // end scatter cap

        pointerRef.current = { x: -100, y: -100 };
        prevPointerRef.current = { x: -1, y: -1 };
      }

      // Puddle growth while pressing, shrink on release
      if (pressing) {
        pressHoldTimeRef.current = Math.min(pressHoldTimeRef.current + dtNorm, c.puddleGrowFrames);
      } else {
        pressHoldTimeRef.current = Math.max(pressHoldTimeRef.current - 2 * dtNorm, 0);
      }

      // --- White: ambient pulse (not press-driven) ---
      const t = performance.now() * 0.001 * c.masterSpeed;
      const pulse = Math.sin(t * c.pulseFreq1) * c.pulseMix1
        + Math.sin(t * c.pulseFreq2) * c.pulseMix2
        + Math.sin(t * c.pulseFreq3) * c.pulseMix3;
      whiteOpacityRef.current = c.whiteBaseOpacity + pulse * c.whitePulseAmount;

      // --- Blue: still press-driven ---
      const targetBlueOpacity = pressing ? c.blueMaxOpacity : 0;
      const blLerp = 1 - Math.pow(1 - (pressing ? c.opacityLerp : c.blueReleaseLerp), dtNorm);
      blueOpacityRef.current += (targetBlueOpacity - blueOpacityRef.current) * blLerp;

      // Snap blue to 0 when negligible
      if (blueOpacityRef.current < 0.01) {
        blueOpacityRef.current = 0;
        pressHoldTimeRef.current = 0;
      }

      // Trail system: add point while pressing
      if (isPressingRef.current && pointerRef.current.x >= 0) {
        const px = pointerRef.current.x;
        const py = pointerRef.current.y;
        const lastTrail = trailRef.current[trailRef.current.length - 1];
        const shouldAdd = !lastTrail ||
          Math.hypot(px - lastTrail.x, py - lastTrail.y) >= c.trailSpawnDistance;

        if (shouldAdd) {
          trailRef.current.push({
            x: px,
            y: py,
            life: 1.0,
            intensity: 1.0,
          });
          if (trailRef.current.length > c.trailMaxLength) {
            trailRef.current = trailRef.current.slice(-c.trailMaxLength);
          }
        }
      }

      // Decay trail points
      trailRef.current = trailRef.current
        .map(t => {
          if (isPressingRef.current) {
            return { ...t, life: t.life - c.trailDecayPress * dtNorm };
          } else {
            const newLife = t.life * Math.pow(c.trailExpDecayBase, dtNorm) - c.trailLinearDecayFloor * dtNorm;
            return { ...t, life: newLife };
          }
        })
        .filter(t => t.life > 0);

      // Decay afterglow
      if (afterglowRef.current.life > 0) {
        afterglowRef.current.life -= c.afterglowDecay * dtNorm;
        if (afterglowRef.current.life <= 0) {
          afterglowRef.current = { x: -1, y: -1, life: 0 };
        }
      }

      // Scatter particle physics
      scatterRef.current = scatterRef.current
        .map(p => {
          const frictionFactor = Math.pow(c.scatterFriction, dtNorm);
          return {
            ...p,
            x: p.x + p.vx * dtNorm,
            y: p.y + p.vy * dtNorm,
            vx: p.vx * frictionFactor,
            vy: p.vy * frictionFactor,
            life: p.life - c.scatterDecay * dtNorm,
          };
        })
        .filter(p => p.life > 0 && p.x >= -2 && p.x < width + 2 && p.y >= -2 && p.y < height + 2);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, gridSize, width, height]);

  const sceneData = useMemo(() => {
    const c = configRef.current;
    const pal = paletteRef.current;
    const ms = c.masterSpeed;
    const frameSpeed1 = frame * c.waveSpeed1 * ms;
    const frameSpeed2 = frame * c.waveSpeed2 * ms;
    const frameSpeed3 = frame * c.waveSpeed3 * ms;
    const time = frame * 0.1 * ms;

    // Create sparkle lookup
    const sparkleMap = new Map<string, string>();
    for (const s of sparklesRef.current) {
      if (s.life > c.sparkleVisibilityThreshold) {
        sparkleMap.set(`${s.x},${s.y}`, s.char);
      }
    }

    // Read pointer state
    const px = pointerRef.current.x;
    const py = pointerRef.current.y;
    const hasPointer = px >= 0 && py >= 0;
    const trail = trailRef.current;
    const ag = afterglowRef.current;
    const hasAfterglow = ag.life > 0 && ag.x >= 0;

    // Blob parameters
    const baseRadius = blobRadiusRef.current;
    const maxBoost = blobIntensityRef.current;

    // Read opacity state
    const whiteOpacity = whiteOpacityRef.current;
    const blueOpacity = blueOpacityRef.current;

    // Scatter particle lookup
    const scatter = scatterRef.current;
    const scatterMap = new Map<string, { char: string; life: number }>();
    for (const p of scatter) {
      const rx = Math.round(p.x);
      const ry = Math.round(p.y);
      const key = `${rx},${ry}`;
      const existing = scatterMap.get(key);
      if (!existing || p.life > existing.life) {
        scatterMap.set(key, { char: p.char, life: p.life });
      }
    }
    const hasScatter = scatterMap.size > 0;

    // Puddle radius: ease-out growth curve
    const { trailRadius, agRadius, puddleStartR, puddleMaxR } = gridMetricsRef.current;
    const growT = Math.min(pressHoldTimeRef.current / c.puddleGrowFrames, 1);
    const easedGrowth = 1 - (1 - growT) * (1 - growT);
    const puddleR = puddleStartR + (puddleMaxR - puddleStartR) * easedGrowth;
    const showBlue = blueOpacity > 0.01;

    const whiteLines: string[] = [];
    const blueLines: string[] = [];
    let idx = 0;

    for (let y = 0; y < height; y++) {
      let whiteLine = '';
      let blueLine = '';
      for (let x = 0; x < width; x++) {
        const { nx, ny, dx: gdx, dy: gdy } = gridData[idx++];

        // Center fade with shape morphing (euclidean→chebyshev)
        const euclidean = Math.sqrt(gdx * gdx + gdy * gdy);
        const chebyshev = Math.max(Math.abs(gdx), Math.abs(gdy));
        const dist = euclidean + (chebyshev - euclidean) * c.centerFadeShape;
        const centerFade = Math.max(0, 1 - dist * c.centerFadeFalloff);

        // Warp distortion (additive spatial offset)
        const warpOffset = c.warpMix > 0.001
          ? c.warpAmp * fastSin(ny * c.warpFreq + time * c.warpSpeed) * c.warpMix
          : 0;
        let wnx = nx + warpOffset + time * c.driftSpeedX;
        const wny = ny + warpOffset * 0.7 + time * c.driftSpeedY;

        // Focus: scale down wave frequencies for smoother patterns
        const focusScale = 1 - c.focusAmount * 0.8;

        // Base wave pattern
        const wave1 = fastSin(wnx * c.waveFreq1 * focusScale + frameSpeed1 + wny * c.wavePhase1ny * focusScale);
        const wave2 = fastSin(wnx * c.waveFreq2 * focusScale - frameSpeed2 + wny * c.wavePhase2ny * focusScale);
        const wave3 = fastSin(wny * c.waveFreq3ny * focusScale + frameSpeed3 + wnx * c.wavePhase3nx * focusScale);

        const combined = wave1 * c.waveMix1 + wave2 * c.waveMix2 + wave3 * c.waveMix3;
        let value = ((combined + 1) * 0.5) * centerFade;

        // Invert: flip density mapping
        if (c.invertAmount > 0.001) {
          value = value + (1 - 2 * value) * c.invertAmount;
        }

        // Compute distance to pointer once
        let distToPointer = Infinity;
        if (hasPointer) {
          const dx = x - px;
          const dy = y - py;
          distToPointer = Math.sqrt(dx * dx + dy * dy);

          if (distToPointer < baseRadius) {
            const falloff = 1 - distToPointer / baseRadius;
            value = Math.min(1, value + maxBoost * falloff * falloff);
          }
        }

        // Trail influence
        for (const tp of trail) {
          if (Math.abs(x - tp.x) > trailRadius || Math.abs(y - tp.y) > trailRadius) continue;
          const tdx = x - tp.x;
          const tdy = y - tp.y;
          const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
          if (tDist < trailRadius) {
            const falloff = 1 - tDist / trailRadius;
            const intensity = tp.life * tp.intensity * falloff * falloff * c.trailIntensityMultiplier;
            value = Math.min(1, value + intensity);
          }
        }

        // Afterglow influence
        if (hasAfterglow) {
          if (Math.abs(x - ag.x) <= agRadius && Math.abs(y - ag.y) <= agRadius) {
            const adx = x - ag.x;
            const ady = y - ag.y;
            const aDist = Math.sqrt(adx * adx + ady * ady);
            if (aDist < agRadius) {
              const angle = Math.atan2(ady, adx);
              const morphedRadius = agRadius
                + Math.sin(angle * 3 + time * 0.8) * c.afterglowMorphAmp1
                + Math.sin(angle * 5 + time * 0.5) * c.afterglowMorphAmp2;
              if (aDist < morphedRadius) {
                const falloff = 1 - aDist / morphedRadius;
                const easedLife = Math.sqrt(ag.life);
                const intensity = easedLife * c.afterglowIntensity * falloff * falloff;
                value = Math.min(1, value + intensity);
              }
            }
          }
        }

        // Scan: dim odd rows for CRT scanline effect
        if (c.scanAmount > 0.5 && (y & 1)) value *= 0.15;

        // Void: blank cells below threshold
        if (c.voidThreshold > 0.001 && value < c.voidThreshold) value = 0;

        // Depth: quantize to N levels
        const levels = Math.round(c.depthLevels);
        if (levels < 16) {
          value = Math.round(value * (levels - 1)) / (levels - 1);
        }

        // Determine if cell is in puddle zone
        const inPuddle = showBlue && distToPointer < puddleR;

        // White layer
        const scatterHit = hasScatter ? scatterMap.get(`${x},${y}`) : undefined;
        if (scatterHit) {
          value = Math.min(1, value + scatterHit.life * c.scatterValueBoost);
          whiteLine += scatterHit.char;
        } else {
          const sparkleChar = sparkleMap.get(`${x},${y}`);
          if (sparkleChar) {
            whiteLine += sparkleChar;
          } else {
            const blockIdx = (value * pal.blocksLen) | 0;
            whiteLine += pal.blocks[blockIdx < 0 ? 0 : blockIdx > pal.blocksLen ? pal.blocksLen : blockIdx];
          }
        }

        // Blue layer
        if (inPuddle) {
          const falloff = 1 - distToPointer / puddleR;
          const pIdx = (falloff * falloff * pal.puddleLen) | 0;
          blueLine += pal.puddle[pIdx < 0 ? 0 : pIdx > pal.puddleLen ? pal.puddleLen : pIdx];
        } else {
          blueLine += ' ';
        }
      }
      whiteLines.push(whiteLine);
      blueLines.push(blueLine);
    }

    return {
      whiteScene: whiteLines.join('\n'),
      blueScene: blueLines.join('\n'),
      whiteOpacity,
      blueOpacity,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, gridData, width, height, effectivePaletteKey]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 1,
        left: 1,
        right: 1,
        bottom: 1,
        userSelect: 'none',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative' }}>
        <pre
          ref={preRef}
          style={{
            fontFamily: '"Courier New", Consolas, monospace',
            fontSize: `${fontSize}px`,
            lineHeight: 1.0,
            color: color,
            margin: 0,
            whiteSpace: 'pre',
            textAlign: 'left',
            opacity: sceneData.whiteOpacity,
            pointerEvents: 'none',
          }}
        >
          {sceneData.whiteScene}
        </pre>
        {sceneData.blueOpacity > 0.01 && (
          <pre
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontFamily: '"Courier New", Consolas, monospace',
              fontSize: `${fontSize}px`,
              lineHeight: 1.0,
              color: '#fff',
              margin: 0,
              whiteSpace: 'pre',
              textAlign: 'left',
              opacity: sceneData.blueOpacity,
              pointerEvents: 'none',
            }}
          >
            {sceneData.blueScene}
          </pre>
        )}
      </div>
    </div>
  );
});

export default AsciiArt;
