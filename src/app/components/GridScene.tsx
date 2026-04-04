'use client';

import { useRef, useEffect } from 'react';

// ─── 2D Perspective Grid ───
//
// This canvas lives INSIDE the frame div. Its (0,0) IS the frame's top-left.
// No coordinate conversion needed. Alignment is guaranteed by DOM hierarchy.
// Draws: corner diagonals, depth lines, cross lines, inner rect.
// Does NOT draw the outer border — the parent div's CSS border handles that.

export default function GridScene() {
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

      // Canvas fills the frame div — use its actual rendered size
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 10 || h < 10) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);

      // Outer rect = full canvas = frame content area
      const oL = 0;
      const oT = 0;
      const oR = w;
      const oB = h;

      // Inner rect: same aspect ratio, 6% scale
      const cx = w / 2;
      const cy = h / 2;
      const scale = 0.04;
      const iW = w * scale;
      const iH = h * scale;
      const iL = cx - iW / 2;
      const iT = cy - iH / 2;
      const iR = cx + iW / 2;
      const iB = cy + iH / 2;

      const divisions = 6;
      const depthSteps = 20;
      const snap = (v: number) => Math.round(v) + 0.5;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const stepSize = 1 / depthSteps;
      const scrollNorm = (scrollRef.current % stepSize) / stepSize;

      const depthEase = (t: number) => 1 - Math.pow(1 - t, 3);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;

      // ─── Corner diagonals ───
      ctx.beginPath();
      ctx.moveTo(snap(oL), snap(oT)); ctx.lineTo(snap(iL), snap(iT));
      ctx.moveTo(snap(oR), snap(oT)); ctx.lineTo(snap(iR), snap(iT));
      ctx.moveTo(snap(oL), snap(oB)); ctx.lineTo(snap(iL), snap(iB));
      ctx.moveTo(snap(oR), snap(oB)); ctx.lineTo(snap(iR), snap(iB));
      ctx.stroke();

      // ─── Depth lines per wall ───
      for (let i = 1; i < divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(snap(lerp(oL, oR, f)), snap(oT)); ctx.lineTo(snap(lerp(iL, iR, f)), snap(iT));
        ctx.moveTo(snap(lerp(oL, oR, f)), snap(oB)); ctx.lineTo(snap(lerp(iL, iR, f)), snap(iB));
        ctx.moveTo(snap(oL), snap(lerp(oT, oB, f))); ctx.lineTo(snap(iL), snap(lerp(iT, iB, f)));
        ctx.moveTo(snap(oR), snap(lerp(oT, oB, f))); ctx.lineTo(snap(iR), snap(lerp(iT, iB, f)));
        ctx.stroke();
      }

      // ─── Cross lines per wall (animated, denser near center) ───
      for (let i = -1; i <= depthSteps + 1; i++) {
        const rawT = (i + scrollNorm) / depthSteps;
        if (rawT <= 0 || rawT >= 1) continue;
        const t = depthEase(rawT);

        const topY = snap(lerp(oT, iT, t));
        const botY = snap(lerp(oB, iB, t));
        const leftX = snap(lerp(oL, iL, t));
        const rightX = snap(lerp(oR, iR, t));

        ctx.beginPath();
        ctx.moveTo(leftX, topY); ctx.lineTo(rightX, topY);
        ctx.moveTo(leftX, botY); ctx.lineTo(rightX, botY);
        ctx.moveTo(leftX, topY); ctx.lineTo(leftX, botY);
        ctx.moveTo(rightX, topY); ctx.lineTo(rightX, botY);
        ctx.stroke();
      }

      // ─── Inner rectangle outline ───
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.rect(snap(iL), snap(iT), Math.round(iW), Math.round(iH));
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
      }}
    />
  );
}
