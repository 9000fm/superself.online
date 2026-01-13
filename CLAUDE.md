# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**superself.online** - Electronic music label & creative brand website.

## Current State (v2)

Full interactive landing page with Windows 95/DOS CLI aesthetic:

### Boot Sequence
1. Blue screen appears
2. Logo fades in (centered)
3. Progress bar loader animates
4. Brief pause, then confirm screen

### Confirm Screen
- "CONTINUAR AL SITIO?" with blinking cursor
- SI/NO options with keyboard navigation (arrows + enter)
- Selecting NO triggers shutdown animation with animated dots
- Shutdown leads to black screen, then reboots

### Main Screen
- Thin white frame border (Keita Yamada style)
- "> superself_" title types in top-left (click to replay animation)
- "> acerca" and "> tienda" nav items type in top-right
- Nav items stay highlighted when active (grey bg, blue text)
- Social icons (Instagram, SoundCloud, Mail) in top-left outside frame
- Language switcher (ES/EN/JP) bottom-left, vertical orientation
- Copyright bottom-right
- Subtle ASCII animation in center

### About Section (acerca)
- Minimal overlay (no Windows chrome)
- Bio text types out character by character
- Mailing list form appears after typing completes

### Shop Section (tienda)
- Minimal overlay with "coming soon" message
- Animated dots (like shutdown animation)

### Welcome Popup (Easter Egg)
- Windows 95 style popup with titlebar
- Draggable (mouse + touch)
- Appears after 12-15 seconds randomly
- Shows notification after closing

### Features
- Multi-language support (ES/EN/JP) - all text translates
- Nav items re-type when language changes
- Click title to replay entrance animation
- Email icon copies flavio@superself.online to clipboard
- Keyboard shortcuts: ESC closes overlays, arrows for confirm screen

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
- **Aesthetic:** Minimal, digital, Windows 95/DOS, retro-futuristic
- **Typography:** Fixedsys/Terminal/monospace (DOS style)
- **Logo:** `/public/superself-logo-wh.png` (white version)
- **Contact:** flavio@superself.online

## Code Style

- Use inline styles for critical layout (prevents CSS race conditions on load)
- Prefer `vmin`/`vmax` and `clamp()` for responsive sizing
- Keep animations subtle and elegant
- No shadows, minimal effects
- Avoid accented characters in DOS font (use a instead of a, etc.)
- Use real Japanese characters (not romaji) for JP translations
- **Always go step by step, ask questions before implementing**

## Structure

```
src/app/
├── page.tsx        # Main landing page (~1100 lines)
├── layout.tsx      # Root layout with font config
├── LoadingDots.tsx # Boot loader progress bar
└── globals.css     # Base styles + animations
public/
├── superself-logo-wh.png
└── smiley.png      # Win95 popup icon
```

## Key States (page.tsx)

```typescript
type Phase = 'boot' | 'loading' | 'pause' | 'confirm' | 'shutdown' | 'off' | 'main';
type Language = 'ES' | 'EN' | 'JP';

// Main states
phase           // Current app phase
language        // Selected language
activeSection   // 'about' | 'shop' | null
showWelcomePopup // Easter egg popup
```

## CSS Classes (globals.css)

- `.blink` - Fast cursor blink (0.5s)
- `.blink-slow` - Slow blink (0.7s)
- `.blink-hover` - Blinks only on hover
- `.nav-cli` - Nav item with hover highlight
- `.win-btn` - Windows 95 button style

## Social Links

- Instagram: instagram.com/superself.online
- SoundCloud: soundcloud.com/superselfmusic
- Email: flavio@superself.online (copy to clipboard)

## Deployment

- Host: Vercel
- Domain: superself.online (Namecheap)
- Repo: github.com/9000fm/superself.online
