'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const socialLinks = [
  { label: 'Email', href: 'mailto:flavio@superself.online', value: 'flavio@superself.online' },
  { label: 'GitHub', href: 'https://github.com/9000fm', value: '@9000fm' },
  { label: 'Instagram', href: 'https://instagram.com/superself.online', value: '@superself.online' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/flaviomanyari', value: 'Flavio Manyari' },
];

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    gsap.fromTo(
      '.contact-content',
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.contact-content',
          start: 'top 80%',
        },
      }
    );
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText('flavio@superself.online');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="min-h-screen py-32 px-8 md:px-16 lg:px-24 flex items-center"
    >
      <div className="contact-content opacity-0 max-w-4xl mx-auto text-center">
        {/* Header */}
        <span className="text-sm uppercase tracking-wider text-white/40 block mb-8">
          Contact
        </span>

        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
          Open to full-time roles,
          <br />
          freelance projects,
          <br />
          <span className="text-white/40">and collaborations.</span>
        </h2>

        {/* Email CTA */}
        <button
          onClick={copyEmail}
          className="group inline-flex items-center gap-4 text-xl md:text-2xl mb-16 hover:opacity-70 transition-opacity"
        >
          <span>flavio@superself.online</span>
          <span className="text-sm text-white/40 group-hover:text-white transition-colors">
            {copiedEmail ? '✓ Copied' : '↗ Copy'}
          </span>
        </button>

        {/* Social Links */}
        <div className="flex flex-wrap justify-center gap-8">
          {socialLinks.slice(1).map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/30">
          <span>© 2026 FM</span>
          <span>Lima, Peru · UTC-5</span>
        </div>
      </div>
    </section>
  );
}
