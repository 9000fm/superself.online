'use client';

import { useState, useEffect, useRef } from 'react';

interface LoadingDotsProps {
  onComplete?: () => void;
}

export default function LoadingDots({ onComplete }: LoadingDotsProps) {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Keep ref updated without triggering re-renders
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const barWidth = 32; // Total width of progress bar
  const filledChar = '█';
  const emptyChar = '░';

  useEffect(() => {
    if (completed) return;

    const getDelay = () => {
      // Variable speed - starts slow, speeds up in middle, slows at end (faster version)
      if (progress < 3) return 150;
      if (progress < 15) return 40 + Math.random() * 30;
      return 100 + Math.random() * 75;
    };

    const timeout = setTimeout(() => {
      if (progress >= barWidth) {
        setCompleted(true);
        setTimeout(() => {
          onCompleteRef.current?.();
        }, 400);
      } else {
        setProgress((prev) => prev + 1);
      }
    }, getDelay());

    return () => clearTimeout(timeout);
  }, [progress, completed, barWidth]);

  const filled = filledChar.repeat(progress);
  const empty = emptyChar.repeat(barWidth - progress);

  return (
    <div
      style={{
        width: '100%',
        fontFamily: 'Fixedsys, Terminal, "Perfect DOS VGA 437", "Lucida Console", Consolas, monospace',
        fontSize: '0.8rem',
        color: 'rgba(255,255,255,0.6)',
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5em',
      }}
    >
      <span>[{filled}{empty}]</span>
    </div>
  );
}
