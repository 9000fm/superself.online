'use client';

import { useEffect, useState, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

interface AsciiArtProps {
  color?: string;
  isVisible?: boolean;
}

interface Sparkle {
  x: number;
  y: number;
  life: number;
  char: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
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

const SPARKLE_CHARS = ['*', '·', '•', '+', '°'];

let rippleId = 0;

export interface AsciiArtRef {
  createRipple: (clientX: number, clientY: number) => void;
}

const AsciiArt = forwardRef<AsciiArtRef, AsciiArtProps>(function AsciiArt({ color = 'white', isVisible = true }, ref) {
  const [frame, setFrame] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [gridSize, setGridSize] = useState({ width: 180, height: 120 });
  const [fontSize, setFontSize] = useState(10);
  const containerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const blocks = [' ', ' ', '░', '░', '▒', '▓', '█', '▓', '▒', '░', '░', ' '];
  const blocksLen = blocks.length - 1;

  // Calculate grid size and font size to fill container exactly
  // Uses ResizeObserver for reliable initial detection
  useEffect(() => {
    const updateSize = (rect: DOMRect) => {
      if (rect.width === 0 || rect.height === 0) return;

      // Target font size based on smaller dimension for readability
      const baseFontSize = Math.max(6, Math.min(14, Math.min(rect.width, rect.height) * 0.012));

      // Calculate grid dimensions to fill container
      // Monospace char width is roughly 0.6 * font size
      // Line height is 0.9 * font size
      const charWidth = baseFontSize * 0.6;
      const charHeight = baseFontSize * 0.9;

      const cols = Math.ceil(rect.width / charWidth);
      const rows = Math.ceil(rect.height / charHeight);

      setGridSize({ width: cols, height: rows });
      setFontSize(baseFontSize);
    };

    const container = containerRef.current;
    if (!container) return;

    // Use ResizeObserver for reliable size detection
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        updateSize(entries[0].contentRect as DOMRect);
      }
    });

    observer.observe(container);

    // Also try initial calculation
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      updateSize(rect);
    }

    return () => observer.disconnect();
  }, []);

  const { width, height } = gridSize;

  // Pre-calculate normalized coordinates and distances
  // Recalculates when grid size changes
  const gridData = useMemo(() => {
    const data: { nx: number; ny: number; centerFade: number }[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const ny = y / height;
        const dx = (nx - 0.5) * 2;
        const dy = (ny - 0.5) * 2;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const centerFade = Math.max(0, 1 - distFromCenter * 0.7);
        data.push({ nx, ny, centerFade });
      }
    }
    return data;
  }, [width, height]);

  // Handle click/touch for ripple effect - use pre element for accurate positioning
  const createRipple = useCallback((clientX: number, clientY: number) => {
    if (!preRef.current) return;

    const rect = preRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const x = Math.floor((clickX / rect.width) * width);
    const y = Math.floor((clickY / rect.height) * height);

    const newRipple: Ripple = {
      id: rippleId++,
      x: Math.max(0, Math.min(width - 1, x)),
      y: Math.max(0, Math.min(height - 1, y)),
      radius: 1,
      life: 1
    };

    setRipples(prev => [...prev, newRipple]);
  }, [width, height]);

  // Expose createRipple to parent via ref
  useImperativeHandle(ref, () => ({
    createRipple
  }), [createRipple]);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 1000);
    }, 100);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Spawn sparkles - slightly more frequent
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.7) {
        setSparkles(prev => {
          const newSparkle: Sparkle = {
            x: Math.floor(Math.random() * width),
            y: Math.floor(Math.random() * height),
            life: 1,
            char: SPARKLE_CHARS[Math.floor(Math.random() * SPARKLE_CHARS.length)]
          };
          return [...prev.slice(-35), newSparkle];
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Update sparkles lifetime
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setSparkles(prev => prev
        .map(s => ({ ...s, life: s.life - 0.05 }))
        .filter(s => s.life > 0)
      );
    }, 60);
    return () => clearInterval(interval);
  }, [isVisible]);

  // Update ripples
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setRipples(prev => prev
        .map(r => ({ ...r, radius: r.radius + 0.6, life: r.life - 0.035 }))
        .filter(r => r.life > 0)
      );
    }, 35);
    return () => clearInterval(interval);
  }, [isVisible]);

  const scene = useMemo(() => {
    // Autonomous animation - no mouse dependency
    const frameSpeed1 = frame * 0.06;
    const frameSpeed2 = frame * 0.04;
    const frameSpeed3 = frame * 0.05;

    // Create sparkle lookup
    const sparkleMap = new Map<string, string>();
    for (const s of sparkles) {
      if (s.life > 0.2) {
        sparkleMap.set(`${s.x},${s.y}`, s.char);
      }
    }

    const lines: string[] = [];
    let idx = 0;

    for (let y = 0; y < height; y++) {
      let line = '';
      for (let x = 0; x < width; x++) {
        const { nx, ny, centerFade } = gridData[idx++];

        // Use fast sine approximation - autonomous waves
        const wave1 = fastSin(nx * 8 + frameSpeed1 + ny * 2);
        const wave2 = fastSin(nx * 5 - frameSpeed2 + ny * 3);
        const wave3 = fastSin(ny * 6 + frameSpeed3 + nx * 2);

        const combined = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;
        let value = ((combined + 1) * 0.5) * centerFade;

        // Ripple effects
        for (const ripple of ripples) {
          const rdx = x - ripple.x;
          const rdy = (y - ripple.y) * 1.5;
          const rDist = Math.sqrt(rdx * rdx + rdy * rdy);

          const ringWidth = 1.2;
          const distFromRing = Math.abs(rDist - ripple.radius);

          if (distFromRing < ringWidth) {
            const intensity = (1 - distFromRing / ringWidth) * ripple.life;
            value = Math.min(1, value + intensity * 0.8);
          }
        }

        // Check sparkle
        const sparkleChar = sparkleMap.get(`${x},${y}`);
        if (sparkleChar) {
          line += sparkleChar;
        } else {
          const blockIdx = (value * blocksLen) | 0;
          line += blocks[blockIdx < 0 ? 0 : blockIdx > blocksLen ? blocksLen : blockIdx];
        }
      }
      lines.push(line);
    }

    return lines.join('\n');
  }, [frame, gridData, blocksLen, blocks, sparkles, ripples]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <pre
        ref={preRef}
        style={{
          fontFamily: '"Courier New", Consolas, monospace',
          fontSize: `${fontSize}px`,
          lineHeight: 0.9,
          color: color,
          margin: 0,
          whiteSpace: 'pre',
          textAlign: 'center',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      >
        {scene}
      </pre>
    </div>
  );
});

export default AsciiArt;
