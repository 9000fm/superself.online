'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Sections
import Preloader from './sections/Preloader';
import Hero from './sections/Hero';
import Work from './sections/Work';
import About from './sections/About';
import Experiments from './sections/Experiments';
import Contact from './sections/Contact';

// Components
import Navigation from './components/Navigation';

gsap.registerPlugin(ScrollTrigger);

export default function FMPortfolio() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('hero');
  const mainRef = useRef<HTMLElement>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    if (isLoading) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Track current section
    const sections = ['hero', 'work', 'about', 'experiments', 'contact'];
    sections.forEach((section) => {
      ScrollTrigger.create({
        trigger: `#${section}`,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => setCurrentSection(section),
        onEnterBack: () => setCurrentSection(section),
      });
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [isLoading]);

  // Handle preloader complete
  const handlePreloaderComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      {/* Preloader */}
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Main content */}
      <main
        ref={mainRef}
        className={`bg-black text-white min-h-screen ${isLoading ? 'overflow-hidden h-screen' : ''}`}
      >
        {/* Navigation */}
        {!isLoading && <Navigation currentSection={currentSection} />}

        {/* Sections */}
        <Hero />
        <Work />
        <About />
        <Experiments />
        <Contact />
      </main>
    </>
  );
}
