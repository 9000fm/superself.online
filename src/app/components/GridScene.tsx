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

interface WallMark {
  x: number; y: number;
  life: number;
  radius: number;
  wall: number; // 0=top,1=bottom,2=left,3=right,4=front,5=back
}

interface BurstParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  size: number;
}

// ─── 2D Perspective Grid + Ball + Particles ───

export default function GridScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const startTime = useRef(0);
  const particles = useRef<Particle[]>([]);
  const lastTime = useRef(0);
  const wallMarks = useRef<WallMark[]>([]);
  const burstParticles = useRef<BurstParticle[]>([]);
  const ball = useRef({
    x: 0.5, y: 0.5,
    vx: 0.2, vy: 0.15,
    vz: 0.08,
    depth: 0.02,
    spawned: false,
    squashX: 1, squashY: 1, // 1 = circle, <1 = squished on that axis
    squashDecay: 0,         // time remaining for squash
    lastKick: 0,            // timestamp of last random kick
  });
  // Store last projected ball screen position for click detection
  const ballScreenPos = useRef({ x: 0, y: 0, radius: 0 });

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
      const stepSize = 1 / depthSteps;
      const scrollNorm = (scrollRef.current % stepSize) / stepSize;

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

      // ─── Bouncing ball (3D) ───
      const elapsedBall = (now - startTime.current) / 1000;
      const ballDelay = 8;
      const b = ball.current;
      // Spawn ball after delay
      if (!b.spawned && elapsedBall >= ballDelay) {
        b.spawned = true;
        b.depth = 0.25;
        b.vz = 0.04;
        b.vx = 0.18;
        b.vy = 0.12;
      }
      const ballOpacity = b.spawned ? 1 : 0;

      // Helper: project a point in tunnel space to screen
      const projectTunnel = (px: number, py: number, pd: number): [number, number, number, number] => {
        const e = depthEase(1 - pd);
        const l = lerp(oL, iL, e), r = lerp(oR, iR, e);
        const t = lerp(oT, iT, e), b = lerp(oB, iB, e);
        const sz = (r - l) * 0.07; // ball radius scales with depth — big when close
        return [lerp(l, r, px), lerp(t, b, py), sz, e];
      };


      // Update + draw burst particles
      const bursts = burstParticles.current;
      for (let i = bursts.length - 1; i >= 0; i--) {
        const bp = bursts[i];
        bp.x += bp.vx * dt;
        bp.y += bp.vy * dt;
        bp.life -= dt * 1.5;
        if (bp.life <= 0) { bursts.splice(i, 1); continue; }
        ctx.globalAlpha = bp.life * 0.8;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.size * bp.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      if (ballOpacity > 0) {
        // Gravity — very subtle
        b.vy += 0.04 * dt;

        // Move
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.depth += b.vz * dt;

        // Bounce off walls — slight energy loss
        if (b.x <= 0) { b.x = 0; b.vx = Math.abs(b.vx) * 0.95; }
        if (b.x >= 1) { b.x = 1; b.vx = -Math.abs(b.vx) * 0.95; }
        if (b.y <= 0) { b.y = 0; b.vy = Math.abs(b.vy) * 0.95; }
        if (b.y >= 1) { b.y = 1; b.vy = -Math.abs(b.vy) * 0.95; }
        if (b.depth <= 0.05) { b.depth = 0.05; b.vz = Math.abs(b.vz) * 0.95; }
        if (b.depth >= 0.95) { b.depth = 0.95; b.vz = -Math.abs(b.vz) * 0.95; }

        // Random kick if ball gets too slow
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed < 0.05 && now - b.lastKick > 5000) {
          b.lastKick = now;
          const angle = Math.random() * Math.PI * 2;
          b.vx += Math.cos(angle) * 0.2;
          b.vy += Math.sin(angle) * 0.2 - 0.1; // slight upward bias
          b.vz += (Math.random() - 0.5) * 0.1;
        }

        // Record + draw trajectory line
        const [bx, by, bSz] = projectTunnel(b.x, b.y, b.depth);
        // Ball — solid white, squash on bounce
        ballScreenPos.current = { x: bx, y: by, radius: bSz };
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(bx, by, bSz, 0, Math.PI * 2);
        ctx.fill();
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

    // Drag-and-throw state
    let dragging = false;
    let dragStart = { x: 0, y: 0, time: 0 };
    let dragLast = { x: 0, y: 0, time: 0 };

    const getPos = (e: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0) : e.clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? e.changedTouches?.[0]?.clientY ?? 0) : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleDown = (e: MouseEvent | TouchEvent) => {
      const pos = getPos(e);
      const bp = ballScreenPos.current;
      const dx = pos.x - bp.x, dy = pos.y - bp.y;
      if (Math.sqrt(dx * dx + dy * dy) < bp.radius * 3) {
        dragging = true;
        dragStart = { ...pos, time: performance.now() };
        dragLast = { ...pos, time: performance.now() };
        // Stop ball while dragging
        ball.current.vx = 0;
        ball.current.vy = 0;
        ball.current.vz = 0;
        e.preventDefault();
      } else {
        // Click anywhere = boost the ball in a random direction
        const b = ball.current;
        const angle = Math.random() * Math.PI * 2;
        b.vx += Math.cos(angle) * 0.4;
        b.vy += Math.sin(angle) * 0.4 - 0.15; // upward bias
        b.vz += (Math.random() - 0.5) * 0.2;
        // Burst particles at click
        for (let i = 0; i < 15; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = 30 + Math.random() * 100;
          burstParticles.current.push({
            x: pos.x, y: pos.y,
            vx: Math.cos(a) * spd,
            vy: Math.sin(a) * spd,
            life: 0.5 + Math.random() * 0.4,
            size: 1.5 + Math.random() * 2,
          });
        }
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const pos = getPos(e);
      // Move ball to follow cursor (approximate — map screen delta to tunnel space)
      const b = ball.current;
      const cw = canvasRef.current?.clientWidth || 1;
      const ch = canvasRef.current?.clientHeight || 1;
      const e2 = depthEase(1 - b.depth);
      const areaW = lerp(cw, cw * 0.07, e2);
      const areaH = lerp(ch, ch * 0.07, e2);
      b.x += (pos.x - dragLast.x) / areaW;
      b.y += (pos.y - dragLast.y) / areaH;
      b.x = Math.max(0, Math.min(1, b.x));
      b.y = Math.max(0, Math.min(1, b.y));
      dragLast = { ...pos, time: performance.now() };
    };

    const handleUp = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      dragging = false;
      const pos = getPos(e);
      const dt2 = Math.max(0.016, (performance.now() - dragLast.time) / 1000);
      // Calculate throw velocity from drag
      const throwX = (pos.x - dragStart.x);
      const throwY = (pos.y - dragStart.y);
      const b = ball.current;
      const cw2 = canvasRef.current?.clientWidth || 1;
      const ch2 = canvasRef.current?.clientHeight || 1;
      const e2 = depthEase(1 - b.depth);
      const areaW = lerp(cw2, cw2 * 0.07, e2);
      const areaH = lerp(ch2, ch2 * 0.07, e2);
      b.vx = (throwX / areaW) * 2;
      b.vy = (throwY / areaH) * 2;
      b.vz = (Math.random() - 0.5) * 0.15;
      // Burst on release
      for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 150;
        burstParticles.current.push({
          x: pos.x, y: pos.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          life: 0.6 + Math.random() * 0.5,
          size: 2 + Math.random() * 4,
        });
      }
    };

    // Global click for boost — fires even if click is on UI elements above
    const handleGlobalClick = () => {
      if (!ball.current.spawned) return;
      const b = ball.current;
      const angle = Math.random() * Math.PI * 2;
      b.vx += Math.cos(angle) * 0.35;
      b.vy += Math.sin(angle) * 0.35 - 0.1;
      b.vz += (Math.random() - 0.5) * 0.15;
    };

    animate();
    const cvs = canvasRef.current;
    cvs?.addEventListener('mousedown', handleDown);
    cvs?.addEventListener('mousemove', handleMove);
    cvs?.addEventListener('mouseup', handleUp);
    cvs?.addEventListener('touchstart', handleDown, { passive: false });
    cvs?.addEventListener('touchmove', handleMove, { passive: false });
    cvs?.addEventListener('touchend', handleUp);
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('resize', draw);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      cvs?.removeEventListener('mousedown', handleDown);
      cvs?.removeEventListener('mousemove', handleMove);
      cvs?.removeEventListener('mouseup', handleUp);
      cvs?.removeEventListener('touchstart', handleDown);
      cvs?.removeEventListener('touchmove', handleMove);
      cvs?.removeEventListener('touchend', handleUp);
      window.removeEventListener('click', handleGlobalClick);
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
