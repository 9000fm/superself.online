'use client';

import { useRef, useEffect } from 'react';

// ─── Particle type ───
interface Particle {
  wall: number;    // 0=top, 1=bottom, 2=left, 3=right
  pos: number;     // 0-1 position across the wall
  depth: number;   // 0=center (spawn), 1=outer edge (die)
  speed: number;   // depth units per second
  trail: number[]; // previous depth values for trail
  brightness: number; // 0.3-1
}

// ─── 2D Perspective Grid + Wall Particles ───

export default function GridScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const startTime = useRef(0);
  const particles = useRef<Particle[]>([]);
  const lastTime = useRef(0);

  useEffect(() => {
    let running = true;
    startTime.current = performance.now();
    lastTime.current = performance.now();

    // Spawn initial particles
    const spawnParticle = (): Particle => ({
      wall: Math.floor(Math.random() * 4),
      pos: Math.random(),
      depth: Math.random() * 0.03,            // start near center
      speed: 0.015 + Math.random() * 0.04,
      trail: [],
      brightness: 0.3 + Math.random() * 0.7,
    });

    // Pre-populate
    for (let i = 0; i < 150; i++) {
      const p = spawnParticle();
      p.depth = Math.random(); // scatter across depth
      particles.current.push(p);
    }

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 10 || h < 10) return;

      const now = performance.now();
      const dt = Math.min((now - lastTime.current) / 1000, 0.05);
      lastTime.current = now;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);

      // Outer rect
      const oL = 0, oT = 0, oR = w, oB = h;

      // Inner rect
      const cx = w / 2;
      const cy = h / 2;
      const scale = 0.07;
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

      // ─── Cross lines (animated) ───
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

      // ─── Glow halo behind the rectangle ───
      const glowSize = Math.max(iW, iH) * 3;
      const glowGrad = ctx.createRadialGradient(cx, cy, Math.min(iW, iH) * 0.3, cx, cy, glowSize);
      glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      glowGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(cx - glowSize, cy - glowSize, glowSize * 2, glowSize * 2);

      // ─── Inner rectangle ───
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(Math.round(iL), Math.round(iT), Math.round(iW), Math.round(iH));

      // ─── Wall particles ───
      // Project a particle to screen coordinates based on wall, position, and depth
      const projectParticle = (wall: number, pos: number, depth: number): [number, number] => {
        // depth: 0 = at inner rect, 1 = at outer rect
        // Use same perspective easing as grid
        const t = 1 - depth; // invert: 0=outer, 1=inner for lerp
        const eased = depthEase(t);

        switch (wall) {
          case 0: // top wall
            return [lerp(lerp(oL, oR, pos), lerp(iL, iR, pos), eased),
                    lerp(oT, iT, eased)];
          case 1: // bottom wall
            return [lerp(lerp(oL, oR, pos), lerp(iL, iR, pos), eased),
                    lerp(oB, iB, eased)];
          case 2: // left wall
            return [lerp(oL, iL, eased),
                    lerp(lerp(oT, oB, pos), lerp(iT, iB, pos), eased)];
          case 3: // right wall
            return [lerp(oR, iR, eased),
                    lerp(lerp(oT, oB, pos), lerp(iT, iB, pos), eased)];
          default:
            return [cx, cy];
        }
      };

      // Delayed entrance — particles start appearing after 5s
      const elapsed = (now - startTime.current) / 1000;
      const particleOpacity = Math.min(1, Math.max(0, (elapsed - 5) / 3));

      if (particleOpacity > 0) {
        // Update particles
        const pts = particles.current;
        for (let i = pts.length - 1; i >= 0; i--) {
          const p = pts[i];

          // Store trail
          p.trail.push(p.depth);
          if (p.trail.length > 14) p.trail.shift();

          // Moving OUTWARD — slow at center, faster toward edges
          const accel = 0.1 + p.depth * p.depth * 6;
          p.depth += p.speed * accel * dt;

          // Die at edge, respawn at center
          if (p.depth >= 1) {
            pts[i] = spawnParticle();
          }
        }

        // Maintain particle count
        while (pts.length < 150) pts.push(spawnParticle());

        // Draw particles with trails
        for (const p of pts) {
          // Size: big at edge, tiny near center
          const size = 1.5 + p.depth * 5;
          const alpha = particleOpacity * p.brightness * (0.15 + p.depth * 0.85);

          // Draw trail — swoosh from outer (old) to inner (current)
          if (p.trail.length > 1) {
            for (let t = 0; t < p.trail.length - 1; t++) {
              const trailProgress = t / p.trail.length;
              const trailAlpha = alpha * trailProgress * 0.35;
              if (trailAlpha < 0.01) continue;
              const [x1, y1] = projectParticle(p.wall, p.pos, p.trail[t]);
              const [x2, y2] = projectParticle(p.wall, p.pos, p.trail[t + 1]);
              const trailSize = size * (0.3 + trailProgress * 0.7);
              ctx.strokeStyle = `rgba(255, 255, 255, ${trailAlpha})`;
              ctx.lineWidth = trailSize * 0.6;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          }

          // Particle head
          const [px, py] = projectParticle(p.wall, p.pos, p.depth);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(px, py, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      }
    };

    const animate = () => {
      if (!running) return;
      scrollRef.current -= 0.0004;
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
