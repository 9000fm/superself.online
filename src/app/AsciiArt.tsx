'use client';

import { useEffect, useState, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

interface AsciiArtProps {
  color?: string;
  isVisible?: boolean;
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

const SPARKLE_CHARS = ['*', '+', '░', '▒', '#'];

// Character palettes (outside component to avoid re-creation)
const BLOCKS = [' ', '·', '·', '░', '░', '▒', '▒', '▓', '█', '█', '▓', '▒', '▒', '░', '░', '·'];
const BLOCKS_LEN = BLOCKS.length - 1;
const PUDDLE_CHARS = [' ', '░', '▒', '▒', '▓', '▓', '▓', '█', '█', '█'];
const PUDDLE_CHARS_LEN = PUDDLE_CHARS.length - 1;

export interface AsciiArtRef {
  handlePointerDown: (clientX: number, clientY: number) => void;
  handlePointerMove: (clientX: number, clientY: number) => void;
  handlePointerUp: (clientX: number, clientY: number) => void;
  handlePointerLeave: () => void;
}

const AsciiArt = forwardRef<AsciiArtRef, AsciiArtProps>(function AsciiArt({ color = 'white', isVisible = true }, ref) {
  const [frame, setFrame] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
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
  const whiteOpacityRef = useRef(0.4);
  const blueOpacityRef = useRef(0);

  // Blob animation constants (intensity/lerp are fixed; radii scale with grid)
  const BLOB_HOVER_INTENSITY = 0.7;
  const BLOB_PRESS_INTENSITY = 1.2;
  const BLOB_LERP = 0.18;
  const BLOB_FADE_LERP = 0.10;
  const FRICTION = 0.92;
  const MIN_VELOCITY = 0.3;

  // Puddle constants
  const PUDDLE_START_R_FRAC = 0.008;
  const PUDDLE_MAX_R_FRAC = 0.06;
  const PUDDLE_GROW_FRAMES = 20;
  const WHITE_DIM_OPACITY = 0.15;
  const WHITE_NORMAL_OPACITY = 0.4;
  const BLUE_MAX_OPACITY = 0.55;
  const OPACITY_LERP = 0.10;

  // Scatter particle constants
  const SCATTER_COUNT = 12;
  const SCATTER_SPEED = 1.5;
  const SCATTER_FRICTION = 0.94;
  const SCATTER_DECAY = 0.025;
  const SCATTER_CHARS = ['\u2588', '\u2593', '\u2592', '#', '*', '+'];

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
      // Prevents blob sliding in from (-1,-1) on the first touch
      if (pointerRef.current.x < 0 || pointerRef.current.y < 0) {
        pointerRef.current = { x: grid.x, y: grid.y };
        // Phase 1: Reset blob radius/intensity for bloom-in effect
        blobRadiusRef.current = 0;
        blobIntensityRef.current = 0;
      }
    },
    handlePointerMove(clientX: number, clientY: number) {
      const grid = clientToGrid(clientX, clientY);
      targetRef.current = { x: grid.x, y: grid.y };
    },
    handlePointerUp(clientX: number, clientY: number) {
      isPressingRef.current = false;

      // Mobile: don't kill blob — enter drift mode so it carries momentum
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
  }), [clientToGrid]);

  // Detect touch device
  useEffect(() => {
    const onTouch = () => { isTouchDeviceRef.current = true; };
    window.addEventListener('touchstart', onTouch, { once: true, passive: true });
    return () => window.removeEventListener('touchstart', onTouch);
  }, []);

  // Calculate grid size and font size to fill container exactly
  useEffect(() => {
    const updateSize = (rect: DOMRect) => {
      if (rect.width === 0 || rect.height === 0) return;

      const baseFontSize = Math.max(4, Math.min(14, Math.min(rect.width, rect.height) * 0.008));
      const charWidth = baseFontSize * 0.6;
      const charHeight = baseFontSize * 1.0;

      const cols = Math.ceil(rect.width / charWidth);
      const rows = Math.ceil(rect.height / charHeight);

      setGridSize({ width: cols, height: rows });
      setFontSize(baseFontSize);
    };

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
  }, []);

  const { width, height } = gridSize;

  // Cache grid diagonal and derived radii
  const gridMetrics = useMemo(() => {
    const gridDiag = Math.sqrt(width * width + height * height);
    return {
      gridDiag,
      trailRadius: Math.max(5, gridDiag * 0.05),
      agRadius: Math.max(6, gridDiag * 0.06),
      blobHoverR: Math.max(12, gridDiag * 0.08),
      blobPressR: Math.max(3, gridDiag * 0.02),
      puddleStartR: gridDiag * PUDDLE_START_R_FRAC,
      puddleMaxR: gridDiag * PUDDLE_MAX_R_FRAC,
    };
  }, [width, height]);

  // Pre-calculate normalized coordinates and distances
  const gridData = useMemo(() => {
    const data: { nx: number; ny: number; centerFade: number }[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const ny = y / height;
        const dx = (nx - 0.5) * 2;
        const dy = (ny - 0.5) * 2;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const centerFade = Math.max(0, 1 - distFromCenter * 0.3);
        data.push({ nx, ny, centerFade });
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
      const dt = Math.min(now - lastTime, 50); // cap to avoid spiral after tab switch
      const dtNorm = dt / 100; // normalize to old 100ms baseline
      lastTime = now;

      // --- Sparkle spawn (same rate as old 100ms interval) ---
      sparkleAccum += dt;
      if (sparkleAccum >= 100) {
        sparkleAccum -= 100;
        if (Math.random() < 0.7) {
          setSparkles(prev => {
            const newSparkle: Sparkle = {
              x: Math.floor(Math.random() * width),
              y: Math.floor(Math.random() * height),
              life: 1,
              char: SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)]
            };
            return [...prev.slice(-35), newSparkle];
          });
        }
      }

      // --- Sparkle decay (same rate as old 60ms interval) ---
      sparkleDecayAccum += dt;
      if (sparkleDecayAccum >= 60) {
        sparkleDecayAccum -= 60;
        setSparkles(prev => prev
          .map(s => ({ ...s, life: s.life - 0.05 }))
          .filter(s => s.life > 0)
        );
      }

      // --- Pointer lerp with momentum/inertia ---
      const tx = targetRef.current.x;
      const ty = targetRef.current.y;
      const wasOffscreen = prevPointerRef.current.x < 0;

      if (tx >= 0 && ty >= 0) {
        // Calculate velocity from position delta
        if (prevPointerRef.current.x >= 0 && prevPointerRef.current.y >= 0) {
          velocityRef.current.vx = pointerRef.current.x - prevPointerRef.current.x;
          velocityRef.current.vy = pointerRef.current.y - prevPointerRef.current.y;
        }
        prevPointerRef.current.x = pointerRef.current.x;
        prevPointerRef.current.y = pointerRef.current.y;
        // Lerp toward target (dt-normalized)
        const pointerLerp = 1 - Math.pow(1 - 0.25, dtNorm);
        pointerRef.current.x += (tx - pointerRef.current.x) * pointerLerp;
        pointerRef.current.y += (ty - pointerRef.current.y) * pointerLerp;
        isDriftingRef.current = false;
        isFadingRef.current = false;
      } else if (isDriftingRef.current) {
        const speed = Math.sqrt(
          velocityRef.current.vx * velocityRef.current.vx +
          velocityRef.current.vy * velocityRef.current.vy
        );
        if (speed > MIN_VELOCITY) {
          // Apply velocity with friction (dt-normalized)
          pointerRef.current.x += velocityRef.current.vx * dtNorm;
          pointerRef.current.y += velocityRef.current.vy * dtNorm;
          const frictionFactor = Math.pow(FRICTION, dtNorm);
          velocityRef.current.vx *= frictionFactor;
          velocityRef.current.vy *= frictionFactor;
          // Clamp within grid bounds
          pointerRef.current.x = Math.max(0, Math.min(gridSize.width - 1, pointerRef.current.x));
          pointerRef.current.y = Math.max(0, Math.min(gridSize.height - 1, pointerRef.current.y));
        } else {
          // Velocity below threshold — enter fade mode (blob dissolves)
          isDriftingRef.current = false;
          isFadingRef.current = true;
        }
      } else if (isFadingRef.current) {
        // Fading: pointer stays frozen, blob shrinks via lerp targets below
      } else {
        // No target, not drifting, not fading — pointer off-screen
        pointerRef.current.x = -100;
        pointerRef.current.y = -100;
        prevPointerRef.current = { x: -1, y: -1 };
      }

      // Phase 1: Detect blob "birth" — pointer just became valid from offscreen
      if (pointerRef.current.x >= 0 && wasOffscreen) {
        blobRadiusRef.current = 0;
        blobIntensityRef.current = 0;
      }

      // Lerp blob radius and intensity (dt-normalized)
      const pressing = isPressingRef.current;
      const fading = isFadingRef.current;
      const { blobHoverR, blobPressR } = gridMetrics;
      const tR = fading ? 0 : (pressing ? blobPressR : blobHoverR);
      const tI = fading ? 0 : (pressing ? BLOB_PRESS_INTENSITY : BLOB_HOVER_INTENSITY);
      const lerpRate = fading ? BLOB_FADE_LERP : BLOB_LERP;
      const blobLerpFactor = 1 - Math.pow(1 - lerpRate, dtNorm);
      blobRadiusRef.current += (tR - blobRadiusRef.current) * blobLerpFactor;
      blobIntensityRef.current += (tI - blobIntensityRef.current) * blobLerpFactor;

      // Dissolve complete — trigger afterglow and kill pointer
      if (fading && blobRadiusRef.current < 0.5 && blobIntensityRef.current < 0.02) {
        isFadingRef.current = false;
        afterglowRef.current = {
          x: pointerRef.current.x,
          y: pointerRef.current.y,
          life: 1.0,
        };

        // Spawn scatter particles
        const sx = pointerRef.current.x;
        const sy = pointerRef.current.y;
        const vx0 = velocityRef.current.vx;
        const vy0 = velocityRef.current.vy;
        for (let i = 0; i < SCATTER_COUNT; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = SCATTER_SPEED * (0.7 + Math.random() * 0.6);
          scatterRef.current.push({
            x: sx, y: sy,
            vx: Math.cos(angle) * speed + vx0 * 0.3,
            vy: Math.sin(angle) * speed + vy0 * 0.3,
            life: 1.0,
            char: SCATTER_CHARS[Math.floor(Math.random() * SCATTER_CHARS.length)],
          });
        }

        pointerRef.current = { x: -100, y: -100 };
        prevPointerRef.current = { x: -1, y: -1 };
      }

      // Puddle growth while pressing, shrink on release
      if (pressing) {
        pressHoldTimeRef.current = Math.min(pressHoldTimeRef.current + dtNorm, PUDDLE_GROW_FRAMES);
      } else {
        pressHoldTimeRef.current = Math.max(pressHoldTimeRef.current - 2 * dtNorm, 0);
      }

      // Opacity lerps: dim white and brighten blue while pressing
      const targetWhiteOpacity = pressing ? WHITE_DIM_OPACITY : WHITE_NORMAL_OPACITY;
      const targetBlueOpacity = pressing ? BLUE_MAX_OPACITY : 0;
      const fadeInLerp = OPACITY_LERP;
      const fadeOutLerp = 0.08; // Phase 4b: slower recovery (was 0.25)
      const whLerp = 1 - Math.pow(1 - (pressing ? fadeInLerp : fadeOutLerp), dtNorm);
      const blLerp = 1 - Math.pow(1 - (pressing ? fadeInLerp : fadeOutLerp), dtNorm);
      whiteOpacityRef.current += (targetWhiteOpacity - whiteOpacityRef.current) * whLerp;
      blueOpacityRef.current += (targetBlueOpacity - blueOpacityRef.current) * blLerp;

      // Snap blue to 0 when negligible
      if (blueOpacityRef.current < 0.01) {
        blueOpacityRef.current = 0;
        pressHoldTimeRef.current = 0;
      }

      // Trail system: add point while pressing (distance-based spawn throttle)
      if (isPressingRef.current && pointerRef.current.x >= 0) {
        const px = pointerRef.current.x;
        const py = pointerRef.current.y;
        const lastTrail = trailRef.current[trailRef.current.length - 1];
        const shouldAdd = !lastTrail ||
          Math.hypot(px - lastTrail.x, py - lastTrail.y) >= 1.5;

        if (shouldAdd) {
          trailRef.current.push({
            x: px,
            y: py,
            life: 1.0,
            intensity: 1.0, // Phase 3: hotter start (was 0.8)
          });
          if (trailRef.current.length > 80) { // Phase 3: longer path (was 50)
            trailRef.current = trailRef.current.slice(-80);
          }
        }
      }

      // Decay trail points — Phase 4a: exponential decay after release
      trailRef.current = trailRef.current
        .map(t => {
          if (isPressingRef.current) {
            return { ...t, life: t.life - 0.03 * dtNorm };
          } else {
            // Exponential: slows as it fades + tiny linear floor for cleanup
            const newLife = t.life * Math.pow(0.97, dtNorm) - 0.003 * dtNorm;
            return { ...t, life: newLife };
          }
        })
        .filter(t => t.life > 0);

      // Decay afterglow — Phase 4c: slower decay (was 0.01)
      if (afterglowRef.current.life > 0) {
        afterglowRef.current.life -= 0.007 * dtNorm;
        if (afterglowRef.current.life <= 0) {
          afterglowRef.current = { x: -1, y: -1, life: 0 };
        }
      }

      // Scatter particle physics
      scatterRef.current = scatterRef.current
        .map(p => {
          const frictionFactor = Math.pow(SCATTER_FRICTION, dtNorm);
          return {
            ...p,
            x: p.x + p.vx * dtNorm,
            y: p.y + p.vy * dtNorm,
            vx: p.vx * frictionFactor,
            vy: p.vy * frictionFactor,
            life: p.life - SCATTER_DECAY * dtNorm,
          };
        })
        .filter(p => p.life > 0 && p.x >= -2 && p.x < width + 2 && p.y >= -2 && p.y < height + 2);

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isVisible, gridSize, width, height, gridMetrics]);

  const sceneData = useMemo(() => {
    const frameSpeed1 = frame * 0.06;
    const frameSpeed2 = frame * 0.04;
    const frameSpeed3 = frame * 0.05;
    const time = frame * 0.1;

    // Create sparkle lookup
    const sparkleMap = new Map<string, string>();
    for (const s of sparkles) {
      if (s.life > 0.2) {
        sparkleMap.set(`${s.x},${s.y}`, s.char);
      }
    }

    // Read pointer state (refs, no re-render dependency — read fresh per frame)
    const px = pointerRef.current.x;
    const py = pointerRef.current.y;
    const hasPointer = px >= 0 && py >= 0;
    const trail = trailRef.current;
    const ag = afterglowRef.current;
    const hasAfterglow = ag.life > 0 && ag.x >= 0;

    // Blob parameters (read from animated refs)
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
    const { trailRadius, agRadius, puddleStartR, puddleMaxR } = gridMetrics;
    const growT = Math.min(pressHoldTimeRef.current / PUDDLE_GROW_FRAMES, 1);
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
        const { nx, ny, centerFade } = gridData[idx++];

        // Base wave pattern
        const wave1 = fastSin(nx * 8 + frameSpeed1 + ny * 2);
        const wave2 = fastSin(nx * 5 - frameSpeed2 + ny * 3);
        const wave3 = fastSin(ny * 6 + frameSpeed3 + nx * 2);

        const combined = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;
        let value = ((combined + 1) * 0.5) * centerFade;

        // Compute distance to pointer once (reuse for blob and puddle)
        let distToPointer = Infinity;
        if (hasPointer) {
          const dx = x - px;
          const dy = y - py;
          distToPointer = Math.sqrt(dx * dx + dy * dy);

          // Blob influence on white layer
          if (distToPointer < baseRadius) {
            const falloff = 1 - distToPointer / baseRadius;
            value = Math.min(1, value + maxBoost * falloff * falloff);
          }
        }

        // Trail influence (white layer only) — Phase 5: bounding-box pre-check
        for (const tp of trail) {
          if (Math.abs(x - tp.x) > trailRadius || Math.abs(y - tp.y) > trailRadius) continue;
          const tdx = x - tp.x;
          const tdy = y - tp.y;
          const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
          if (tDist < trailRadius) {
            const falloff = 1 - tDist / trailRadius;
            const intensity = tp.life * tp.intensity * falloff * falloff * 0.85; // Phase 3: was 0.5
            value = Math.min(1, value + intensity);
          }
        }

        // Afterglow influence (white layer only) — Phase 4c: stronger + sqrt easing
        if (hasAfterglow) {
          if (Math.abs(x - ag.x) <= agRadius && Math.abs(y - ag.y) <= agRadius) {
            const adx = x - ag.x;
            const ady = y - ag.y;
            const aDist = Math.sqrt(adx * adx + ady * ady);
            if (aDist < agRadius) {
              const angle = Math.atan2(ady, adx);
              const morphedRadius = agRadius
                + Math.sin(angle * 3 + time * 0.8) * 1.0
                + Math.sin(angle * 5 + time * 0.5) * 0.5;
              if (aDist < morphedRadius) {
                const falloff = 1 - aDist / morphedRadius;
                const easedLife = Math.sqrt(ag.life); // sqrt easing: stays visible longer
                const intensity = easedLife * 0.35 * falloff * falloff; // was 0.15
                value = Math.min(1, value + intensity);
              }
            }
          }
        }

        // Determine if cell is in puddle zone
        const inPuddle = showBlue && distToPointer < puddleR;

        // White layer: ALWAYS render normally (no holes)
        const scatterHit = hasScatter ? scatterMap.get(`${x},${y}`) : undefined;
        if (scatterHit) {
          // Scatter particle overrides cell — boost brightness by life
          value = Math.min(1, value + scatterHit.life * 0.6);
          whiteLine += scatterHit.char;
        } else {
          const sparkleChar = sparkleMap.get(`${x},${y}`);
          if (sparkleChar) {
            whiteLine += sparkleChar;
          } else {
            const blockIdx = (value * BLOCKS_LEN) | 0;
            whiteLine += BLOCKS[blockIdx < 0 ? 0 : blockIdx > BLOCKS_LEN ? BLOCKS_LEN : blockIdx];
          }
        }

        // Blue layer: puddle char if in zone, space otherwise
        if (inPuddle) {
          const falloff = 1 - distToPointer / puddleR;
          const pIdx = (falloff * falloff * PUDDLE_CHARS_LEN) | 0;
          blueLine += PUDDLE_CHARS[pIdx < 0 ? 0 : pIdx > PUDDLE_CHARS_LEN ? PUDDLE_CHARS_LEN : pIdx];
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
  }, [frame, gridData, sparkles, width, height, gridMetrics]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
              color: '#0000FF',
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
