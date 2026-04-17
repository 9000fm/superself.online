'use client';

/* eslint-disable react-hooks/immutability, react-hooks/purity --
   Canvas particle animation mutates ref-held state inside the rAF loop
   (p.detached, p.alpha, velocities). React compiler's purity/immutability
   rules assume pure-render code paths that don't apply to imperative
   animation refs. See MEMORY.md "R3F + React compiler incompatibility". */

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface LogoDissolverProps {
  logoRect: { x: number; y: number; width: number; height: number } | null;
  src: string;
  trigger: boolean;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;          // G: size variance (1-4 px) for visual weight variety
  delay: number;
  detached: boolean;
  r: number;
  g: number;
  b: number;
  // Unique offset so each particle's noise phase is different (Perlin-ish feel)
  noiseOffset: number;
  // Timestamp when particle detached — used for escape-phase decay
  detachedAt: number;
  // Pre-assigned slot inside the center rect (end-of-tunnel)
  targetX: number;
  targetY: number;
  // === PER-PARTICLE INDIVIDUALITY (A+B) ===
  pullStrength: number;
  noiseAmp: number;
  damping: number;
  jitterScale: number;
  timeShift: number;
  // === E: WAVE ARRIVAL ===
  // Each particle activates vacuum at a distance-proportional time so particles
  // close to target converge first, far ones later → ripple sweep effect
  vacuumStartTime: number;   // ms — when bezier vacuum kicks in for this particle
  vacuumDuration: number;    // ms — how long the bezier takes to complete
  // === S: BEZIER CURVE PATH ===
  // Each particle traces a unique quadratic bezier from its drift position at
  // activation time to its target. Control point = midpoint + perpendicular offset
  bezierOffset: number;      // -0.35 to 0.35 — signed fraction of distance for curve magnitude
  vacuumActivated: boolean;  // flag so bezier start pos is captured once
  bezierStartX: number;      // filled when vacuum activates
  bezierStartY: number;
  bezierCtrlX: number;       // computed at activation
  bezierCtrlY: number;
}

export function LogoDissolver({ logoRect, src, trigger, onComplete }: LogoDissolverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const burstDoneRef = useRef(false);

  useEffect(() => {
    if (!trigger || !logoRect) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = Math.round(logoRect.width);
      const h = Math.round(logoRect.height);
      const off = document.createElement('canvas');
      off.width = w; off.height = h;
      const ctx = off.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);

      const theme = document.documentElement.dataset.theme || 'dark';
      let tR = 255, tG = 255, tB = 255;
      if (theme === 'white') { tR = 0; tG = 0; tB = 0; }
      else if (theme === 'color') {
        const hex = document.documentElement.style.getPropertyValue('--foreground').trim();
        if (hex?.startsWith('#')) {
          const h2 = hex.replace('#', '');
          tR = parseInt(h2.slice(0,2),16)||0; tG = parseInt(h2.slice(2,4),16)||0; tB = parseInt(h2.slice(4,6),16)||0;
        }
      }

      const particles: Particle[] = [];
      const blockSize = 1;
      const ox = Math.round(logoRect.x);
      const oy = Math.round(logoRect.y);
      // Center rect bounds (matching GridScene scale=0.07)
      const frameOff = 42;
      const fw = window.innerWidth - frameOff * 2;
      const fh = window.innerHeight - frameOff * 2;
      const rW = fw * 0.07;
      const rH = fh * 0.07;
      const rCX = window.innerWidth / 2;
      const rCY = window.innerHeight / 2;

      for (let y = 0; y < h; y += blockSize) {
        for (let x = 0; x < w; x += blockSize) {
          if (data.data[(y * w + x) * 4 + 3] < 30) continue;
          const px = ox + x;
          const py = oy + y;
          // Each particle targets a RANDOM position inside the center rect
          const targetX = rCX - rW/2 + Math.random() * rW;
          const targetY = rCY - rH/2 + Math.random() * rH;
          const dx = targetX - px;
          const dy = targetY - py;
          // Fast detach — most particles break free within 500ms for dramatic ignition.
          // 40% instant (delay 0-100ms), 40% fast (100-500ms), 20% stragglers (500-1000ms)
          const delayRoll = Math.random();
          const delay = delayRoll < 0.4 ? Math.random() * 100
            : delayRoll < 0.8 ? 100 + Math.random() * 400
            : 500 + Math.random() * 500;
          // Initial velocity: gentle inward drift toward logo center (subtle implosion).
          const logoCx = ox + w / 2;
          const logoCy = oy + h / 2;
          const inwardDx = logoCx - px;
          const inwardDy = logoCy - py;
          const inwardAngle = Math.atan2(inwardDy, inwardDx);
          const speed = 0.4 + Math.random() * 0.6; // gentle inward
          const angle = inwardAngle + (Math.random() - 0.5) * 0.4;

          // === Per-particle individuality (A+B) ===
          const pullStrength = 0.08 + Math.random() * 0.18;
          const noiseAmp = Math.random() < 0.3 ? 0 : (0.02 + Math.random() * 0.06);
          const damping = 0.93 + Math.random() * 0.05;
          const jitterScale = 0.2 + Math.random() * 1.3;
          const timeShift = Math.random() * 500;

          // Uniform 1px particles (size variance disabled — user preference)
          const pSize = 1;

          // === E: wave arrival === close-to-target particles activate vacuum earlier
          const distToTarget = Math.sqrt((targetX - px) ** 2 + (targetY - py) ** 2);
          const viewportDiag = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
          const normDist = Math.min(1, distToTarget / (viewportDiag * 0.6));
          const vacuumStartTime = 1700 + normDist * 500;  // 1700ms (near) → 2200ms (far)
          const vacuumDuration = 600 + Math.random() * 600; // 600-1200ms per particle

          // === S: bezier curve — random perpendicular offset (signed fraction of distance) ===
          const bezierOffset = (Math.random() - 0.5) * 0.7; // -0.35 to 0.35

          particles.push({
            x: px, y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1, size: pSize, delay,
            detached: false, r: tR, g: tG, b: tB,
            noiseOffset: Math.random() * Math.PI * 2,
            detachedAt: 0,
            targetX,
            targetY,
            pullStrength,
            noiseAmp,
            damping,
            jitterScale,
            timeShift,
            vacuumStartTime,
            vacuumDuration,
            bezierOffset,
            vacuumActivated: false,
            bezierStartX: 0,
            bezierStartY: 0,
            bezierCtrlX: 0,
            bezierCtrlY: 0,
          });
        }
      }
      particlesRef.current = particles;
      setReady(true);
    };
    img.src = src;
  }, [trigger, logoRect, src]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const elapsed = performance.now() - startTimeRef.current;
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    let aliveCount = 0;

    for (const p of particlesRef.current) {
      if (elapsed < p.delay) {
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},1)`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        aliveCount++;
        continue;
      }

      if (!p.detached) { p.detached = true; p.alpha = 1.0; p.detachedAt = elapsed; }

      // B: temporal offset — each particle's "effective time" is shifted
      const effElapsed = elapsed - p.timeShift;

      // ============ VACUUM PHASE (bezier path, wave arrival) ============
      if (effElapsed > p.vacuumStartTime) {
        // Capture bezier start position the first time vacuum activates
        if (!p.vacuumActivated) {
          p.vacuumActivated = true;
          p.bezierStartX = p.x;
          p.bezierStartY = p.y;
          // Control point: midpoint between start+target, offset perpendicular
          const midX = (p.x + p.targetX) / 2;
          const midY = (p.y + p.targetY) / 2;
          const dirX = p.targetX - p.x;
          const dirY = p.targetY - p.y;
          const len = Math.max(1, Math.sqrt(dirX * dirX + dirY * dirY));
          const perpX = -dirY / len;
          const perpY = dirX / len;
          p.bezierCtrlX = midX + perpX * p.bezierOffset * len;
          p.bezierCtrlY = midY + perpY * p.bezierOffset * len;
        }
        // Interpolate along quadratic bezier: P(t) = (1-t)²A + 2(1-t)t·C + t²B
        const t = Math.min(1, (effElapsed - p.vacuumStartTime) / p.vacuumDuration);
        const mt = 1 - t;
        p.x = mt * mt * p.bezierStartX + 2 * mt * t * p.bezierCtrlX + t * t * p.targetX;
        p.y = mt * mt * p.bezierStartY + 2 * mt * t * p.bezierCtrlY + t * t * p.targetY;
        // Zero velocity (position purely bezier-driven)
        p.vx = 0;
        p.vy = 0;
      } else {
        // ============ DRIFT PHASE (physics-based, A+B individuality) ============
        // Elegant implosion → controlled expansion: gentle inward drift (initial velocity),
        // then a refined outward push — not a chaotic explosion, more like a breath.
        const timeSinceDetach = elapsed - p.detachedAt;
        if (timeSinceDetach < 300) {
          if (timeSinceDetach > 100) {
            const expandFactor = 1 - (timeSinceDetach - 100) / 200;
            const expandForce = 0.15 + p.jitterScale * 0.08;
            const outAngle = Math.atan2(p.y - p.targetY, p.x - p.targetX) + (Math.random() - 0.5) * 0.6;
            p.vx += Math.cos(outAngle) * expandForce * expandFactor;
            p.vy += Math.sin(outAngle) * expandForce * expandFactor;
          }
        }
        // Noise field — per-particle noiseAmp
        if (p.noiseAmp > 0) {
          const noiseScale = 0.003;
          p.vx += Math.sin(effElapsed * noiseScale + p.noiseOffset) * p.noiseAmp;
          p.vy += Math.cos(effElapsed * noiseScale * 0.8 + p.noiseOffset * 1.3) * p.noiseAmp;
        }
        // Per-particle damping
        p.vx *= p.damping;
        p.vy *= p.damping;
        // Per-particle jitter
        const jitter = 0.25 * p.jitterScale;
        p.x += p.vx + (Math.random() - 0.5) * jitter;
        p.y += p.vy + (Math.random() - 0.5) * jitter;
      }

      // Fade when particle reaches the center rect area
      const nearRect = Math.abs(p.x - cw/2) < (cw - 84) * 0.04 && Math.abs(p.y - ch/2) < (ch - 84) * 0.04;
      p.alpha -= nearRect ? 0.03 : 0.004;

      if (p.alpha <= 0) continue;
      aliveCount++;

      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${Math.max(0, p.alpha).toFixed(2)})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // Burst: when most logo particles have faded, explode outward from center
    const detachedCount = particlesRef.current.filter(p => p.detached).length;
    const fadedCount = particlesRef.current.filter(p => p.detached && p.alpha <= 0).length;
    if (!burstDoneRef.current && elapsed > 1800 && fadedCount > detachedCount * 0.7) {
      burstDoneRef.current = true;
      const r = particlesRef.current[0]?.r ?? 255;
      const g = particlesRef.current[0]?.g ?? 255;
      const b = particlesRef.current[0]?.b ?? 255;
      // Compute center rect bounds for burst particle targets (match generation setup)
      const frameOff = 42;
      const bfw = cw - frameOff * 2;
      const bfh = ch - frameOff * 2;
      const brW = bfw * 0.07;
      const brH = bfh * 0.07;
      const brCX = cw / 2;
      const brCY = ch / 2;
      for (let i = 0; i < 25; i++) {
        const angle = (i / 25) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = 1.2 + Math.random() * 1.8;
        // Random slot in center rect — so burst particles also converge into shape
        const tgtX = brCX - brW/2 + Math.random() * brW;
        const tgtY = brCY - brH/2 + Math.random() * brH;
        particlesRef.current.push({
          x: cw / 2, y: ch / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 0.9, size: 1, delay: 0,
          detached: true, r, g, b,
          noiseOffset: Math.random() * Math.PI * 2,
          detachedAt: elapsed,
          targetX: tgtX,
          targetY: tgtY,
          pullStrength: 0.08 + Math.random() * 0.18,
          noiseAmp: Math.random() < 0.3 ? 0 : (0.02 + Math.random() * 0.06),
          damping: 0.88 + Math.random() * 0.09,
          jitterScale: 0.2 + Math.random() * 1.3,
          timeShift: Math.random() * 300,
          // Burst particles: short drift then bezier
          vacuumStartTime: elapsed + 150 + Math.random() * 200,
          vacuumDuration: 500 + Math.random() * 400,
          bezierOffset: (Math.random() - 0.5) * 0.7,
          vacuumActivated: false,
          bezierStartX: 0,
          bezierStartY: 0,
          bezierCtrlX: 0,
          bezierCtrlY: 0,
        });
      }
    }

    // Canvas fades out after 2.5s
    if (elapsed > 2500) {
      canvas.style.opacity = Math.max(0, 1 - (elapsed - 2500) / 1000).toFixed(2);
    }

    if ((aliveCount > 0 && elapsed < 3500) || elapsed < 2500) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      canvas.style.opacity = '0';
      ctx.clearRect(0, 0, cw, ch);
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!trigger || !ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.opacity = '1';
    startTimeRef.current = performance.now();
    burstDoneRef.current = false;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [trigger, ready, animate]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    />
  );
}
