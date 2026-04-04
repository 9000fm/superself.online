'use client';

import { useRef, useEffect } from 'react';

// ─── 2D Perspective Grid ───
// Positioned with the SAME CSS insets as the frame border.
// Draws from (0,0) to fill the canvas — alignment is guaranteed.
// Converging lines per-wall (clipped to their own trapezoid).
// Inner square at center stays blank.

interface GridSceneProps {
  isVisible?: boolean;
  frameInset: string;       // CSS value for top/left/right
  frameInsetBottom: string;  // CSS value for bottom
}

export default function GridScene({ isVisible = true, frameInset, frameInsetBottom }: GridSceneProps) {
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
      // Use the canvas element's actual rendered size
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Outer rect = full canvas (which IS the frame)
      const oL = 0;
      const oT = 0;
      const oR = w;
      const oB = h;

      // Center
      const cx = w / 2;
      const cy = h / 2;

      // Inner square: perfect square, 10% of smallest side
      const squareSize = Math.min(w, h) * 0.10;
      const iL = cx - squareSize / 2;
      const iT = cy - squareSize / 2;
      const iR = cx + squareSize / 2;
      const iB = cy + squareSize / 2;

      const divisions = 8;
      const layers = 10;
      const layerStep = 1 / layers;
      const scrollNorm = (scrollRef.current % layerStep) / layerStep;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;

      // ─── Converging lines per wall (clipped to own trapezoid) ───

      // Top wall: trapezoid from top outer edge to top inner square edge
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(oL, oT); ctx.lineTo(oR, oT);
      ctx.lineTo(iR, iT); ctx.lineTo(iL, iT);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i <= divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(lerp(oL, oR, f), oT);
        ctx.lineTo(lerp(iL, iR, f), iT);
        ctx.stroke();
      }
      ctx.restore();

      // Bottom wall
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(oL, oB); ctx.lineTo(oR, oB);
      ctx.lineTo(iR, iB); ctx.lineTo(iL, iB);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i <= divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(lerp(oL, oR, f), oB);
        ctx.lineTo(lerp(iL, iR, f), iB);
        ctx.stroke();
      }
      ctx.restore();

      // Left wall
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(oL, oT); ctx.lineTo(oL, oB);
      ctx.lineTo(iL, iB); ctx.lineTo(iL, iT);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i <= divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(oL, lerp(oT, oB, f));
        ctx.lineTo(iL, lerp(iT, iB, f));
        ctx.stroke();
      }
      ctx.restore();

      // Right wall
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(oR, oT); ctx.lineTo(oR, oB);
      ctx.lineTo(iR, iB); ctx.lineTo(iR, iT);
      ctx.closePath();
      ctx.clip();
      for (let i = 0; i <= divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(oR, lerp(oT, oB, f));
        ctx.lineTo(iR, lerp(iT, iB, f));
        ctx.stroke();
      }
      ctx.restore();

      // ─── Cross rings ───
      for (let i = -1; i <= layers + 1; i++) {
        const raw = (i + scrollNorm) / layers;
        if (raw < 0 || raw > 1) continue;

        const rL = lerp(oL, iL, raw);
        const rT = lerp(oT, iT, raw);
        const rR = lerp(oR, iR, raw);
        const rB = lerp(oB, iB, raw);

        if (rR - rL < 3 || rB - rT < 3) continue;

        ctx.beginPath();
        ctx.rect(rL, rT, rR - rL, rB - rT);
        ctx.stroke();
      }

      // ─── Inner square outline ───
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.rect(iL, iT, squareSize, squareSize);
      ctx.stroke();
    };

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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: frameInset,
        left: frameInset,
        right: frameInset,
        bottom: frameInsetBottom,
        zIndex: 1,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 1.5s ease',
        pointerEvents: 'none',
      }}
    />
  );
}
