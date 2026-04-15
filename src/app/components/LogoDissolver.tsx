'use client';

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
  size: number;
  growRate: number;
  delay: number;
  detached: boolean;
  r: number;
  g: number;
  b: number;
}

/**
 * Full-screen particle overlay. PNG stays visible underneath and fades out.
 * Particles spawn from the logo position and float away. No canvas swap.
 */
export function LogoDissolver({ logoRect, src, trigger, onComplete }: LogoDissolverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load image to sample pixel positions (just for alpha mask)
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

      // Get foreground color for particles
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

      // Build particles
      const particles: Particle[] = [];
      const blockSize = 2;
      const maxDiag = w + h;
      const ox = Math.round(logoRect.x);
      const oy = Math.round(logoRect.y);

      for (let y = 0; y < h; y += blockSize) {
        for (let x = 0; x < w; x += blockSize) {
          if (data.data[(y * w + x) * 4 + 3] < 30) continue;
          // Random delay — Endgame snap style (not diagonal, purely random)
          const delay = Math.random() * 1800;
          particles.push({
            x: ox + x, y: oy + y,
            // Wind carries particles to the right + slight upward drift
            vx: 0.4 + Math.random() * 1.2,
            vy: (Math.random() - 0.6) * 0.6,
            alpha: 1,
            size: blockSize,
            growRate: 0.002 + Math.random() * 0.004,
            delay,
            detached: false,
            r: tR, g: tG, b: tB,
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let aliveCount = 0;
    const preFade = 200;

    for (const p of particlesRef.current) {
      const timeToDetach = p.delay - elapsed;

      // Not yet detached — draw at origin (the logo stays visible)
      if (timeToDetach > preFade) {
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},1)`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        aliveCount++;
        continue;
      }

      // Pre-detach shimmer
      if (timeToDetach > 0) {
        const fadeT = 1 - (timeToDetach / preFade);
        const jx = (Math.random() - 0.5) * fadeT * 1.5;
        const jy = (Math.random() - 0.5) * fadeT * 1.5;
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${(1 - fadeT * 0.3).toFixed(2)})`;
        ctx.fillRect(p.x + jx, p.y + jy, p.size, p.size);
        aliveCount++;
        continue;
      }

      // Detach
      if (!p.detached) {
        p.detached = true;
        p.alpha = 0.7;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.012;
      p.alpha -= 0.013;
      p.size += p.growRate;

      if (p.alpha <= 0) continue;
      aliveCount++;

      const s = Math.min(p.size, 5);
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${Math.max(0, p.alpha).toFixed(2)})`;
      ctx.fillRect(p.x, p.y, s, s);
    }

    if (aliveCount > 0 && elapsed < 4000) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    if (!trigger || !ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    startTimeRef.current = performance.now();
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
        zIndex: 100,
        pointerEvents: 'none',
      }}
    />
  );
}
