'use client';

import { useEffect, useState, useMemo } from 'react';

interface AsciiArtProps {
  color?: string;
  isVisible?: boolean;
}

// Pre-calculated sine lookup table (360 values)
const SINE_TABLE: number[] = [];
for (let i = 0; i < 360; i++) {
  SINE_TABLE[i] = Math.sin((i * Math.PI) / 180);
}

const fastSin = (angle: number): number => {
  const idx = Math.floor(((angle % (2 * Math.PI)) / (2 * Math.PI)) * 360);
  return SINE_TABLE[(idx + 360) % 360];
};

export default function AsciiArt({ color = 'white', isVisible = true }: AsciiArtProps) {
  const [frame, setFrame] = useState(0);
  const [mouseX, setMouseX] = useState(0.5);
  const [mouseY, setMouseY] = useState(0.5);

  // Pre-calculate grid constants
  const width = 180;
  const height = 120;
  const blocks = [' ', ' ', '░', '░', '▒', '▓', '█', '▓', '▒', '░', '░', ' '];
  const blocksLen = blocks.length - 1;

  // Pre-calculate normalized coordinates and distances (these never change)
  const gridData = useMemo(() => {
    const data: { nx: number; ny: number; centerFade: number }[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const ny = y / height;
        const dx = (nx - 0.5) * 2;
        const dy = (ny - 0.5) * 2;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const centerFade = Math.max(0, 1 - distFromCenter * 0.9);
        data.push({ nx, ny, centerFade });
      }
    }
    return data;
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let targetX = 0.5;
    let targetY = 0.5;
    let currentX = 0.5;
    let currentY = 0.5;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX / window.innerWidth;
      targetY = e.clientY / window.innerHeight;
    };

    const smoothUpdate = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      setMouseX(currentX);
      setMouseY(currentY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    const smoothInterval = setInterval(smoothUpdate, 50);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(smoothInterval);
    };
  }, [isVisible]);

  const scene = useMemo(() => {
    const speedMod = 0.9 + (mouseX - 0.5) * 0.2;
    const phaseShift = (mouseY - 0.5) * 0.5;
    const frameSpeed1 = frame * 0.06 * speedMod;
    const frameSpeed2 = frame * 0.04 * speedMod;
    const frameSpeed3 = frame * 0.05;

    const lines: string[] = [];
    let idx = 0;

    for (let y = 0; y < height; y++) {
      let line = '';
      for (let x = 0; x < width; x++) {
        const { nx, ny, centerFade } = gridData[idx++];

        // Use fast sine approximation
        const wave1 = fastSin(nx * 8 + frameSpeed1 + ny * 2 + phaseShift);
        const wave2 = fastSin(nx * 5 - frameSpeed2 + ny * 3);
        const wave3 = fastSin(ny * 6 + frameSpeed3 + nx * 2);

        const combined = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;
        const value = ((combined + 1) * 0.5) * centerFade;

        const blockIdx = (value * blocksLen) | 0; // Fast floor with bitwise OR
        line += blocks[blockIdx < 0 ? 0 : blockIdx > blocksLen ? blocksLen : blockIdx];
      }
      lines.push(line);
    }

    return lines.join('\n');
  }, [frame, mouseX, mouseY, gridData, blocksLen, blocks]);

  return (
    <pre
      style={{
        fontFamily: '"Courier New", Consolas, monospace',
        fontSize: 'clamp(6px, 1.2vmin, 10px)',
        lineHeight: 0.9,
        color: color,
        margin: 0,
        whiteSpace: 'pre',
        textAlign: 'center',
        opacity: 0.35,
      }}
    >
      {scene}
    </pre>
  );
}
