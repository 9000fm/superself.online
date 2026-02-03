'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Experiment {
  id: string;
  title: string;
  category: string;
  status: 'live' | 'wip' | 'concept';
}

const experiments: Experiment[] = [
  { id: '01', title: 'Generative Grid', category: 'p5.js', status: 'wip' },
  { id: '02', title: 'Audio Visualizer', category: 'Three.js', status: 'wip' },
  { id: '03', title: 'Particle System', category: 'WebGL', status: 'concept' },
  { id: '04', title: 'M4L Audio Tool', category: 'Max/MSP', status: 'wip' },
  { id: '05', title: 'Shader Playground', category: 'GLSL', status: 'concept' },
  { id: '06', title: 'Motion Studies', category: 'GSAP', status: 'concept' },
];

export default function Experiments() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.fromTo(
      '.experiments-header',
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.experiments-header',
          start: 'top 80%',
        },
      }
    );

    gsap.utils.toArray<HTMLElement>('.experiment-item').forEach((item, i) => {
      gsap.fromTo(
        item,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 90%',
          },
          delay: i * 0.05,
        }
      );
    });
  }, []);

  return (
    <section
      id="experiments"
      ref={sectionRef}
      className="min-h-screen py-32 px-8 md:px-16 lg:px-24"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="experiments-header opacity-0 mb-16">
          <span className="text-sm uppercase tracking-wider text-white/40 block mb-4">
            Experiments
          </span>
          <h2 className="text-2xl md:text-3xl font-light max-w-2xl leading-relaxed">
            A space for exploration. Small-scale experiments in interaction, visuals,
            motion, and systems.
          </h2>
          <p className="mt-4 text-white/40">
            Not products. Not concepts. Just tested ideas.
          </p>
        </div>

        {/* Experiments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="experiment-item opacity-0 group p-6 border border-white/10 rounded-lg hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              {/* Placeholder visual */}
              <div className="aspect-square bg-white/5 rounded-md mb-4 flex items-center justify-center relative overflow-hidden">
                <span className="text-4xl font-bold text-white/10">{exp.id}</span>
                {/* Hover effect placeholder */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium mb-1">{exp.title}</h3>
                  <span className="text-sm text-white/40">{exp.category}</span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    exp.status === 'live'
                      ? 'bg-green-500/20 text-green-400'
                      : exp.status === 'wip'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {exp.status === 'wip' ? 'WIP' : exp.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon note */}
        <p className="mt-12 text-center text-white/30 text-sm">
          More experiments coming soon.
        </p>
      </div>
    </section>
  );
}
