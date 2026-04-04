'use client';

import { useRef, useEffect, useCallback } from 'react';

// ─── 2D Perspective Grid ───
// Nested rectangles from outer frame to a perfect center square.
// Evenly spaced in screen space (like the logo). No 3D — pure 2D illusion.
// Lines connect corresponding corners/edges between layers.

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

    // Size canvas to viewport
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Frame inset (matches CSS: clamp(30px, 5vw, 60px))
    const inset = Math.max(30, Math.min(vw * 0.05, 60));

    // Outer rectangle (matches the marquee frame)
    const outerL = inset;
    const outerT = inset;
    const outerR = vw - inset;
    const outerB = vh - inset;
    const outerW = outerR - outerL;
    const outerH = outerB - outerT;

    // Inner square: perfect square at center
    const centerX = vw / 2;
    const centerY = vh / 2;
    const squareSize = Math.min(outerW, outerH) * 0.06; // small square
    const innerL = centerX - squareSize / 2;
    const innerT = centerY - squareSize / 2;
    const innerR = centerX + squareSize / 2;
    const innerB = centerY + squareSize / 2;

    // Clear
    ctx.clearRect(0, 0, vw, vh);

    // Number of grid divisions per edge
    const divisions = 8;
    // Number of depth layers (nested rectangles)
    const layers = 12;

    // Scroll offset for animation (0 to 1, loops every layer step)
    const layerStep = 1 / layers;
    const scroll = scrollRef.current % layerStep;
    const scrollNorm = scroll / layerStep; // 0 to 1 within one step

    // Helper: interpolate between outer and inner rect at t (0=outer, 1=inner)
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const rectAt = (t: number) => ({
      l: lerp(outerL, innerL, t),
      t: lerp(outerT, innerT, t),
      r: lerp(outerR, innerR, t),
      b: lerp(outerB, innerB, t),
    });

    // ─── Draw cross rings (nested rectangles) ───
    // Draw layers+2 rings, shifted by scroll offset, for seamless loop
    for (let i = -1; i <= layers + 1; i++) {
      const t = (i + scrollNorm) / layers;
      if (t < -0.05 || t > 1.05) continue; // skip far out-of-range

      const tClamped = Math.max(0, Math.min(1, t));
      const r = rectAt(tClamped);

      // Brightness: fade toward center
      const alpha = Math.max(0.03, 0.3 * Math.pow(1 - tClamped, 0.8));

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(r.l, r.t, r.r - r.l, r.b - r.t);
      ctx.stroke();
    }

    // ─── Draw converging lines (connect outer edge points to inner edge points) ───
    for (let i = 0; i <= divisions; i++) {
      const frac = i / divisions;

      // Outer edge points
      const oxTop = lerp(outerL, outerR, frac);
      const oyLeft = lerp(outerT, outerB, frac);

      // Inner edge points (same fraction on the square)
      const ixTop = lerp(innerL, innerR, frac);
      const iyLeft = lerp(innerT, innerB, frac);

      // Gradient from bright (outer) to dim (inner)
      const grad1 = ctx.createLinearGradient(oxTop, outerT, ixTop, innerT);
      grad1.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      grad1.addColorStop(1, 'rgba(255, 255, 255, 0.03)');

      ctx.strokeStyle = grad1;
      ctx.lineWidth = 1;

      // Top edge → inner top
      ctx.beginPath();
      ctx.moveTo(oxTop, outerT);
      ctx.lineTo(ixTop, innerT);
      ctx.stroke();

      // Bottom edge → inner bottom
      const grad2 = ctx.createLinearGradient(oxTop, outerB, ixTop, innerB);
      grad2.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      grad2.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
      ctx.strokeStyle = grad2;
      ctx.beginPath();
      ctx.moveTo(oxTop, outerB);
      ctx.lineTo(ixTop, innerB);
      ctx.stroke();

      // Left edge → inner left
      const grad3 = ctx.createLinearGradient(outerL, oyLeft, innerL, iyLeft);
      grad3.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      grad3.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
      ctx.strokeStyle = grad3;
      ctx.beginPath();
      ctx.moveTo(outerL, oyLeft);
      ctx.lineTo(innerL, iyLeft);
      ctx.stroke();

      // Right edge → inner right
      const grad4 = ctx.createLinearGradient(outerR, oyLeft, innerR, iyLeft);
      grad4.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      grad4.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
      ctx.strokeStyle = grad4;
      ctx.beginPath();
      ctx.moveTo(outerR, oyLeft);
      ctx.lineTo(innerR, iyLeft);
      ctx.stroke();
    }
  }, []);

  // Animation loop
  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;
      scrollRef.current += 0.0008;
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
