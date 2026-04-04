'use client';

import { useRef, useEffect, useCallback } from 'react';

// ─── 2D Perspective Grid ───
// Reads the frame border element's actual position from the DOM.
// Converging lines point to center, clipped at inner square.
// Cross rings interpolate from outer frame to inner square.

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

    // Read the actual frame border position from DOM
    const frameEl = document.querySelector('[data-frame]');
    let oL: number, oT: number, oR: number, oB: number;

    if (frameEl) {
      const rect = frameEl.getBoundingClientRect();
      oL = rect.left;
      oT = rect.top;
      oR = rect.right;
      oB = rect.bottom;
    } else {
      // Fallback
      const inset = Math.max(30, Math.min(vw * 0.05, 60));
      oL = inset; oT = inset; oR = vw - inset; oB = vh - inset;
    }

    const oW = oR - oL;
    const oH = oB - oT;

    // Center point
    const cx = (oL + oR) / 2;
    const cy = (oT + oB) / 2;

    // Inner square: perfect square, centered, ~12% of smallest dimension
    const squareSize = Math.min(oW, oH) * 0.12;
    const iL = cx - squareSize / 2;
    const iT = cy - squareSize / 2;
    const iR = cx + squareSize / 2;
    const iB = cy + squareSize / 2;

    const divisions = 8;
    const layers = 10;
    const layerStep = 1 / layers;
    const scrollNorm = (scrollRef.current % layerStep) / layerStep;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    ctx.clearRect(0, 0, vw, vh);

    const lineColor = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    // ─── Converging lines: point to center, clipped at inner square ───
    // Use canvas clipping to cut lines at the inner square boundary

    ctx.save();

    // Clip region = everything OUTSIDE the inner square
    // Draw a huge rect, then cut out the inner square (even-odd rule)
    ctx.beginPath();
    ctx.rect(0, 0, vw, vh);            // outer (full canvas)
    ctx.rect(iL, iT, squareSize, squareSize); // inner (cut out)
    ctx.clip('evenodd');

    ctx.strokeStyle = lineColor;

    // Top edge → center
    for (let i = 0; i <= divisions; i++) {
      const x = lerp(oL, oR, i / divisions);
      ctx.beginPath();
      ctx.moveTo(x, oT);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }
    // Bottom edge → center
    for (let i = 0; i <= divisions; i++) {
      const x = lerp(oL, oR, i / divisions);
      ctx.beginPath();
      ctx.moveTo(x, oB);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }
    // Left edge → center
    for (let i = 0; i <= divisions; i++) {
      const y = lerp(oT, oB, i / divisions);
      ctx.beginPath();
      ctx.moveTo(oL, y);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }
    // Right edge → center
    for (let i = 0; i <= divisions; i++) {
      const y = lerp(oT, oB, i / divisions);
      ctx.beginPath();
      ctx.moveTo(oR, y);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }

    ctx.restore(); // remove clipping

    // ─── Cross rings: nested rectangles, eased spacing ───
    ctx.strokeStyle = lineColor;

    for (let i = -1; i <= layers + 1; i++) {
      const raw = (i + scrollNorm) / layers;
      if (raw < 0 || raw > 1) continue;

      // Quadratic ease — more space near center, less bunching
      const t = Math.pow(raw, 1.4);

      const rL = lerp(oL, iL, t);
      const rT = lerp(oT, iT, t);
      const rR = lerp(oR, iR, t);
      const rB = lerp(oB, iB, t);

      const rW = rR - rL;
      const rH = rB - rT;
      if (rW < 3 || rH < 3) continue;

      ctx.beginPath();
      ctx.rect(rL, rT, rW, rH);
      ctx.stroke();
    }

    // ─── Inner square outline ───
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
