# superself.online Visual Guide

Windows 95/DOS CLI aesthetic for an electronic music label.
Retro aesthetic, modern feel. Elegant, minimal, digital.

---

## THEMES

Three theme modes: **Dark**, **Color** (8 curated palettes), **White**

### Dark (default)
- Background: `#000000`
- Foreground: `#ffffff`
- Frame border: `rgba(255,255,255,0.6)`
- Text muted: `rgba(255,255,255,0.4)`
- Win95 chrome: dark grays (`#3a3a3a`, `#252525`)

### Color (cycles through palettes on toggle)
| Palette | Background | Text | Highlights |
|---------|-----------|------|------------|
| Blue | `#0000FF` | white | white |
| Purple | `#4B0082` | white | white |
| Red | `#8B0000` | white | white |
| Green | `#004D00` | white | white |
| Yellow | `#C8A800` | black | black |
| Orange | `#CC4400` | white | white |
| Teal | `#005F5F` | white | white |
| Pink | `#8B005A` | white | white |

All color themes use authentic Win95 gray chrome.

### White
- Background: `#ffffff`
- Foreground: `#000000`
- Frame border: `rgba(0,0,0,0.3)`
- Text muted: `rgba(0,0,0,0.4)`
- Win95 chrome: authentic gray

---

## COLORS (CSS Variables)

| Variable | Dark | Color | White |
|----------|------|-------|-------|
| `--background` | `#000000` | palette bg | `#ffffff` |
| `--foreground` | `#ffffff` | palette fg | `#000000` |
| `--accent` | `#0000FF` | palette bg | `#000000` |
| `--frame-border` | `rgba(255,255,255,0.6)` | palette | `rgba(0,0,0,0.3)` |
| `--text-muted` | `rgba(255,255,255,0.4)` | palette | `rgba(0,0,0,0.4)` |
| `--text-primary` | `rgba(255,255,255,0.95)` | palette | `rgba(0,0,0,0.85)` |
| `--win95-bg` | `#3a3a3a` | `#c0c0c0` | `#c0c0c0` |

---

## TYPOGRAPHY

### Font Stack
```
Primary: var(--font-terminal), VT323, Fixedsys, Terminal, Consolas, monospace
Win95 titles: Segoe UI, Tahoma, sans-serif (13px, weight 600)
```

### Font Sizes (all responsive with clamp)
| Element | Size |
|---------|------|
| Main title "superself" | `clamp(2.5rem, 7vw, 5rem)` |
| Nav items | `clamp(1.2rem, 4vw, 1.6rem)` |
| Enter screen text | `clamp(1.2rem, 4vw, 1.8rem)` |
| About/panel text | `clamp(0.9rem, 2.5vw, 1.05rem)` |
| Copyright | `clamp(0.6rem, 1.2vw, 0.75rem)` |
| Win95 title bar | `13px` |
| Win95 close button | `22x20px` |

---

## SPACING

### Frame Insets (tight, Yamada-inspired)
| Element | Value |
|---------|-------|
| Frame border | `clamp(16px, 2.5vw, 32px)` |
| Content inset | `clamp(28px, 4vw, 48px)` |

### Component Spacing
| Element | Value |
|---------|-------|
| Nav item padding | `clamp(2px, 1vw, 6px) clamp(4px, 2vw, 8px)` |
| Nav gap | `clamp(20px, 5vw, 24px)` |
| Social icon padding | `8px` |
| Social icon gap | `12px` |
| Win95 panel padding | `16px 18px` |
| Shop window padding | `10-14px` |

---

## BORDERS & SHADOWS

| Element | Style |
|---------|-------|
| Main frame | `1px solid var(--frame-border)` |
| Win95 window | `2px solid` (highlight top-left, shadow bottom-right) + `2px 2px 0 #000` |
| Win95 button (normal) | Inset shadow: highlight TL, shadow BR |
| Win95 button (pressed) | Inset shadow: shadow TL, highlight BR |
| Win95 sunken panel | `inset 1px 1px 0 shadow, inset -1px -1px 0 highlight, inset 2px 2px 0 dark` |

---

## ANIMATIONS

### Icon Hover
- Y-axis spin: `animation: spin3d 1.2s linear infinite; animation-play-state: paused`
- On hover: `animation-play-state: running`
- Pauses at current position on leave (no jump)

### Blink Effects
| Class | Duration | Usage |
|-------|----------|-------|
| `.blink` | 0.5s step-end | Active cursor |
| `.blink-slow` | 0.7s step-end | Confirm pointer |
| `.blink-hover` | On hover only | Idle cursor |

### Scramble Effects
- Title "superself": Per-character slot-machine resolve (~1.5s total, left-to-right stagger)
- Enter screen: Same slot-machine for first word, quick frame-based scramble for transitions
- Language change: 18 frames at 40ms = 720ms total

### Boot Sequence
1. Logo fade-in: +400ms
2. Loading bar: +1200ms (22 blocks, variable timing)
3. ENTER text appears: +600ms after loading
4. Click ENTER → ENTER fades (400ms) → Logo dissolves (1.5s diagonal sweep) → Main

### Enter Screen Timing
- Hold per language: 4000ms
- Initial delay: 600ms
- Char appear stagger: 180ms
- Chaos spin per char: 600ms

### Main Entrance
- Frame: +500ms
- Title scramble: +2500ms
- Footer: +1000ms
- Burger nav: +4500ms (staggered blink-in)

---

## Z-INDEX LAYERS

| z-index | Element |
|---------|---------|
| 1 | Grid scene (3D tunnel) |
| 10 | UI (title, nav, social) |
| 50 | Language switcher |
| 90 | Inactive popups |
| 100 | Enter screen |
| 160 | Active popup |
| 200 | Transition animations |

---

## UI COMPONENTS

### Nav Items (`.nav-cli`)
- Default: `var(--foreground)` text, transparent bg
- Hover: `var(--nav-hover-bg)` bg, `var(--nav-hover-fg)` text
- Active: `var(--selection-bg)` bg, `var(--selection-fg)` text
- Transition: none (instant)

### Social Icons (`.social-icon`)
- Size: `clamp(22px, 5vw, 32px)`
- Default: `var(--text-muted)`
- Hover: `var(--social-hover-fg)` + `var(--social-hover-bg)` bg
- Spin: infinite Y-axis rotation on hover

### Mute Toggle
- Uses `.social-icon` class (same styling)
- Speaker icon (unmuted) / Crossed speaker (muted)
- Same hover spin behavior

### Theme Toggle
- Moon icon (dark) / Sun icon (color + white)
- Same Y-axis spin on hover
- Cycles: dark → 8 color palettes → white → dark

### Win95 Popups
- Background: `var(--win95-bg)`
- Titlebar: `var(--win95-title)` gradient
- Draggable on desktop, static on mobile
- Close button: Win95 pixel X icon

### Shop Window
- Product carousel with polaroid cards
- Product name inside polaroid bottom strip
- Win95 sunken panel around carousel
- Product counter `[1/4]` in title bar
- Size selector with label
- Full-width WhatsApp button

---

## RULES

1. **No accented characters** in DOS font — use plain ASCII equivalents
2. **No text shadows** — clean and flat
3. **No `!important`** — fix root cause, use proper specificity
4. **Use `clamp()`** for all responsive sizing
5. **Use CSS variables** for all colors — never hardcode white/black for theme-sensitive elements
6. **Real Japanese characters** for JP translations, not romaji
7. **Inline critical layout styles** — prevents CSS race conditions on load
8. **Retro aesthetic, modern feel** — Win95 chrome + careful typography + tight spacing + smooth animations
9. **Reduce motion** — respect `prefers-reduced-motion` media query

---

## KEY FILES

| File | Purpose |
|------|---------|
| `src/app/constants.ts` | WIN_FONT, FRAME_INSETS, WIN95_STYLES, COLORS, TIMING, COLOR_PALETTES |
| `src/app/globals.css` | Theme variables, animations, nav/social/button styles |
| `src/app/page.tsx` | Main orchestrator, inline styles, state machine |
| `src/app/translations.ts` | All i18n strings (ES/EN/JP) |
| `src/app/types.ts` | Phase, Language, ActiveSection types |
| `src/app/hooks/` | useEnterScreen, useAudio, useMainEntrance, etc. |
| `src/app/components/` | Shop, Mixes, Win95Popup, LogoDissolver, MuteToggle |
