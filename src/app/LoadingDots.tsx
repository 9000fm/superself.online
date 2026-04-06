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

  const totalBlocks = 22;

  useEffect(() => {
    if (completed) return;

    const getDelay = () => {
      if (blocks < 3) return 120;
      if (blocks < 15) return 50 + Math.random() * 40;
      return 100 + Math.random() * 80;
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
        backgroundColor: '#c0c0c0',
        border: '2px solid',
        borderColor: '#808080 #dfdfdf #dfdfdf #808080',
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
              backgroundColor: i < blocks ? 'var(--selection-fg, #000)' : 'transparent',
            }}
          />
        ))}
      </div>
    </div>
  );
}
