'use client';

import { useRef, useEffect } from 'react';

// ─── 2D Perspective Grid ───
//
// Draws the INNER grid only (diagonals, depth lines, cross lines, inner rect).
// The OUTER frame border is handled by the CSS frame div — never touched here.
// Reads frame position from DOM via [data-frame] getBoundingClientRect().

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

      // Read actual frame position from DOM
      const frameEl = document.querySelector('[data-frame]');
      if (!frameEl) return;
      const rect = frameEl.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return; // frame not visible yet

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      // Outer rect = frame border position (exact from CSS)
      const oL = rect.left;
      const oT = rect.top;
      const oR = rect.right;
      const oB = rect.bottom;
      const oW = oR - oL;
      const oH = oB - oT;

      // Inner rect: same aspect ratio as frame, 6% scale
      const cx = (oL + oR) / 2;
      const cy = (oT + oB) / 2;
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
        ctx.beginPath();
        ctx.moveTo(lerp(oL, oR, f), oT); ctx.lineTo(lerp(iL, iR, f), iT);
        ctx.moveTo(lerp(oL, oR, f), oB); ctx.lineTo(lerp(iL, iR, f), iB);
        ctx.moveTo(oL, lerp(oT, oB, f)); ctx.lineTo(iL, lerp(iT, iB, f));
        ctx.moveTo(oR, lerp(oT, oB, f)); ctx.lineTo(iR, lerp(iT, iB, f));
        ctx.stroke();
      }

      // ─── Cross lines per wall (animated) ───
      for (let i = -1; i <= depthSteps + 1; i++) {
        const t = (i + scrollNorm) / depthSteps;
        if (t <= 0 || t >= 1) continue;

        const topY = lerp(oT, iT, t);
        const botY = lerp(oB, iB, t);
        const leftX = lerp(oL, iL, t);
        const rightX = lerp(oR, iR, t);

        ctx.beginPath();
        // Top wall cross line
        ctx.moveTo(leftX, topY); ctx.lineTo(rightX, topY);
        // Bottom wall cross line
        ctx.moveTo(leftX, botY); ctx.lineTo(rightX, botY);
        // Left wall cross line
        ctx.moveTo(leftX, topY); ctx.lineTo(leftX, botY);
        // Right wall cross line
        ctx.moveTo(rightX, topY); ctx.lineTo(rightX, botY);
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
