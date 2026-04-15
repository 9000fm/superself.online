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
  delay: number;
  detached: boolean;
  r: number;
  g: number;
  b: number;
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
          const distFromCenter = Math.sqrt((x - w/2) ** 2 + (y - h/2) ** 2);
          const maxDist = Math.sqrt(w * w + h * h) / 2;
          // Edges detach FIRST (delay ~0), center last (~1400ms). No random padding on fastest.
          const normalized = 1 - distFromCenter / maxDist; // 0=edge, 1=center
          const delay = normalized * 1400 + (normalized > 0.1 ? Math.random() * 200 : 0);
          const speed = 0.3 + Math.random() * 0.8;
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;

          particles.push({
            x: px, y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1, size: blockSize, delay,
            detached: false, r: tR, g: tG, b: tB,
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
        ctx.fillRect(p.x, p.y, 1, 1);
        aliveCount++;
        continue;
      }

      if (!p.detached) { p.detached = true; p.alpha = 1.0; }

      p.x += p.vx;
      p.y += p.vy;

      // Fade when particle reaches the center rect area (matching GridScene proportions)
      const nearRect = Math.abs(p.x - cw/2) < (cw - 84) * 0.04 && Math.abs(p.y - ch/2) < (ch - 84) * 0.04;
      p.alpha -= nearRect ? 0.03 : 0.004;

      if (p.alpha <= 0) continue;
      aliveCount++;

      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${Math.max(0, p.alpha).toFixed(2)})`;
      ctx.fillRect(p.x, p.y, 1, 1);
    }

    // Burst: when most logo particles have faded, explode outward from center
    const detachedCount = particlesRef.current.filter(p => p.detached).length;
    const fadedCount = particlesRef.current.filter(p => p.detached && p.alpha <= 0).length;
    if (!burstDoneRef.current && elapsed > 1800 && fadedCount > detachedCount * 0.7) {
      burstDoneRef.current = true;
      const r = particlesRef.current[0]?.r ?? 255;
      const g = particlesRef.current[0]?.g ?? 255;
      const b = particlesRef.current[0]?.b ?? 255;
      for (let i = 0; i < 25; i++) {
        const angle = (i / 25) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = 1.2 + Math.random() * 1.8;
        particlesRef.current.push({
          x: cw / 2, y: ch / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 0.9, size: 1, delay: 0,
          detached: true, r, g, b,
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
