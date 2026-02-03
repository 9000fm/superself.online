'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const capabilities = {
  'Creative Development': [
    'Interactive web experiences',
    'Design-led frontend implementation',
    'Creative coding for visual systems',
    'Generative and procedural visuals',
  ],
  'Web Development': [
    'Modern frontend architectures',
    'Component-based UI systems',
    'Performance-conscious builds',
    'Deployment and iteration workflows',
  ],
};

const tools = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Three.js',
  'p5.js',
  'GSAP',
  'Tailwind',
  'Git',
  'Vercel',
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Animate elements on scroll
    gsap.utils.toArray<HTMLElement>('.about-animate').forEach((el) => {
      gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
          },
        }
      );
    });
  }, []);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="min-h-screen py-32 px-8 md:px-16 lg:px-24 bg-white/[0.02]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="about-animate opacity-0 mb-16">
          <span className="text-sm uppercase tracking-wider text-white/40 block mb-4">
            About
          </span>
        </div>

        {/* Bio */}
        <div className="about-animate opacity-0 mb-24">
          <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed max-w-4xl">
            Creative developer focused on building clear, functional, and visually
            intentional digital work. Background spans design, creative coding, and
            web development.
          </p>
          <p className="mt-8 text-lg text-white/50 max-w-2xl leading-relaxed">
            Comfortable operating between disciplines and translating abstract ideas
            into concrete systems. Preference for clean solutions, long-term
            thinking, and work that holds up beyond trends.
          </p>
        </div>

        {/* Capabilities */}
        <div className="about-animate opacity-0 mb-24">
          <h3 className="text-sm uppercase tracking-wider text-white/40 mb-8">
            Capabilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {Object.entries(capabilities).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-lg font-semibold mb-4">{category}</h4>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="text-white/50 flex items-center gap-3">
                      <span className="w-1 h-1 bg-white/30 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="about-animate opacity-0">
          <h3 className="text-sm uppercase tracking-wider text-white/40 mb-8">
            Tools & Technologies
          </h3>
          <div className="flex flex-wrap gap-3">
            {tools.map((tool) => (
              <span
                key={tool}
                className="px-4 py-2 border border-white/10 rounded-full text-sm text-white/70 hover:border-white/30 transition-colors"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
