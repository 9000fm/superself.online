'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 2.5 }); // After preloader

    tl.fromTo(
      titleRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power4.out' }
    )
      .fromTo(
        subtitleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.5'
      )
      .fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.3'
      );
  }, []);

  const scrollToWork = () => {
    const element = document.getElementById('work');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center px-8 md:px-16 lg:px-24"
    >
      {/* Content */}
      <div className="max-w-4xl">
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight opacity-0"
        >
          Creative development
          <br />
          <span className="text-white/40">for digital experiences.</span>
        </h1>

        <p
          ref={subtitleRef}
          className="mt-8 text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed opacity-0"
        >
          Design-driven interfaces, interactive systems, and web tools built with
          clarity and restraint. Bridging code, visuals, and structure to turn
          ideas into usable products.
        </p>

        <div ref={ctaRef} className="mt-12 opacity-0">
          <button
            onClick={scrollToWork}
            className="group flex items-center gap-4 text-sm uppercase tracking-wider"
          >
            <span>Selected work below</span>
            <span className="w-8 h-[1px] bg-white group-hover:w-16 transition-all duration-300" />
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-8 md:left-16 flex items-center gap-4">
        <div className="w-[1px] h-16 bg-white/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white animate-scroll-down" />
        </div>
        <span className="text-xs uppercase tracking-wider text-white/40 rotate-90 origin-left translate-x-4">
          Scroll
        </span>
      </div>

      {/* Background decoration - placeholder for future animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes scroll-down {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(200%);
          }
        }
        .animate-scroll-down {
          animation: scroll-down 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
