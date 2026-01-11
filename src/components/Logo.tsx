'use client';

import Link from 'next/link';

export default function Logo() {
  return (
    <Link
      href="/"
      className="fixed top-6 left-6 z-40 font-mono text-lg tracking-[0.3em] text-white hover:text-[#0000FF] transition-colors duration-300"
    >
      SUPERSELF
    </Link>
  );
}
