'use client';

import { useRef, useEffect } from 'react';

// ─── 2D Perspective Grid ───
//
// Draws EVERYTHING in one canvas: frame border + grid.
// No CSS frame div needed — eliminates alignment issues.
// Calculates frame inset using the same formula as the CSS.

interface GridSceneProps {
  isVisible?: boolean;
}

export default function GridScene({ isVisible = true }: GridSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    let running = true;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      // Frame inset: same as CSS clamp(30px, 5vw, 60px)
      const inset = Math.max(30, Math.min(vw * 0.05, 60));

      // Outer rectangle = the frame
      const oL = inset;
      const oT = inset;
      const oR = vw - inset;
      const oB = vh - inset;
      const oW = oR - oL;
      const oH = oB - oT;

      // Inner rectangle (same aspect ratio, 6% scale)
      const cx = vw / 2;
      const cy = vh / 2;
      const scale = 0.06;
      const iW = oW * scale;
      const iH = oH * scale;
      const iL = cx - iW / 2;
      const iT = cy - iH / 2;
      const iR = cx + iW / 2;
      const iB = cy + iH / 2;

      const divisions = 6;
      const depthSteps = 8;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const stepSize = 1 / depthSteps;
      const scrollNorm = (scrollRef.current % stepSize) / stepSize;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;

      // ─── Frame border (replaces the CSS frame div) ───
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.rect(oL, oT, oW, oH);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';

      // ─── Corner diagonals ───
      ctx.beginPath();
      ctx.moveTo(oL, oT); ctx.lineTo(iL, iT);
      ctx.moveTo(oR, oT); ctx.lineTo(iR, iT);
      ctx.moveTo(oL, oB); ctx.lineTo(iL, iB);
      ctx.moveTo(oR, oB); ctx.lineTo(iR, iB);
      ctx.stroke();

      // ─── Depth lines per wall ───
      for (let i = 1; i < divisions; i++) {
        const f = i / divisions;
        // Top wall
        ctx.beginPath();
        ctx.moveTo(lerp(oL, oR, f), oT);
        ctx.lineTo(lerp(iL, iR, f), iT);
        ctx.stroke();
        // Bottom wall
        ctx.beginPath();
        ctx.moveTo(lerp(oL, oR, f), oB);
        ctx.lineTo(lerp(iL, iR, f), iB);
        ctx.stroke();
        // Left wall
        ctx.beginPath();
        ctx.moveTo(oL, lerp(oT, oB, f));
        ctx.lineTo(iL, lerp(iT, iB, f));
        ctx.stroke();
        // Right wall
        ctx.beginPath();
        ctx.moveTo(oR, lerp(oT, oB, f));
        ctx.lineTo(iR, lerp(iT, iB, f));
        ctx.stroke();
      }

      // ─── Cross lines per wall (animated) ───
      for (let i = -1; i <= depthSteps + 1; i++) {
        const t = (i + scrollNorm) / depthSteps;
        if (t <= 0 || t >= 1) continue;

        // Top wall
        ctx.beginPath();
        ctx.moveTo(lerp(oL, iL, t), lerp(oT, iT, t));
        ctx.lineTo(lerp(oR, iR, t), lerp(oT, iT, t));
        ctx.stroke();
        // Bottom wall
        ctx.beginPath();
        ctx.moveTo(lerp(oL, iL, t), lerp(oB, iB, t));
        ctx.lineTo(lerp(oR, iR, t), lerp(oB, iB, t));
        ctx.stroke();
        // Left wall
        ctx.beginPath();
        ctx.moveTo(lerp(oL, iL, t), lerp(oT, iT, t));
        ctx.lineTo(lerp(oL, iL, t), lerp(oB, iB, t));
        ctx.stroke();
        // Right wall
        ctx.beginPath();
        ctx.moveTo(lerp(oR, iR, t), lerp(oT, iT, t));
        ctx.lineTo(lerp(oR, iR, t), lerp(oB, iB, t));
        ctx.stroke();
      }

      // ─── Inner rectangle outline ───
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.rect(iL, iT, iW, iH);
      ctx.stroke();
    };

    const animate = () => {
      if (!running) return;
      scrollRef.current += 0.0004;
      draw();
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener('resize', draw);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', draw);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 1.5s ease',
        pointerEvents: 'none',
      }}
    />
  );
}
