'use client';

import { useState } from 'react';

interface NavigationProps {
  currentSection: string;
}

const navItems = [
  { id: 'hero', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'experiments', label: 'Lab' },
  { id: 'contact', label: 'Contact' },
];

export default function Navigation({ currentSection }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 hidden md:flex justify-between items-center mix-blend-difference">
        {/* Logo */}
        <button
          onClick={() => scrollToSection('hero')}
          className="text-xl font-bold tracking-tight hover:opacity-70 transition-opacity"
        >
          FM
        </button>

        {/* Nav Links */}
        <div className="flex gap-8">
          {navItems.slice(1).map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`text-sm uppercase tracking-wider transition-opacity ${
                currentSection === item.id ? 'opacity-100' : 'opacity-50 hover:opacity-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex md:hidden justify-between items-center">
        {/* Logo */}
        <button
          onClick={() => scrollToSection('hero')}
          className="text-xl font-bold tracking-tight z-50 mix-blend-difference"
        >
          FM
        </button>

        {/* Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="z-50 w-10 h-10 flex flex-col justify-center items-center gap-1.5 mix-blend-difference"
        >
          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              isMenuOpen ? 'rotate-45 translate-y-2' : ''
            }`}
          />
          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              isMenuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`w-6 h-0.5 bg-white transition-all duration-300 ${
              isMenuOpen ? '-rotate-45 -translate-y-2' : ''
            }`}
          />
        </button>

        {/* Mobile Menu Overlay */}
        <div
          className={`fixed inset-0 bg-black transition-all duration-500 ${
            isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="h-full flex flex-col justify-center items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`text-3xl font-light tracking-wider transition-opacity ${
                  currentSection === item.id ? 'opacity-100' : 'opacity-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
