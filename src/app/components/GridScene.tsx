'use client';

import { useRef, useEffect } from 'react';

// ─── 2D Perspective Grid ───
//
// Logic (matching the SUPERSELF logo):
//
// 1. OUTER RECT = the marquee frame (read from DOM via [data-frame])
// 2. INNER SQUARE = perfect square, centered inside outer rect
// 3. FOUR CORNERS = diagonals from outer corners to inner corners
//    These divide the space into 4 trapezoidal "walls"
// 4. EACH WALL gets grid lines:
//    - Depth lines: from points on outer edge to corresponding points on inner edge
//    - Cross lines: connecting the two diagonal edges at regular depth intervals
//
// Full-viewport canvas. Coordinates read from the actual frame element.
// No CSS positioning tricks — alignment guaranteed by DOM measurement.

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

      // Read the frame element's position
      const frameEl = document.querySelector('[data-frame]');
      if (!frameEl) return;
      const rect = frameEl.getBoundingClientRect();
      // Skip if frame isn't visible yet (display:none → zero rect)
      if (rect.width < 10 || rect.height < 10) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      canvas.width = vw * dpr;
      canvas.height = vh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);

      // ─── Step 1: Outer rectangle (= frame border, exact pixels) ───
      const oL = rect.left;
      const oT = rect.top;
      const oR = rect.right;
      const oB = rect.bottom;
      const oW = oR - oL;
      const oH = oB - oT;

      // ─── Step 2: Inner rectangle (same aspect ratio as outer, centered) ───
      // Matching aspect ratio creates a true tunnel perspective effect
      const cx = (oL + oR) / 2;
      const cy = (oT + oB) / 2;
      const scale = 0.06; // inner rect = 6% of outer
      const iW = oW * scale;
      const iH = oH * scale;
      const iL = cx - iW / 2;
      const iT = cy - iH / 2;
      const iR = cx + iW / 2;
      const iB = cy + iH / 2;

      const divisions = 6; // lines per wall edge (fewer = cleaner)
      const depthSteps = 8; // cross lines per wall

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      // Scroll offset for cross line animation
      const stepSize = 1 / depthSteps;
      const scrollNorm = (scrollRef.current % stepSize) / stepSize;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;

      // ─── Step 3: Four corner diagonals ───
      ctx.beginPath();
      ctx.moveTo(oL, oT); ctx.lineTo(iL, iT); // top-left
      ctx.moveTo(oR, oT); ctx.lineTo(iR, iT); // top-right
      ctx.moveTo(oL, oB); ctx.lineTo(iL, iB); // bottom-left
      ctx.moveTo(oR, oB); ctx.lineTo(iR, iB); // bottom-right
      ctx.stroke();

      // ─── Step 4: Depth lines per wall ───
      // Each wall: evenly spaced lines from outer edge to inner edge

      // Top wall
      for (let i = 1; i < divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(lerp(oL, oR, f), oT);
        ctx.lineTo(lerp(iL, iR, f), iT);
        ctx.stroke();
      }

      // Bottom wall
      for (let i = 1; i < divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(lerp(oL, oR, f), oB);
        ctx.lineTo(lerp(iL, iR, f), iB);
        ctx.stroke();
      }

      // Left wall
      for (let i = 1; i < divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(oL, lerp(oT, oB, f));
        ctx.lineTo(iL, lerp(iT, iB, f));
        ctx.stroke();
      }

      // Right wall
      for (let i = 1; i < divisions; i++) {
        const f = i / divisions;
        ctx.beginPath();
        ctx.moveTo(oR, lerp(oT, oB, f));
        ctx.lineTo(iR, lerp(iT, iB, f));
        ctx.stroke();
      }

      // ─── Step 5: Cross lines per wall (animated) ───
      // Each cross line connects the two diagonal edges of a wall at a given depth t

      for (let i = -1; i <= depthSteps + 1; i++) {
        const t = (i + scrollNorm) / depthSteps;
        if (t <= 0 || t >= 1) continue;

        // Top wall cross line: horizontal line from left diagonal to right diagonal
        const topY = lerp(oT, iT, t);
        const topXL = lerp(oL, iL, t);
        const topXR = lerp(oR, iR, t);
        ctx.beginPath();
        ctx.moveTo(topXL, topY);
        ctx.lineTo(topXR, topY);
        ctx.stroke();

        // Bottom wall cross line
        const botY = lerp(oB, iB, t);
        const botXL = lerp(oL, iL, t);
        const botXR = lerp(oR, iR, t);
        ctx.beginPath();
        ctx.moveTo(botXL, botY);
        ctx.lineTo(botXR, botY);
        ctx.stroke();

        // Left wall cross line: vertical line from top diagonal to bottom diagonal
        const leftX = lerp(oL, iL, t);
        const leftYT = lerp(oT, iT, t);
        const leftYB = lerp(oB, iB, t);
        ctx.beginPath();
        ctx.moveTo(leftX, leftYT);
        ctx.lineTo(leftX, leftYB);
        ctx.stroke();

        // Right wall cross line
        const rightX = lerp(oR, iR, t);
        const rightYT = lerp(oT, iT, t);
        const rightYB = lerp(oB, iB, t);
        ctx.beginPath();
        ctx.moveTo(rightX, rightYT);
        ctx.lineTo(rightX, rightYB);
        ctx.stroke();
      }

      // ─── Step 6: Inner rectangle outline ───
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
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
