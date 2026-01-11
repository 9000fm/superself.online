'use client';

import { useState, useEffect, useRef } from 'react';

export default function LoadingDots() {
  const [dots, setDots] = useState(0);
  const [maxDots, setMaxDots] = useState(20);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const calculateMaxDots = () => {
      if (!containerRef.current || !textRef.current) return;
      
      const containerWidth = containerRef.current.offsetWidth;
      const loadingTextWidth = textRef.current.offsetWidth;
      const availableWidth = containerWidth - loadingTextWidth;
      
      // Estimate dot width (roughly 0.6em for monospace)
      const fontSize = parseFloat(getComputedStyle(containerRef.current).fontSize);
      const dotWidth = fontSize * 0.6;
      
      const newMaxDots = Math.floor(availableWidth / dotWidth);
      setMaxDots(Math.max(5, newMaxDots));
    };

    calculateMaxDots();
    window.addEventListener('resize', calculateMaxDots);
    return () => window.removeEventListener('resize', calculateMaxDots);
  }, []);

  useEffect(() => {
    const getDelay = (current: number) => {
      if (current === 0) return 800;
      const progress = current / maxDots;
      if (progress < 0.2) return 280;
      if (progress < 0.8) return 150;
      return 250;
    };

    const timeout = setTimeout(() => {
      setDots((prev) => (prev >= maxDots ? 0 : prev + 1));
    }, getDelay(dots));

    return () => clearTimeout(timeout);
  }, [dots, maxDots]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        fontFamily: 'var(--font-digital), monospace',
        fontSize: '1.1rem',
        letterSpacing: '0.05em',
        color: 'rgba(255,255,255,0.6)',
        textTransform: 'lowercase',
        display: 'flex',
      }}
    >
      <span ref={textRef}>loading</span>
      <span>{'.'.repeat(dots)}</span>
    </div>
  );
}
