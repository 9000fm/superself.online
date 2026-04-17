'use client';

import { useRef, useEffect } from 'react';

// ─── Types ───
interface Particle {
  wall: number;
  pos: number;
  depth: number;
  speed: number;
  trail: number[];
  brightness: number;
}


// ─── 2D Perspective Grid + Ball + Particles ───

interface GridSceneProps {
  dissolving?: boolean;
}

export default function GridScene({ dissolving: dissolvingProp }: GridSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const startTime = useRef(0);
  const particles = useRef<Particle[]>([]);
  const lastTime = useRef(0);
  const dissolveStartRef = useRef<number>(0);
  const prevDissolving = useRef(false);
  const dissolvingRef = useRef(false);

  // Sync dissolving prop to ref so the draw loop can read it
  useEffect(() => {
    const wasDissolving = dissolvingRef.current;
    dissolvingRef.current = !!dissolvingProp;
    if (dissolvingProp && !wasDissolving) {
      dissolveStartRef.current = performance.now();
    }
  }, [dissolvingProp]);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const depthEase = (t: number) => 1 - Math.pow(1 - t, 3);

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

    // Start empty — particles spawn gradually from center
    particles.current = [];
    let spawnTimer = 0;
    const MAX_PARTICLES = 150;
    const SPAWN_RATE = 80; // ms between spawns (starts slow, fills up over ~12s)

    // Tunnel fly — Lévy flight creature
    const flyState = {
      active: false,
      x: 0.5, y: 0.5, depth: 0.2,
      vx: 0, vy: 0, vDepth: 0,
      tx: 0.5, ty: 0.5, tDepth: 0.2,
      lifeLeft: 0,
      nextMove: 0,
      lastGone: 0,
      nextWait: 6000 + Math.random() * 4000, // first fly appears 6-10s after load
    };

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

      // Read dissolving state from ref (synced via useEffect)
      const dissolving = dissolvingRef.current;

      // Read actual foreground color — grid lines always match text/icons/frame
      const theme = document.documentElement.dataset.theme || 'dark';
      let fgR = 255, fgG = 255, fgB = 255;
      if (theme === 'white') {
        fgR = 0; fgG = 0; fgB = 0;
      } else if (theme === 'color') {
        const hex = document.documentElement.style.getPropertyValue('--foreground').trim();
        if (hex && hex.startsWith('#')) {
          const h = hex.replace('#', '');
          fgR = parseInt(h.slice(0, 2), 16) || 0;
          fgG = parseInt(h.slice(2, 4), 16) || 0;
          fgB = parseInt(h.slice(4, 6), 16) || 0;
        }
      }

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
      const stepSize = 1 / depthSteps;
      const scrollNorm = (scrollRef.current % stepSize) / stepSize;

      // During dissolution: grid lines fade in at T+1.8s over 1.5s
      let lineAlpha = 0.3;
      if (dissolving) {
        const dElapsed = (performance.now() - dissolveStartRef.current) / 1000;
        lineAlpha = dElapsed < 1.8 ? 0 : Math.min(0.3, (dElapsed - 1.8) / 1.5 * 0.3);
      }
      ctx.strokeStyle = `rgba(${fgR}, ${fgG}, ${fgB}, ${lineAlpha})`;
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

      // ─── Glow halo behind the rectangle (hidden during early dissolution) ───
      let glowAlpha = 1;
      if (dissolving) {
        const dE2 = (performance.now() - dissolveStartRef.current) / 1000;
        glowAlpha = dE2 < 1.8 ? 0 : Math.min(1, (dE2 - 1.8) / 1.5);
      }
      if (glowAlpha > 0) {
        const glowSize = Math.max(iW, iH) * 3;
        const glowGrad = ctx.createRadialGradient(cx, cy, Math.min(iW, iH) * 0.3, cx, cy, glowSize);
        glowGrad.addColorStop(0, `rgba(${fgR}, ${fgG}, ${fgB}, ${0.12 * glowAlpha})`);
        glowGrad.addColorStop(0.4, `rgba(${fgR}, ${fgG}, ${fgB}, ${0.04 * glowAlpha})`);
        glowGrad.addColorStop(1, `rgba(${fgR}, ${fgG}, ${fgB}, 0)`);
        ctx.fillStyle = glowGrad;
        ctx.fillRect(cx - glowSize, cy - glowSize, glowSize * 2, glowSize * 2);
      }

      // ─── Inner rectangle — smooth fade during dissolution ───
      if (dissolving) {
        const dissolveElapsed = (performance.now() - dissolveStartRef.current) / 1000;
        // Rect fades in: starts at T+2.0s (after particles damp), fully solid by T+3.0s
        const rectAlpha = dissolveElapsed < 2.0 ? 0 : Math.min(1, (dissolveElapsed - 2.0) / 1.0);
        if (rectAlpha > 0) {
          ctx.fillStyle = `rgba(${fgR}, ${fgG}, ${fgB}, ${rectAlpha.toFixed(2)})`;
          ctx.fillRect(Math.floor(iL), Math.floor(iT), Math.ceil(iW) + 1, Math.ceil(iH) + 1);
        }
      } else {
        ctx.fillStyle = `rgba(${fgR}, ${fgG}, ${fgB}, 0.9)`;
        ctx.fillRect(Math.floor(iL), Math.floor(iT), Math.ceil(iW) + 1, Math.ceil(iH) + 1);
      }


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

        // Gradually spawn particles from center (not all at once)
        spawnTimer += dt * 1000;
        if (pts.length < MAX_PARTICLES && spawnTimer >= SPAWN_RATE) {
          spawnTimer = 0;
          pts.push(spawnParticle()); // spawns at center (depth ~0)
        }

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
              ctx.strokeStyle = `rgba(${fgR}, ${fgG}, ${fgB}, ${trailAlpha})`;
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
          ctx.fillStyle = `rgb(${fgR}, ${fgG}, ${fgB})`;
          ctx.beginPath();
          ctx.arc(px, py, size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
      }

      // ─── Tunnel fly (Lévy flight) ───
      // A tiny creature that appears rarely, zips around erratically, then vanishes.
      if (particleOpacity > 0.5) {
        if (!flyState.active && now - flyState.lastGone > flyState.nextWait) {
          // Spawn at a random depth inside the tunnel
          flyState.active = true;
          flyState.x = 0.3 + Math.random() * 0.4; // horizontal position (0-1)
          flyState.y = 0.3 + Math.random() * 0.4; // vertical position (0-1)
          flyState.depth = 0.15 + Math.random() * 0.3;
          flyState.vx = 0;
          flyState.vy = 0;
          flyState.lifeLeft = 3000; // 3s lifespan max
          flyState.nextMove = 0;
        }

        if (flyState.active) {
          flyState.lifeLeft -= dt * 1000;
          flyState.nextMove -= dt * 1000;

          // Smooth target-steering: pick a new point in the tunnel every ~600-1200ms,
          // then accelerate gently toward it. No hard bursts, no lateral jitter.
          if (flyState.nextMove <= 0) {
            flyState.tx = 0.25 + Math.random() * 0.5;
            flyState.ty = 0.25 + Math.random() * 0.5;
            flyState.tDepth = 0.1 + Math.random() * 0.55;
            flyState.nextMove = 600 + Math.random() * 600;
          }

          // Steer: add a small acceleration toward target each frame
          const accel = 0.00035;
          flyState.vx += (flyState.tx - flyState.x) * accel;
          flyState.vy += (flyState.ty - flyState.y) * accel;
          flyState.vDepth += (flyState.tDepth - flyState.depth) * accel * 1.2;

          // Light damping — keeps motion smooth, not jittery
          flyState.vx *= 0.96;
          flyState.vy *= 0.96;
          flyState.vDepth *= 0.96;
          flyState.x += flyState.vx;
          flyState.y += flyState.vy;
          flyState.depth += flyState.vDepth;

          // Clamp inside tunnel
          flyState.x = Math.max(0.15, Math.min(0.85, flyState.x));
          flyState.y = Math.max(0.15, Math.min(0.85, flyState.y));
          flyState.depth = Math.max(0.03, Math.min(0.85, flyState.depth));

          // Project to screen coordinates using tunnel perspective
          const fd = depthEase(1 - flyState.depth);
          const fx = lerp(lerp(oL, oR, flyState.x), lerp(iL, iR, flyState.x), fd);
          const fy = lerp(lerp(oT, oB, flyState.y), lerp(iT, iB, flyState.y), fd);
          const fSize = 0.6 + flyState.depth * 0.9;
          const fAlpha = particleOpacity * Math.min(1, flyState.lifeLeft / 500) * 0.7;

          // Draw fly
          ctx.fillStyle = `rgba(${fgR}, ${fgG}, ${fgB}, ${fAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(fx, fy, fSize, 0, Math.PI * 2);
          ctx.fill();

          if (flyState.lifeLeft <= 0) {
            flyState.active = false;
            flyState.lastGone = now;
            flyState.nextWait = 8000 + Math.random() * 20000; // 8-28s until next appearance
          }
        }
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
        pointerEvents: 'auto',
      }}
    />
  );
}
