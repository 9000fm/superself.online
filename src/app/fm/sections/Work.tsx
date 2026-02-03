'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Project {
  id: string;
  title: string;
  subtitle: string;
  role: string;
  tools: string[];
  year: string;
  link?: string;
}

const projects: Project[] = [
  {
    id: '01',
    title: 'Ecolution',
    subtitle: 'Sustainable Tech Website',
    role: 'Design & Development',
    tools: ['Next.js', 'Tailwind', 'Vercel'],
    year: '2025',
    link: 'https://ecolution.com.au',
  },
  {
    id: '02',
    title: 'Micaela Portfolio',
    subtitle: 'Creative Direction Portfolio',
    role: 'Design & Development',
    tools: ['Next.js', 'GSAP', 'Vercel'],
    year: '2025',
    link: 'https://portafolio-micaela.vercel.app/',
  },
  {
    id: '03',
    title: 'Superself',
    subtitle: 'Electronic Music Label',
    role: 'Branding & Development',
    tools: ['Next.js', 'React', 'Tailwind'],
    year: '2026',
    link: 'https://superself.online',
  },
  {
    id: '04',
    title: 'This Portfolio',
    subtitle: 'Personal Website',
    role: 'Design & Development',
    tools: ['Next.js', 'GSAP', 'Three.js'],
    year: '2026',
  },
];

export default function Work() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Header animation
    gsap.fromTo(
      headerRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 80%',
        },
      }
    );

    // Project cards animation
    gsap.utils.toArray<HTMLElement>('.project-card').forEach((card, i) => {
      gsap.fromTo(
        card,
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
          delay: i * 0.1,
        }
      );
    });
  }, []);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="min-h-screen py-32 px-8 md:px-16 lg:px-24"
    >
      {/* Header */}
      <div ref={headerRef} className="mb-16 opacity-0">
        <span className="text-sm uppercase tracking-wider text-white/40 block mb-4">
          Selected Work
        </span>
        <h2 className="text-3xl md:text-4xl font-bold max-w-2xl leading-tight">
          A focused selection of projects across web development, creative coding,
          and digital tools.
        </h2>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {projects.map((project) => (
          <article
            key={project.id}
            className="project-card group opacity-0"
          >
            {/* Project Image Placeholder */}
            <div className="aspect-[4/3] bg-white/5 rounded-lg mb-6 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-6xl font-bold">
                {project.id}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Project Info */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-1">{project.title}</h3>
                <p className="text-white/50 text-sm">{project.subtitle}</p>
              </div>
              <span className="text-sm text-white/30">{project.year}</span>
            </div>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <span
                  key={tool}
                  className="text-xs px-2 py-1 bg-white/5 rounded text-white/50"
                >
                  {tool}
                </span>
              ))}
            </div>

            {/* Link */}
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-white/50 hover:text-white transition-colors"
              >
                View project
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
