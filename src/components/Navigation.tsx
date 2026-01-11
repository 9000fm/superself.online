'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/releases', label: 'RELEASES' },
    { href: '/artists', label: 'ARTISTS' },
    { href: '/contact', label: 'CONTACT' },
  ];

  return (
    <nav className="fixed top-6 right-6 z-40 flex gap-6 font-mono text-sm tracking-wider">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`transition-all duration-300 hover:text-[#0000FF] ${
            pathname === link.href
              ? 'text-[#0000FF]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
