'use client';

import { useEffect, useRef } from 'react';
import type p5Type from 'p5';

interface TunnelCanvasProps {
  className?: string;
}

export default function TunnelCanvas({ className }: TunnelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5Type | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initP5 = async () => {
      const p5Module = await import('p5');
      const p5Constructor = p5Module.default;

      const sketch = (p: p5Type) => {
        let time = 0;
        let mouseInfluence = { x: 0, y: 0 };
        const numRects = 20;
        const zoomSpeed = 0.008;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(containerRef.current!);
          p.noFill();
          p.strokeWeight(1);
        };

        p.draw = () => {
          p.background(0);

          const targetX = (p.mouseX - p.width / 2) / p.width;
          const targetY = (p.mouseY - p.height / 2) / p.height;
          mouseInfluence.x += (targetX - mouseInfluence.x) * 0.05;
          mouseInfluence.y += (targetY - mouseInfluence.y) * 0.05;

          const centerX = p.width / 2 + mouseInfluence.x * 50;
          const centerY = p.height / 2 + mouseInfluence.y * 50;

          for (let i = 0; i < numRects; i++) {
            let scale = ((time * zoomSpeed + i / numRects) % 1);
            scale = p.pow(scale, 1.5);

            const size = scale * Math.min(p.width, p.height) * 1.2;
            const alpha = p.map(scale, 0, 1, 255, 20);
            p.stroke(0, 0, 255, alpha);

            p.push();
            p.translate(centerX, centerY);
            p.rotate(mouseInfluence.x * 0.1);
            p.rectMode(p.CENTER);
            p.rect(0, 0, size, size * 0.7);

            if (scale > 0.1) {
              const gridLines = 4;
              for (let g = 1; g < gridLines; g++) {
                const linePos = (g / gridLines - 0.5) * size;
                p.line(linePos, -size * 0.35, linePos, size * 0.35);
                p.line(-size / 2, linePos * 0.7, size / 2, linePos * 0.7);
              }
            }

            p.pop();
          }

          const orbSize = 20 + Math.sin(time * 0.02) * 5;
          const orbGlow = 40 + Math.sin(time * 0.03) * 10;

          p.noStroke();
          for (let r = orbGlow; r > 0; r -= 2) {
            const glowAlpha = p.map(r, 0, orbGlow, 150, 0);
            p.fill(0, 0, 255, glowAlpha);
            p.ellipse(centerX, centerY, r * 2, r * 2);
          }

          p.fill(0, 0, 255);
          p.ellipse(centerX, centerY, orbSize, orbSize);

          p.fill(100, 100, 255);
          p.ellipse(centerX - orbSize * 0.2, centerY - orbSize * 0.2, orbSize * 0.3, orbSize * 0.3);

          time++;
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
      };

      p5Instance.current = new p5Constructor(sketch);
    };

    initP5();

    return () => {
      p5Instance.current?.remove();
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
