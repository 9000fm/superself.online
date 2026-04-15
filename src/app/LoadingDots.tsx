'use client';

import { useState, useEffect, useRef } from 'react';

interface LoadingDotsProps {
  onComplete?: () => void;
}

export default function LoadingDots({ onComplete }: LoadingDotsProps) {
  const [blocks, setBlocks] = useState(0);
  const [completed, setCompleted] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const totalBlocks = 14;

  useEffect(() => {
    if (completed) return;

    const getDelay = () => {
      if (blocks < 2) return 140;                         // first 2: steady
      if (blocks < 10) return 70 + Math.random() * 50;    // middle: moderate
      return 140 + Math.random() * 100;                    // last 4: dramatic slowdown
    };

    const timeout = setTimeout(() => {
      if (blocks >= totalBlocks) {
        setCompleted(true);
        setTimeout(() => onCompleteRef.current?.(), 400);
      } else {
        setBlocks(prev => prev + 1);
      }
    }, getDelay());

    return () => clearTimeout(timeout);
  }, [blocks, completed]);

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    }}>
      {/* Win95 inset border */}
      <div style={{
        width: '100%',
        height: '12px',
        backgroundColor: 'var(--win95-bg, #c0c0c0)',
        border: '2px solid',
        borderColor: 'var(--win95-dark, #808080) var(--win95-highlight, #dfdfdf) var(--win95-highlight, #dfdfdf) var(--win95-dark, #808080)',
        padding: '2px',
        display: 'flex',
        gap: '2px',
        alignItems: 'stretch',
      }}>
        {Array.from({ length: totalBlocks }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              backgroundColor: i < blocks ? 'var(--bar-color, var(--foreground, #fff))' : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  );
}
