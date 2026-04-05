'use client';

import { useRef, useEffect } from 'react';

// ─── 2D Perspective Grid + Floating Wireframe Sphere ───

export default function GridScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const sphereAngle = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    let running = true;
    startTime.current = performance.now();

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 10 || h < 10) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, w, h);

      // Outer rect = full canvas
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

      // ─── Inner rectangle — almost white ───
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(Math.round(iL), Math.round(iT), Math.round(iW), Math.round(iH));

      // ─── Wireframe sphere — delayed entrance, levitating ───
      const elapsed = (performance.now() - startTime.current) / 1000;
      const sphereDelay = 7; // appears after everything else
      const sphereFadeIn = 4; // slow dramatic fade
      const sphereProgress = Math.min(1, Math.max(0, (elapsed - sphereDelay) / sphereFadeIn));
      const sphereOpacity = sphereProgress;

      if (sphereOpacity > 0) {
      const sphereX = cx;
      // Smooth scale: 0.22 at 320px → 0.14 at 1024px+
      const sizeFactor = 0.14 + 0.08 * Math.max(0, Math.min(1, (1024 - w) / 704));
      const sphereRadius = Math.min(w, h) * sizeFactor;

      // Levitation — gentle, controlled range
      const time = performance.now() * 0.001;
      const bobAmount = sphereRadius * 0.2;
      const bobOffset = Math.sin(time * 0.4) * bobAmount
        + Math.sin(time * 0.67) * bobAmount * 0.3;
      // Position sphere — just appears in place, no rise
      const sphereBaseY = lerp(cy, oB, 0.55);
      const sphereY = sphereBaseY + bobOffset;

      // Shadow — wide, darkness reacts to sphere proximity
      const shadowFixedY = sphereBaseY + sphereRadius * 1.2;
      const dist = shadowFixedY - sphereY;
      const proximity = Math.max(0, 1 - dist / (sphereRadius * 2.5));
      const shadowRx = sphereRadius * 2;
      const shadowRy = sphereRadius * 0.4;
      const shadowAlpha = (0.3 + proximity * 0.6) * sphereOpacity; // 0.3 far → 0.9 close
      // Dark core — gets much darker when sphere is close
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(sphereX, shadowFixedY, shadowRx * 0.4, shadowRy * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Soft edge
      const shadowGrad = ctx.createRadialGradient(sphereX, shadowFixedY, shadowRx * 0.2, sphereX, shadowFixedY, shadowRx);
      shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha * 0.5})`);
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(sphereX, shadowFixedY, shadowRx, shadowRy, 0, 0, Math.PI * 2);
      ctx.fill();

      const rotX = sphereAngle.current * 0.7;
      const rotY = sphereAngle.current;
      const cosRY = Math.cos(rotY), sinRY = Math.sin(rotY);
      const cosRX = Math.cos(rotX), sinRX = Math.sin(rotX);

      const projectSphere = (x3: number, y3: number, z3: number): [number, number, number] => {
        const rx = x3 * cosRY + z3 * sinRY;
        const rz = -x3 * sinRY + z3 * cosRY;
        const ry = y3 * cosRX - rz * sinRX;
        const fz = y3 * sinRX + rz * cosRX;
        return [sphereX + rx * sphereRadius, sphereY - ry * sphereRadius, fz];
      };

      const seg = 48;

      // Solid white fill
      ctx.globalAlpha = sphereOpacity;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereRadius + 1, 0, Math.PI * 2);
      ctx.fill();

      // Clip wires to sphere circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereRadius + 1, 0, Math.PI * 2);
      ctx.clip();

      // Dark wires on white fill
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = sphereOpacity;

      const drawFrontRing = (genPoint: (i: number) => [number, number, number]) => {
        // Draw segment by segment with smooth alpha fade near silhouette
        for (let i = 0; i < seg; i++) {
          const [x1, y1, z1] = genPoint(i);
          const [x2, y2, z2] = genPoint(i + 1);
          const avgZ = (z1 + z2) / 2;
          if (avgZ > 0.15) continue; // behind sphere, skip
          // Smooth fade: fully visible at z<-0.1, fades out between -0.1 and 0.15
          const fade = avgZ < -0.1 ? 1 : 1 - (avgZ + 0.1) / 0.25;
          ctx.globalAlpha = fade;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      };

      // 14 latitudes
      for (let lat = -84; lat <= 84; lat += 12) {
        const phi = (lat * Math.PI) / 180;
        const cp = Math.cos(phi), sp = Math.sin(phi);
        drawFrontRing((i) => {
          const theta = (i / seg) * Math.PI * 2;
          return projectSphere(cp * Math.sin(theta), sp, cp * Math.cos(theta));
        });
      }

      // 14 meridians
      for (let j = 0; j < 14; j++) {
        const theta = (j / 14) * Math.PI;
        const ct = Math.cos(theta), st = Math.sin(theta);
        drawFrontRing((i) => {
          const phi = (i / seg) * Math.PI * 2;
          return projectSphere(Math.cos(phi) * st, Math.sin(phi), Math.cos(phi) * ct);
        });
      }

      ctx.restore();
      ctx.globalAlpha = 1;
      } // end sphereOpacity > 0
    };

    const animate = () => {
      if (!running) return;
      scrollRef.current += 0.0004;
      sphereAngle.current -= 0.002;
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
