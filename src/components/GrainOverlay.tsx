'use client';

import { useEffect, useRef } from 'react';

export default function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let mouseX = 0;
    let mouseY = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    };

    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      // Intensity varies with mouse position
      const baseIntensity = 15;
      const mouseIntensity = (mouseX + mouseY) * 5;
      const intensity = baseIntensity + mouseIntensity;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * intensity;
        data[i] = noise;     // R
        data[i + 1] = noise; // G
        data[i + 2] = noise; // B
        data[i + 3] = 20;    // A - very subtle
      }

      ctx.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(generateNoise);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    generateNoise();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-60"
    />
  );
}
