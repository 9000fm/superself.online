'use client';

import { useRef, useEffect, useCallback } from 'react';

// ─── 2D Perspective Grid ───
// Nested rectangles from outer frame to center point.
// Converging lines radiate from center to edge points (no crossing).
// All lines solid white, no opacity tricks.

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

    // Frame inset (matches CSS: clamp(30px, 5vw, 60px))
    const inset = Math.max(30, Math.min(vw * 0.05, 60));

    // Outer rectangle = the marquee frame
    const oL = inset;
    const oT = inset;
    const oR = vw - inset;
    const oB = vh - inset;

    // Center point (vanishing point)
    const cx = vw / 2;
    const cy = vh / 2;

    // Grid config
    const divisions = 8;     // lines per edge
    const layers = 14;       // nested rectangles

    // Scroll offset
    const layerStep = 1 / layers;
    const scrollNorm = (scrollRef.current % layerStep) / layerStep;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    ctx.clearRect(0, 0, vw, vh);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;

    // ─── Converging lines: from edge points straight to center ───
    // These are static — they define the perspective "rails"

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

    // ─── Cross rings: nested rectangles shrinking toward center ───
    // Animated — drift inward smoothly

    for (let i = -1; i <= layers + 1; i++) {
      const t = (i + scrollNorm) / layers;
      if (t < 0 || t > 1) continue;

      // Ease: slow down near center so rings don't bunch up
      const eased = t;

      const rL = lerp(oL, cx, eased);
      const rT = lerp(oT, cy, eased);
      const rR = lerp(oR, cx, eased);
      const rB = lerp(oB, cy, eased);

      // Skip if rectangle is too small to see
      if (rR - rL < 2 || rB - rT < 2) continue;

      ctx.beginPath();
      ctx.rect(rL, rT, rR - rL, rB - rT);
      ctx.stroke();
    }
  }, []);

  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      scrollRef.current += 0.0004; // slow drift
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
