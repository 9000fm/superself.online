'use client';

import { useRef, useEffect, useCallback } from 'react';

// ─── 2D Perspective Grid ───
// Outer rectangle (=marquee frame) → inner square (blank center).
// Each wall connects its edge points to the corresponding inner square edge.
// No lines inside the square — it stays empty.

interface GridSceneProps {
  isVisible?: boolean;
}

export default function GridScene({ isVisible = true }: GridSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);

  const draw = useCallback(() => {
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

    // Frame inset — match the marquee exactly
    // CSS uses: max(clamp(30px, 5vw, 60px), env(safe-area-inset-*, 0px))
    // Subtract 0.5 so grid lines sit ON the frame border
    const inset = Math.max(30, Math.min(vw * 0.05, 60)) - 0.5;

    // Outer rectangle (marquee frame edges)
    const oL = inset;
    const oT = inset;
    const oR = vw - inset;
    const oB = vh - inset;
    const oW = oR - oL;
    const oH = oB - oT;

    // Inner square — perfect square, centered, visible size
    const cx = vw / 2;
    const cy = vh / 2;
    const squareSize = Math.min(oW, oH) * 0.12;
    const iL = cx - squareSize / 2;
    const iT = cy - squareSize / 2;
    const iR = cx + squareSize / 2;
    const iB = cy + squareSize / 2;

    const divisions = 8;
    const layers = 12;
    const layerStep = 1 / layers;
    const scrollNorm = (scrollRef.current % layerStep) / layerStep;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    ctx.clearRect(0, 0, vw, vh);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    // ─── Converging lines: each wall connects to its own inner square edge ───

    // Top wall: top outer edge → top inner edge
    for (let i = 0; i <= divisions; i++) {
      const f = i / divisions;
      ctx.beginPath();
      ctx.moveTo(lerp(oL, oR, f), oT);
      ctx.lineTo(lerp(iL, iR, f), iT);
      ctx.stroke();
    }

    // Bottom wall: bottom outer edge → bottom inner edge
    for (let i = 0; i <= divisions; i++) {
      const f = i / divisions;
      ctx.beginPath();
      ctx.moveTo(lerp(oL, oR, f), oB);
      ctx.lineTo(lerp(iL, iR, f), iB);
      ctx.stroke();
    }

    // Left wall: left outer edge → left inner edge
    for (let i = 0; i <= divisions; i++) {
      const f = i / divisions;
      ctx.beginPath();
      ctx.moveTo(oL, lerp(oT, oB, f));
      ctx.lineTo(iL, lerp(iT, iB, f));
      ctx.stroke();
    }

    // Right wall: right outer edge → right inner edge
    for (let i = 0; i <= divisions; i++) {
      const f = i / divisions;
      ctx.beginPath();
      ctx.moveTo(oR, lerp(oT, oB, f));
      ctx.lineTo(iR, lerp(iT, iB, f));
      ctx.stroke();
    }

    // ─── Cross rings: nested rectangles from outer to inner square ───
    for (let i = -1; i <= layers + 1; i++) {
      const t = (i + scrollNorm) / layers;
      if (t < 0 || t > 1) continue;

      const rL = lerp(oL, iL, t);
      const rT = lerp(oT, iT, t);
      const rR = lerp(oR, iR, t);
      const rB = lerp(oB, iB, t);

      const rW = rR - rL;
      const rH = rB - rT;
      if (rW < 2 || rH < 2) continue;

      ctx.beginPath();
      ctx.rect(rL, rT, rW, rH);
      ctx.stroke();
    }

    // ─── Inner square outline (always visible, slightly brighter) ───
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.rect(iL, iT, squareSize, squareSize);
    ctx.stroke();
  }, []);

  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      scrollRef.current += 0.0004;
      draw();
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [draw]);

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
