'use client';

import { useEffect, useState } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const duration = 2000; // 2 seconds
    const interval = 50;
    let current = 0;

    const timer = setInterval(() => {
      current += (100 / duration) * interval;
      if (current >= 100) {
        current = 100;
        clearInterval(timer);
        
        // Animate out
        gsap.to('.preloader', {
          yPercent: -100,
          duration: 0.8,
          ease: 'power4.inOut',
          onComplete,
        });
      }
      setProgress(Math.floor(current));
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="preloader fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Logo */}
      <div className="text-6xl md:text-8xl font-bold tracking-tighter mb-8">
        FM
      </div>

      {/* Progress bar */}
      <div className="w-48 h-[1px] bg-white/20 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress number */}
      <div className="mt-4 text-sm font-mono text-white/50">
        {progress}%
      </div>
    </div>
  );
}
