# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**superself.online** - Electronic music label & creative brand website. Currently a minimal "coming soon" landing page.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- p5.js (for future interactive animations)

## Brand Guidelines

- **Primary color:** Electric blue `#0000FF`
- **Secondary:** White `#FFFFFF`
- **Aesthetic:** Minimal, digital, acid/retro-futuristic, laid-back
- **Typography:** Share Tech Mono (digital font), always lowercase for brand text
- **Logo:** `/public/superself-logo-wh.png` (white version)

## Code Style

- Use inline styles for critical layout (prevents CSS race conditions on load)
- Prefer `vmin`/`vmax` units for responsive sizing
- Keep animations subtle and elegant
- No shadows, minimal effects
- Dynamic imports for p5.js to avoid SSR issues:
  ```tsx
  const p5Module = await import('p5');
  ```

## Structure

```
src/app/
├── page.tsx      # Main landing page
├── layout.tsx    # Root layout with font config
└── globals.css   # Base styles + marquee animation
public/
└── superself-logo-wh.png
```

## Deployment

- Host: Vercel
- Domain: superself.online (Namecheap)
- Repo: github.com/9000fm/superself.online
