'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingDots from './LoadingDots';
import type { AsciiArtRef } from './AsciiArt';

// Types
import { Phase, Language, ActiveSection, ActiveWindow, WelcomeStep, Position } from './types';

// Translations
import { translations } from './translations';

// Constants
import { CONTACT, WIN_FONT, FRAME_INSETS, WIN95_STYLES, COLOR_PALETTES } from './constants';

// Hooks
import {
  useEnterScreen,
  useAudio,
  usePopupTransition,
  useShutdownSequence,
  useMainEntrance,
  useLanguageScramble,
  useDraggable,
  clampToViewport,
} from './hooks';

// Components
import {
  ErrorScreen,
  ShutdownScreen,
  Shop,
  MuteToggle,
  LogoDissolver,
} from './components';
import Mixes from './components/Mixes';

// Grid scene — imported directly (not lazy) so WebGL initializes during boot
import GridScene from './components/GridScene';
import Shoutbox from './components/Shoutbox';
import ShoutboxBadge from './components/ShoutboxBadge';

// Default panel sizes (approximate — used to compute home positions + animation target)
const PANEL_SIZES = {
  about: { w: 480, h: 420 },
  shop: { w: 780, h: 500 },
  mixes: { w: 520, h: 420 },
} as const;

// Home positions: where each panel opens by default (desktop only).
function getHomePosition(section: 'about' | 'shop' | 'mixes'): { x: number; y: number } {
  if (typeof window === 'undefined' || window.innerWidth < 768) return { x: 0, y: 0 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const s = PANEL_SIZES[section];

  // Small viewport (devtools open, narrow desktop): center with slight offset
  if (vw < 1100 || vh < 800) {
    const baseX = Math.max(20, (vw - s.w) / 2);
    const baseY = Math.max(20, (vh - s.h) / 2);
    // Slight stagger per section so they don't perfectly overlap
    const offsets = { about: { x: -30, y: -20 }, shop: { x: 10, y: 0 }, mixes: { x: -10, y: 30 } };
    const off = offsets[section];
    return {
      x: Math.round(Math.max(20, Math.min(baseX + off.x, vw - s.w - 20))),
      y: Math.round(Math.max(20, Math.min(baseY + off.y, vh - s.h - 20))),
    };
  }

  // Large viewport: distributed zones far from nav column
  let x: number, y: number;
  if (section === 'about') { x = vw * 0.32; y = vh * 0.22; }
  else if (section === 'shop') { x = vw * 0.54; y = vh * 0.14; }
  else { x = vw * 0.38; y = vh * 0.54; }
  const minX = Math.max(20, vw * 0.24);
  x = Math.max(minX, Math.min(x, vw - s.w - 20));
  y = Math.max(20, Math.min(y, vh - s.h - 20));
  return { x: Math.round(x), y: Math.round(y) };
}

// Isolated spinner component to prevent re-renders on main component
function Spinner() {
  const [frame, setFrame] = useState(0);
  const chars = ['|', '/', '-', '\\'];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return <span>{chars[frame]}</span>;
}

// Coordinate label at crosshair intersection — [x, y] with 0,0 at bottom-left
function CoordinateHUD() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const onMove = (e: MouseEvent) => {
      if (ref.current) {
        const x = (e.clientX / window.innerWidth).toFixed(3);
        const y = ((window.innerHeight - e.clientY) / window.innerHeight).toFixed(3);
        ref.current.style.transform = `translate(${e.clientX + 3}px, ${e.clientY - 16}px)`;
        ref.current.textContent = `[${x}, ${y}]`;
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div ref={ref} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      fontFamily: 'var(--font-terminal), monospace',
      fontSize: '16px',
      fontWeight: 'bold',
      letterSpacing: '0.08em',
      color: 'var(--foreground)',
      opacity: 0.9,
      pointerEvents: 'none',
      zIndex: 9998,
      willChange: 'transform',
      whiteSpace: 'nowrap',
    }}>
      [ 0 , 0 ]
    </div>
  );
}

// Crosshair cursor lines — desktop: follows mouse. Mobile: shows on tap, fades after 1.5s.
function CursorCrosshair() {
  const hRef = useRef<HTMLDivElement>(null);
  const vRef = useRef<HTMLDivElement>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    const show = (x: number, y: number) => {
      if (hRef.current) { hRef.current.style.transform = `translateY(${y}px)`; hRef.current.style.opacity = '0.3'; }
      if (vRef.current) { vRef.current.style.transform = `translateX(${x}px)`; vRef.current.style.opacity = '0.3'; }
    };
    const hide = () => {
      if (hRef.current) hRef.current.style.opacity = '0';
      if (vRef.current) vRef.current.style.opacity = '0';
    };

    if (isTouch) {
      const onTouch = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        show(t.clientX, t.clientY);
        clearTimeout(fadeTimer.current);
        fadeTimer.current = setTimeout(hide, 1500);
      };
      const onTouchMove = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        show(t.clientX, t.clientY);
        clearTimeout(fadeTimer.current);
      };
      const onTouchEnd = () => {
        clearTimeout(fadeTimer.current);
        fadeTimer.current = setTimeout(hide, 1500);
      };
      window.addEventListener('touchstart', onTouch, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
      hide();
      return () => {
        window.removeEventListener('touchstart', onTouch);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      };
    } else {
      const onMove = (e: MouseEvent) => {
        show(e.clientX, e.clientY);
        clearTimeout(fadeTimer.current);
        fadeTimer.current = setTimeout(hide, 3000);
      };
      window.addEventListener('mousemove', onMove);
      return () => { window.removeEventListener('mousemove', onMove); clearTimeout(fadeTimer.current); };
    }
  }, []);

  return (
    <>
      <div ref={hRef} style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '1.5px', background: 'var(--foreground)',
        opacity: 0, pointerEvents: 'none', zIndex: 1,
        willChange: 'transform',
        transition: 'opacity 0.4s ease',
      }} />
      <div ref={vRef} style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '1.5px', background: 'var(--foreground)',
        opacity: 0, pointerEvents: 'none', zIndex: 1,
        willChange: 'transform',
        transition: 'opacity 0.4s ease',
      }} />
    </>
  );
}

export default function Home() {
  // Core state
  const [phase, setPhase] = useState<Phase>('boot');
  const [showLogo, setShowLogo] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [language, setLanguage] = useState<Language>('ES');
  const t = translations[language];

  // Popup/section states
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  // openStack: last item = focused (top z-index). Multi-window on desktop, 1-at-a-time on mobile.
  const [openStack, setOpenStack] = useState<Array<Exclude<ActiveSection, null>>>([]);
  const [visibleNavItems, setVisibleNavItems] = useState(0);
  const [navBlinking, setNavBlinking] = useState<number | null>(null);
  // activeWindow tracks welcome-popup focus only (the 3 main panels use openStack).
  const [activeWindow, setActiveWindow] = useState<ActiveWindow>(null);
  const [welcomeStep, setWelcomeStep] = useState<WelcomeStep>('message');
  const [smileyExpression, setSmileyExpression] = useState<'open-right' | 'open-left' | 'blink'>('open-right');
  const smileyDirectionRef = useRef<'right' | 'left'>('right');
  const focusedSection: Exclude<ActiveSection, null> | null =
    openStack.length > 0 ? openStack[openStack.length - 1] : null;
  const isOpen = (s: Exclude<ActiveSection, null>) => openStack.includes(s);
  const isFocused = (s: Exclude<ActiveSection, null>) => focusedSection === s;

  // Email/subscribe states
  const [showEmailCopied, setShowEmailCopied] = useState(false);
  const [emailToastPos, setEmailToastPos] = useState({ x: 0, y: 0 });
  const [showEmailError, setShowEmailError] = useState(false);
  const [emailErrorPos, setEmailErrorPos] = useState({ x: 0, y: 0 });
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSubscribedPopup, setShowSubscribedPopup] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const lastClickPos = useRef({ x: 0, y: 0 });

  // Skip and replay state
  const [skipMode, setSkipMode] = useState(false);
  const [replayTrigger, setReplayTrigger] = useState(0);
  const [rebootCount, setRebootCount] = useState(0);

  // Logo dissolution
  const [dissolving, setDissolving] = useState(false);
  const [enterFadingOut, setEnterFadingOut] = useState(false);
  const [invertFlash, setInvertFlash] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  // Skip flash entirely when the center rect (foreground) is dark — looks "off".
  const flashEnabledRef = useRef(true);
  // Cooldown gate for the title-click flash so rapid clicks don't stack remounts/animations.
  const lastFlashTsRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  // Landscape warning
  const [showLandscapeWarning, setShowLandscapeWarning] = useState(false);

  // Explore mode (labyrinth AFK screensaver)

  // Theme state — cycles: dark → color palettes → white → dark
  type ThemeMode = 'dark' | 'color' | 'white';
  const [themeMode, setThemeMode] = useState<ThemeMode>('color');
  const [paletteIndex, setPaletteIndex] = useState(0);

  // Apply color palette CSS variables
  const applyPalette = useCallback((idx: number) => {
    const p = COLOR_PALETTES[idx];
    const lum = (hex: string) => {
      const h = hex.replace('#', '');
      const r = parseInt(h.slice(0,2), 16);
      const g = parseInt(h.slice(2,4), 16);
      const b = parseInt(h.slice(4,6), 16);
      return r * 0.299 + g * 0.587 + b * 0.114;
    };
    // Auto-invert: if the center rect (fg) would be darker than the bg,
    // swap the palette so fg is always the lighter color. Flash then always works.
    const needsSwap = lum(p.fg) < lum(p.bg);
    const fg = needsSwap ? p.bg : p.fg;
    const bg = needsSwap ? p.fg : p.bg;
    const selBg = needsSwap ? p.selFg : p.selBg;
    const selFg = needsSwap ? p.selBg : p.selFg;
    const hoverBg = needsSwap ? p.hoverFg : p.hoverBg;
    const hoverFg = needsSwap ? p.hoverBg : p.hoverFg;
    // Regenerate rgba accent props from the new fg so frame/muted/primary stay consistent.
    let frame: string = p.frame, muted: string = p.muted, primary: string = p.primary;
    if (needsSwap) {
      const h = fg.replace('#', '');
      const r = parseInt(h.slice(0,2), 16);
      const g = parseInt(h.slice(2,4), 16);
      const b = parseInt(h.slice(4,6), 16);
      frame = `rgba(${r},${g},${b},0.55)`;
      muted = `rgba(${r},${g},${b},0.5)`;
      primary = `rgba(${r},${g},${b},0.9)`;
    }

    const el = document.documentElement;
    el.style.setProperty('--user-color', bg);
    el.style.setProperty('--background', bg);
    el.style.setProperty('--foreground', fg);
    el.style.setProperty('--frame-border', frame);
    el.style.setProperty('--text-muted', muted);
    el.style.setProperty('--text-primary', primary);
    el.style.setProperty('--selection-bg', selBg);
    el.style.setProperty('--selection-fg', selFg);
    el.style.setProperty('--social-hover-bg', selBg);
    el.style.setProperty('--social-hover-fg', selFg);
    el.style.setProperty('--nav-hover-bg', hoverBg);
    el.style.setProperty('--nav-hover-fg', hoverFg);
    el.style.setProperty('--nav-hover-fg-contrast', hoverFg);
    el.style.setProperty('--bar-color', p.bar);
    // Panel tokens: adapt to popup-bg luminance (popup-bg = fg).
    const fgLum = lum(fg);
    const bgLum = lum(bg);
    const isLightFg = fgLum > 128;
    if (isLightFg) {
      el.style.setProperty('--panel-border', 'rgba(0,0,0,0.28)');
      el.style.setProperty('--panel-divider', 'rgba(0,0,0,0.18)');
      el.style.setProperty('--panel-prompt', 'rgba(0,0,0,0.6)');
      el.style.setProperty('--panel-muted', 'rgba(0,0,0,0.5)');
    } else {
      el.style.setProperty('--panel-border', 'rgba(255,255,255,0.22)');
      el.style.setProperty('--panel-divider', 'rgba(255,255,255,0.14)');
      el.style.setProperty('--panel-prompt', 'rgba(255,255,255,0.55)');
      el.style.setProperty('--panel-muted', 'rgba(255,255,255,0.45)');
    }
    // Flash = whichever of fg/bg is lighter (after auto-invert, always fg).
    el.style.setProperty('--flash-color', fgLum >= bgLum ? fg : bg);
    // Flash always enabled now — invert guarantees the center is never the dark one.
    flashEnabledRef.current = true;
    // Save to localStorage for hydration script
    localStorage.setItem('superself-color', bg);
    localStorage.setItem('superself-fg', fg);
  }, []);

  const clearPaletteOverrides = useCallback(() => {
    const el = document.documentElement;
    const props = ['--user-color','--background','--foreground','--bar-color','--frame-border','--text-muted','--text-primary','--selection-bg','--selection-fg','--social-hover-bg','--social-hover-fg','--nav-hover-bg','--nav-hover-fg','--nav-hover-fg-contrast','--panel-border','--panel-divider','--panel-prompt','--panel-muted','--flash-color'];
    props.forEach(p => el.style.removeProperty(p));
  }, []);

  useEffect(() => {
    let stored = document.documentElement.dataset.theme as string | undefined;
    if (stored === 'light') { stored = 'color'; localStorage.setItem('theme', 'color'); document.documentElement.dataset.theme = 'color'; }
    const savedIdx = parseInt(localStorage.getItem('superself-palette') || '0', 10);
    if (stored === 'dark' || stored === 'white') {
      setThemeMode(stored as ThemeMode);
    } else {
      // default: color mode with charcoal (palette 0)
      document.documentElement.dataset.theme = 'color';
      const idx = isNaN(savedIdx) ? 0 : savedIdx % COLOR_PALETTES.length;
      setPaletteIndex(idx);
      applyPalette(idx);
    }
  }, [applyPalette]);

  // Ref for ASCII art
  const asciiRef = useRef<AsciiArtRef>(null);

  // Ref for logo element (to capture bounding rect for dissolution)
  const logoRef = useRef<HTMLDivElement>(null);
  const [logoRect, setLogoRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  // True only once LogoDissolver has painted its first frame of particles — gates the PNG fade.
  const [particlesReady, setParticlesReady] = useState(false);
  // Tracks whether the webp has been preloaded so we don't fire `new Image()` more than once.
  const logoPreloadedRef = useRef(false);

  // Nav button refs for popup transition
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Style constants
  const winFont = WIN_FONT;
  const win95Button = WIN95_STYLES.button;
  const frameInset = FRAME_INSETS.frame;
  const frameInsetBottom = FRAME_INSETS.frameBottom;
  const contentInset = FRAME_INSETS.content;
  const contentInsetBottom = FRAME_INSETS.contentBottom;

  // Custom hooks
  const audio = useAudio();

  const enterScreen = useEnterScreen({
    phase,
    onEnter: () => {
      if (enterFadingOut || dissolving) return;
      audio.init();
      audio.playWoosh();
      // T+0: flicker starts — enter text blinks and disappears
      setEnterFadingOut(true);
      // T+1200: dissolution starts (pause after flicker for dramatic breath)
      setTimeout(() => {
        if (logoRef.current) {
          const rect = logoRef.current.getBoundingClientRect();
          setLogoRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
        }
        setDissolving(true);
        setTimeout(() => audio.startMusic(), 400);
      }, 1200);
    },
  });

  const handleDissolutionComplete = useCallback(() => {
    setDissolving(false);
    setEnterFadingOut(false);
    setParticlesReady(false);
    setSkipMode(true);
    setPhase('main');
  }, []);

  // Preload the logo webp the moment we enter the 'enter' phase. LogoDissolver's internal
  // `new Image()` then decodes from cache the instant dissolve fires, so particles render
  // in the same tick without a void between the PNG fade and the canvas paint.
  useEffect(() => {
    if (phase === 'enter' && !logoPreloadedRef.current) {
      logoPreloadedRef.current = true;
      const img = new Image();
      img.src = '/superself-logo-wh.webp';
    }
  }, [phase]);

  const shutdown = useShutdownSequence({
    phase,
    language,
    onPhaseChange: setPhase,
    onRebootComplete: () => {
      // Reset all state for reboot
      audio.stopAll();
      setDissolving(false);
      setEnterFadingOut(false);
      setParticlesReady(false);
      entrance.resetEntranceState();
      setShowWelcomePopup(false);
      setOpenStack([]);
      /* noop: badge is persistent */
      setShowLogo(false);
      setShowLoader(false);
      setRebootCount((c) => c + 1);
      setPhase('boot');
    },
  });

  const entrance = useMainEntrance({
    phase,
    language,
    skipMode,
    replayTrigger,
    onSkipModeComplete: () => setSkipMode(false),
  });

  const { scrambled } = useLanguageScramble({ phase, language });

  const draggable = useDraggable();
  const popupTransition = usePopupTransition();

  // Cycle color palette — triggered by clicking center rect in GridScene
  const cycleColorPalette = useCallback(() => {
    if (themeMode !== 'color') return;
    const nextIdx = (paletteIndex + 1) % COLOR_PALETTES.length;
    setPaletteIndex(nextIdx);
    applyPalette(nextIdx);
    localStorage.setItem('superself-palette', String(nextIdx));
  }, [themeMode, paletteIndex, applyPalette]);

  // Theme toggle — 3 states only: dark → color → light
  const toggleTheme = useCallback(() => {
    if (themeMode === 'dark') {
      // dark → color (use saved palette)
      clearPaletteOverrides();
      document.documentElement.dataset.theme = 'color';
      setThemeMode('color');
      applyPalette(paletteIndex);
      localStorage.setItem('theme', 'color');
    } else if (themeMode === 'color') {
      // color → white
      clearPaletteOverrides();
      document.documentElement.style.removeProperty('--background');
      localStorage.removeItem('superself-color');
      localStorage.removeItem('superself-fg');
      document.documentElement.dataset.theme = 'white';
      setThemeMode('white');
      localStorage.setItem('theme', 'white');
    } else {
      // white → dark
      clearPaletteOverrides();
      document.documentElement.style.removeProperty('--background');
      localStorage.removeItem('superself-color');
      localStorage.removeItem('superself-fg');
      document.documentElement.dataset.theme = 'dark';
      setThemeMode('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [themeMode, paletteIndex, applyPalette, clearPaletteOverrides]);

  // Icon spin: keep hover background until rotation completes
  useEffect(() => {
    function handleEnter(e: Event) {
      (e.currentTarget as HTMLElement).classList.add('icon-spinning');
    }
    function handleLeave(e: Event) {
      const el = e.currentTarget as HTMLElement;
      const svg = el.querySelector('svg');
      if (!svg) { el.classList.remove('icon-spinning'); return; }
      function onIter() {
        svg!.removeEventListener('animationiteration', onIter);
        el.classList.remove('icon-spinning');
      }
      svg.addEventListener('animationiteration', onIter);
      // Fallback: remove after one full cycle
      setTimeout(() => { svg.removeEventListener('animationiteration', onIter); el.classList.remove('icon-spinning'); }, 2600);
    }
    function attach() {
      document.querySelectorAll('.social-icon').forEach(el => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
        el.addEventListener('mouseenter', handleEnter);
        el.addEventListener('mouseleave', handleLeave);
      });
    }
    attach();
    const obs = new MutationObserver(attach);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); document.querySelectorAll('.social-icon').forEach(el => { el.removeEventListener('mouseenter', handleEnter); el.removeEventListener('mouseleave', handleLeave); }); };
  }, []);

  // Detect problematic aspect ratio (landscape on small screens)
  useEffect(() => {
    const checkAspectRatio = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspectRatio = w / h;
      const isProblematic = aspectRatio > 2.0 && h < 380;
      setShowLandscapeWarning(isProblematic);
    };

    checkAspectRatio();
    window.addEventListener('resize', checkAspectRatio);
    window.addEventListener('orientationchange', checkAspectRatio);

    return () => {
      window.removeEventListener('resize', checkAspectRatio);
      window.removeEventListener('orientationchange', checkAspectRatio);
    };
  }, []);

  // Nav items blink in one by one during entrance
  useEffect(() => {
    if (entrance.burgerVisible && visibleNavItems < 3) {
      // For each item: blink it 3 times then keep it visible
      const stagger = 800; // delay between items

      const timer = setTimeout(() => {
        // Start blinking this item
        setNavBlinking(visibleNavItems);
        let blinks = 0;
        const blinkInterval = setInterval(() => {
          blinks++;
          if (blinks >= 6) { // 3 on/off cycles
            clearInterval(blinkInterval);
            setNavBlinking(null);
            setVisibleNavItems(prev => prev + 1);
          }
        }, 50);
      }, visibleNavItems * stagger);

      return () => clearTimeout(timer);
    }
  }, [entrance.burgerVisible, visibleNavItems]);

  // Boot sequence — logo only, 2 seconds, then straight to main
  useEffect(() => {
    if (phase === 'boot') {
      const logoTimer = setTimeout(() => setShowLogo(true), 400);
      const loaderTimer = setTimeout(() => setShowLoader(true), 1200);

      return () => {
        clearTimeout(logoTimer);
        clearTimeout(loaderTimer);
      };
    }
  }, [phase, rebootCount]);

  const handleLoadingComplete = useCallback(() => {
    setPhase('enter');
  }, []);

  // Skip handler
  const handleSkip = () => {
    setShowLogo(false);
    setShowLoader(false);
    setSkipMode(true);
    setTimeout(() => setPhase('main'), 400);
  };

  // Re-scramble title + punchy flash + audio ping (flash only if fg is light enough,
  // with a 500ms cooldown so rapid clicks don't stack animations/remounts).
  const handleTitleClick = () => {
    setReplayTrigger((prev) => prev + 1);
    audio.playWoosh();
    if (!flashEnabledRef.current) return;
    const now = performance.now();
    if (now - lastFlashTsRef.current < 500) return;
    lastFlashTsRef.current = now;
    setFlashKey((k) => k + 1);
    setInvertFlash(true);
    setTimeout(() => setInvertFlash(false), 1200);
  };

  // Welcome popup handlers
  const handleWelcomeOk = () => {
    if (welcomeStep === 'message') {
      setWelcomeStep('subscribe');
    } else {
      setShowWelcomePopup(false);
      /* noop: badge is persistent */
      setWelcomeStep('message');
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
    /* noop: badge is persistent */
    setWelcomeStep('message');
  };

  // Email handlers
  const handleCopyEmail = async (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0]?.clientX || 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY || 0 : e.clientY;

    try {
      await navigator.clipboard.writeText(CONTACT.email);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = CONTACT.email;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setEmailToastPos({ x: clientX, y: clientY });
    setShowEmailCopied(true);
    setTimeout(() => setShowEmailCopied(false), 2000);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(subscribeEmail)) {
      setEmailErrorPos({ x: lastClickPos.current.x, y: lastClickPos.current.y });
      setShowEmailError(true);
      setTimeout(() => setShowEmailError(false), 2000);
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setSubscribeEmail('');
        setIsSubscribed(true);
        setShowWelcomePopup(false);
        setWelcomeStep('message');
        setShowSubscribedPopup(true);
      } else {
        setEmailErrorPos({ x: lastClickPos.current.x, y: lastClickPos.current.y });
        setShowEmailError(true);
        setTimeout(() => setShowEmailError(false), 2000);
      }
    } catch {
      setEmailErrorPos({ x: lastClickPos.current.x, y: lastClickPos.current.y });
      setShowEmailError(true);
      setTimeout(() => setShowEmailError(false), 2000);
    }
  };

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close only the top-most popup (OS-like). Welcome is always topmost if open.
        setShowWelcomePopup(prev => {
          if (prev) return false;
          setOpenStack(stack => stack.length > 0 ? stack.slice(0, -1) : stack);
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track actual mobile (touch + narrow) vs desktop (mouse, any size).
  // Small desktop windows (devtools open) still allow drag + positioned panels.
  useEffect(() => {
    const check = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isNarrow = window.innerWidth < 768;
      setIsMobile(isTouch && isNarrow);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  // Effective popup position — mobile always centered (ignore any stored desktop pos).
  // Prevents windows from rendering off-screen when stored positions don't fit viewport.
  const effectivePos = (section: 'welcome' | 'about' | 'shop' | 'mixes'): Position => {
    if (isMobile) return { x: 0, y: 0 };
    if (section === 'welcome') return draggable.welcomePos;
    if (section === 'about') return draggable.aboutPos;
    if (section === 'shop') return draggable.shopPos;
    return draggable.mixesPos;
  };

  // Helper: build the current popup box for close animation (uses actual position after drag).
  const getCurrentBox = (section: 'about' | 'shop' | 'mixes'): { x: number; y: number; w: number; h: number } => {
    const pos = draggable.getPosition(section);
    const size = PANEL_SIZES[section];
    return { x: pos.x, y: pos.y, w: size.w, h: size.h };
  };

  // Smiley with life — random 6-12s intervals, 25% chance of double-blink + direction flip
  useEffect(() => {
    if (!showWelcomePopup) {
      setSmileyExpression('open-right');
      smileyDirectionRef.current = 'right';
      return;
    }

    const timeouts: Array<ReturnType<typeof setTimeout>> = [];
    const openExpr = () => smileyDirectionRef.current === 'right' ? 'open-right' : 'open-left';

    const scheduleNext = () => {
      const interval = 6000 + Math.random() * 6000; // 6-12s
      const t1 = setTimeout(() => {
        const doDirectionChange = Math.random() < 0.25;
        if (doDirectionChange) {
          // Double blink with direction flip
          setSmileyExpression('blink');
          const t2 = setTimeout(() => {
            setSmileyExpression(openExpr());
            const t3 = setTimeout(() => {
              setSmileyExpression('blink');
              const t4 = setTimeout(() => {
                smileyDirectionRef.current = smileyDirectionRef.current === 'right' ? 'left' : 'right';
                setSmileyExpression(openExpr());
                scheduleNext();
              }, 150);
              timeouts.push(t4);
            }, 100);
            timeouts.push(t3);
          }, 150);
          timeouts.push(t2);
        } else {
          // Single blink, keep direction
          setSmileyExpression('blink');
          const t2 = setTimeout(() => {
            setSmileyExpression(openExpr());
            scheduleNext();
          }, 150);
          timeouts.push(t2);
        }
      }, interval);
      timeouts.push(t1);
    };
    scheduleNext();
    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [showWelcomePopup]);

  // Window resize: re-home non-customized panels to fit new viewport.
  // Customized panels get clamped to stay visible.
  useEffect(() => {
    const onResize = () => {
      if (typeof window === 'undefined') return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 768;
      (['about', 'shop', 'mixes'] as const).forEach(section => {
        const isMobileNow = mobile;
        const customized = draggable.isCustomized(section);
        if (isMobileNow) {
          // Mobile: everything centered, skip positioning
          return;
        }
        if (customized) {
          // Clamp customized pos to new viewport (keeping titlebar reachable,
          // allowing partial off-screen like drag clamp does)
          const cur = draggable.getPosition(section);
          if (cur.x === 0 && cur.y === 0) return;
          const s = PANEL_SIZES[section];
          const clamped = clampToViewport(cur, s.w, s.h);
          if (clamped.x !== cur.x || clamped.y !== cur.y) {
            draggable.setPositionCustom(section, clamped);
          }
        } else {
          // Re-home to fresh position for new viewport
          const home = getHomePosition(section);
          const cur = draggable.getPosition(section);
          if (home.x !== cur.x || home.y !== cur.y) {
            draggable.setPosition(section, home);
          }
        }
      });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [draggable]);

  const showMainContent = phase === 'main';

  return (
    <main
      id="main-content"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        minHeight: '-webkit-fill-available',
        backgroundColor: phase === 'off' ? '#000' : phase === 'error' ? '#0000FF' : 'var(--background)',
        margin: 0,
        padding: 0,
        transition: 'background-color 300ms ease',
        userSelect: 'none',
      }}
    >
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Cursor crosshair — desktop only */}
      {showMainContent && <CursorCrosshair />}

      {/* Flashbang overlay — foreground color, cinematic hold + slow decay.
           Performance-friendly (flat div, no filter). */}
      {invertFlash && (
        <div
          key={flashKey}
          aria-hidden
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--flash-color, #ffffff)',
            zIndex: 9999,
            pointerEvents: 'none',
            // GPU layer hints for smooth opacity animation, without `isolation` /
            // `contain` — those flatten the blend with underlying layers and make
            // the flash feel static/robotic.
            willChange: 'opacity',
            transform: 'translateZ(0)',
            animation: 'flashbangClick 1200ms linear forwards',
          }}
        />
      )}

      {/* Frame border + grid inside it */}
      <div
        data-frame
        style={{
          position: 'absolute',
          top: frameInset,
          left: frameInset,
          right: frameInset,
          bottom: frameInsetBottom,
          // Main's proven approach: frame shows during dissolving so GridScene's internal
          // canvas fade-in (rectAlpha T+1s→T+3s, lineAlpha T+1.8s→T+3.3s) plays smoothly
          // BEHIND the LogoDissolver particles. GridScene handles its own alpha timing.
          display: (showMainContent || dissolving) ? 'block' : 'none',
          pointerEvents: 'auto',
          zIndex: 3,
          border: '1px solid var(--frame-border, rgba(255,255,255,0.6))',
          // During dissolving: CSS animation fades in gradually (synced with GridScene).
          // Post-dissolution: keep animation applied (forwards fill = opacity 1).
          // Removing animation on mobile Safari causes a brief repaint dip.
          opacity: (showMainContent && !dissolving) ? 1 : undefined,
          animation: (dissolving || showMainContent) ? 'frameReveal 3.5s ease-in forwards' : 'none',
        }}
      >
        <GridScene dissolving={dissolving} />
      </div>

      {/* Marquee click zone — only active in color mode, cycles palettes on any click inside the frame */}
      {showMainContent && themeMode === 'color' && (
        <div
          onClick={cycleColorPalette}
          style={{
            position: 'absolute',
            top: frameInset,
            left: frameInset,
            right: frameInset,
            bottom: frameInsetBottom,
            cursor: 'pointer',
            zIndex: 5,
            pointerEvents: 'auto',
          }}
        />
      )}

      {/* === WHOLE-SCREEN CLICK TO ENTER (enter phase only) === */}
      {phase === 'enter' && !enterFadingOut && (
        <div
          onClick={enterScreen.handleEnter}
          aria-label="Enter site"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            cursor: 'pointer',
            background: 'transparent',
          }}
        />
      )}

      {/* === BOOT / LOADING PHASE === */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 'max(31vmin, min(45vw, 250px))',
          display: phase === 'boot' || phase === 'loading' || phase === 'enter' ? 'flex' : 'none',
        }}
      >
        <div
          ref={logoRef}
          onClick={phase === 'enter' && !enterFadingOut ? enterScreen.handleEnter : undefined}
          role={phase === 'enter' && !enterFadingOut ? 'button' : undefined}
          aria-label={phase === 'enter' ? 'Enter site' : undefined}
          tabIndex={phase === 'enter' && !enterFadingOut ? 0 : -1}
          onKeyDown={phase === 'enter' && !enterFadingOut ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterScreen.handleEnter(); } } : undefined}
          style={{
            marginBottom: '1rem',
            width: '86%',
            aspectRatio: '1',
            position: 'relative',
            opacity: showLogo && !(dissolving && particlesReady) ? 1 : 0,
            // Only fade the PNG once LogoDissolver confirmed particles are painted.
            // 100ms is imperceptible because the canvas silhouette sits right on top.
            transition: (dissolving && particlesReady) ? 'opacity 0.1s linear' : 'none',
            cursor: phase === 'enter' && !enterFadingOut ? 'pointer' : 'default',
            outline: 'none',
          }}
        >
          <div
            aria-label="superself"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--foreground, #fff)',
              WebkitMaskImage: 'url(/superself-logo-wh.webp)',
              maskImage: 'url(/superself-logo-wh.webp)',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              pointerEvents: 'none',
            }}
          />
        </div>
        <div
          style={{
            opacity: (showLoader || phase === 'enter') ? 1 : 0,
            width: 'clamp(50%, 40vw, 80%)',
            marginTop: '0',
            position: 'relative',
            top: '-0.6rem',
            height: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showLoader && (phase === 'boot' || phase === 'loading') && (
            <LoadingDots key={rebootCount} onComplete={handleLoadingComplete} />
          )}
          {phase === 'enter' && !(enterFadingOut && dissolving) && (
            <div
              onClick={!enterFadingOut ? enterScreen.handleEnter : undefined}
              style={{
                fontFamily: winFont,
                fontSize: 'clamp(0.95rem, 2.3vw, 1.35rem)',
                color: 'var(--foreground, #fff)',
                letterSpacing: '0.35em',
                cursor: enterFadingOut ? 'default' : 'pointer',
                textAlign: 'center',
                userSelect: 'none',
                position: 'relative',
                textTransform: 'uppercase',
                animation: enterFadingOut
                  ? 'blink 0.1s step-end 5'
                  : 'fadeIn 0.5s ease-out',
              }}
            >
              {enterScreen.displayText}<span className={enterFadingOut ? '' : 'blink'} style={{ position: 'absolute', opacity: enterScreen.displayText && !enterFadingOut ? 1 : 0 }}>_</span>
            </div>
          )}
        </div>
      </div>

      {/* === LOGO DISSOLUTION OVERLAY === */}
      <LogoDissolver
        logoRect={logoRect}
        src="/superself-logo-wh.webp"
        trigger={dissolving}
        onComplete={handleDissolutionComplete}
        onReady={() => setParticlesReady(true)}
      />

      {/* === SHUTDOWN PHASE === */}
      {phase === 'shutdown' && (
        <ShutdownScreen shutdownText={shutdown.shutdownText} shutdownDots={shutdown.shutdownDots} />
      )}

      {/* === ERROR PHASE === */}
      {phase === 'error' && <ErrorScreen language={language} errorCode={shutdown.errorCode} />}

      {/* === MAIN CONTENT === */}

      {/* Top Left - CLI Logo.
          Padding enlarges the hit area so clicks in the gaps between glyphs (or just
          above/below the text) still register as title clicks instead of falling through
          to the palette cycle zone underneath. Negative margin cancels the padding
          visually so the text stays flush with the frame corner. */}
      <div
        style={{
          position: 'absolute',
          top: contentInset,
          left: contentInset,
          display: showMainContent ? 'inline-block' : 'none',
          fontFamily: winFont,
          fontSize: 'clamp(3.2rem, 9vw, 5rem)',
          color: 'var(--foreground)',
          backgroundColor: 'transparent',
          visibility: entrance.showTitlePrompt ? 'visible' : 'hidden',
          cursor: 'pointer',
          zIndex: 10,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          padding: '12px 16px',
          margin: '-12px -16px',
          lineHeight: '1',
        }}
        onClick={handleTitleClick}
      >
        {entrance.typedTitle}
      </div>

      {/* Center - ASCII Art */}
      <div
        aria-hidden="true"
        onMouseMove={(e) => {
          asciiRef.current?.handlePointerMove(e.clientX, e.clientY);
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            asciiRef.current?.handlePointerDown(e.clientX, e.clientY);
          }
        }}
        onMouseUp={(e) => {
          asciiRef.current?.handlePointerUp(e.clientX, e.clientY);
        }}
        onMouseLeave={(e) => {
          asciiRef.current?.handlePointerUp(e.clientX, e.clientY);
          asciiRef.current?.handlePointerLeave();
        }}
        onTouchStart={(e) => {
          if (e.target === e.currentTarget && e.touches.length > 0) {
            e.preventDefault();
            asciiRef.current?.handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            asciiRef.current?.handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length > 0) {
            asciiRef.current?.handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          asciiRef.current?.handlePointerUp(touch?.clientX ?? 0, touch?.clientY ?? 0);
        }}
        style={{
          position: 'absolute',
          top: frameInset,
          left: frameInset,
          right: frameInset,
          bottom: frameInsetBottom,
          display: showMainContent ? 'block' : 'none',
          opacity: entrance.showFooter ? 1 : 0,
          transition: 'opacity 2s ease-in-out',
          overflow: 'hidden',
          zIndex: 1,
          cursor: 'crosshair',
        }}
      >
      </div>

      {/* Mute toggle — top right, slightly below frame edge to align with title */}
      <div
        style={{
          position: 'absolute',
          top: `calc(${contentInset} + clamp(0.5rem, 1.2vw, 0.8rem))`,
          right: contentInset,
          display: showMainContent ? 'flex' : 'none',
          opacity: entrance.showFooter ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
          transitionDelay: entrance.showFooter ? '3.5s' : '0s',
          zIndex: 10,
        }}
      >
        <MuteToggle isMuted={audio.isMuted} onToggle={audio.toggleMute} />
      </div>


      {/* Social icons — gap between icons is dead zone (default pointerEvents). */}
      <div
        className="social-icons-container"
        style={{
          position: 'absolute',
          bottom: contentInsetBottom,
          right: contentInset,
          display: showMainContent ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '8px',
          alignItems: 'center',
          opacity: entrance.showFooter ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
          transitionDelay: entrance.showFooter ? '3.5s' : '0s',
          zIndex: 10,
        }}
      >
        <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram" aria-label="Instagram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </a>
        <a href={CONTACT.soundcloud} target="_blank" rel="noopener noreferrer" className="social-icon" title="SoundCloud" aria-label="SoundCloud">
          <svg width="18" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 17.939h-1v-8.068c.308-.231.639-.429 1-.566v8.634zm3 0h1v-9.224c-.229.265-.443.548-.621.857l-.379-.184v8.551zm-2 0h1v-8.848c-.508-.079-.623-.05-1-.01v8.858zm-4 0h1v-7.02c-.312.458-.555.971-.692 1.535l-.308-.182v5.667zm-3-5.25c-.606.547-1 1.354-1 2.268 0 .914.394 1.721 1 2.268v-4.536zm18.879-.671c-.204-2.837-2.404-5.079-5.117-5.079-1.022 0-1.964.328-2.762.877v10.123h9.089c1.607 0 2.911-1.393 2.911-3.106 0-2.233-2.168-3.772-4.121-2.815zm-16.879-.027c-.302-.024-.526-.03-1 .122v5.689h1v-5.811z" />
          </svg>
        </a>
        <button onClick={handleCopyEmail} className="social-icon" title={CONTACT.email} aria-label="Copy email address">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z" />
          </svg>
        </button>
      </div>

      {/* Navigation — always visible, below title.
          Container keeps default pointerEvents so clicks in the gap between nav items
          are absorbed as dead zone (neither open a panel nor cycle palette). */}
      <nav
        aria-label="Main navigation"
        style={{
          position: 'absolute',
          top: `calc(${contentInset} + clamp(5rem, 14vw, 9rem))`,
          left: contentInset,
          display: showMainContent ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 'clamp(24px, 6vw, 28px)',
          opacity: 1,
          zIndex: 10,
        }}
      >
        {(['about', 'shop', 'mixes'] as const).map((section, idx) => {
          const isVisible = visibleNavItems > idx;
          const isBlinking = navBlinking === idx;
          if (!isVisible && !isBlinking) return null;
          const tKey = section;
          const isActive = isOpen(section);
          return (
          <button
            key={section}
            ref={(el) => { navRefs.current[section] = el; }}
            className={isActive ? '' : 'nav-cli'}
            onClick={() => {
              const wasOpen = isOpen(section);
              if (wasOpen) {
                // Toggle off — trigger close animation, then remove from stack
                // (position is kept in state + localStorage so reopen restores it)
                popupTransition.triggerClose(section, getCurrentBox(section));
                setTimeout(() => {
                  setOpenStack(stack => stack.filter(s => s !== section));
                }, 300);
              } else {
                // Toggle on — add to top of stack
                const rect = navRefs.current[section]?.getBoundingClientRect();
                const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
                if (mobile) {
                  setOpenStack([section]);
                  if (rect) popupTransition.triggerOpen(rect, section);
                } else {
                  // Desktop: use saved position (localStorage), else fixed home position
                  // distributed across the viewport (away from nav column, using empty space).
                  const saved = draggable.getPosition(section);
                  const size = PANEL_SIZES[section];
                  const targetPos = (saved.x !== 0 || saved.y !== 0)
                    ? saved
                    : getHomePosition(section);
                  if (saved.x === 0 && saved.y === 0) {
                    draggable.setPosition(section, targetPos);
                  }
                  const targetBox = { x: targetPos.x, y: targetPos.y, w: size.w, h: size.h };
                  if (rect) popupTransition.triggerOpen(rect, section, targetBox);
                  setOpenStack(stack => [...stack.filter(s => s !== section), section]);
                }
              }
            }}
            style={{
              fontFamily: winFont,
              fontSize: 'clamp(1.3rem, 4.5vw, 1.6rem)',
              color: isActive ? 'var(--selection-fg, #000)' : undefined,
              backgroundColor: isActive ? 'var(--selection-bg, #fff)' : undefined,
              cursor: 'pointer',
              padding: 'clamp(2px, 1vw, 6px) clamp(4px, 2vw, 8px)',
              border: 'none',
              animation: isBlinking ? 'blink 0.1s step-end infinite' : 'none',
            }}
            aria-label={t[tKey]}
          >
            <span className={isActive ? 'blink' : ''}>&gt;</span>{' '}{(scrambled[tKey] || t[tKey]).replace('> ', '')}
            {/* EQ wave indicator — deferred until SC Widget API integration detects actual playback */}
          </button>
          );
        })}
      </nav>

      {/* Shoutbox — draggable floating window (no modal backdrop, no blur) */}
      {showWelcomePopup && (
        <div
          onMouseDown={() => setActiveWindow('welcome')}
          onTouchStart={() => setActiveWindow('welcome')}
          style={{
            position: 'fixed',
            top: effectivePos('welcome').y || (isMobile ? '50%' : '14%'),
            left: effectivePos('welcome').x || '50%',
            transform: (effectivePos('welcome').x || effectivePos('welcome').y) ? undefined : 'translate(-50%, 0)',
            zIndex: activeWindow === 'welcome' ? 170 : 100,
          }}
        >
          <Shoutbox
            language={language}
            onClose={() => { setShowWelcomePopup(false); setActiveWindow(null); }}
            onTitlebarDragStart={(e) => { e.preventDefault(); draggable.handleDragStart(e, 'welcome'); }}
            isDragging={draggable.isDragging === 'welcome'}
          />
        </div>
      )}

      {/* Subscribed confirmation popup — neo-terminal flat */}
      {showSubscribedPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: isMobile ? 'env(safe-area-inset-top, 20px)' : 0,
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 20px)' : 0,
            zIndex: activeWindow === 'welcome' ? 170 : 100,
            pointerEvents: 'none',
          }}
        >
          <div
            className="popup-window"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setActiveWindow('welcome')}
            onTouchStart={() => setActiveWindow('welcome')}
            style={{
              backgroundColor: 'var(--popup-bg)',
              border: '1px solid var(--panel-border)',
              fontFamily: winFont,
              fontSize: 'clamp(1.05rem, 2.8vw, 1.3rem)',
              color: 'var(--popup-fg)',
              width: '340px',
              maxWidth: '88vw',
              maxHeight: isMobile ? 'calc(100svh - 40px)' : undefined,
              position: effectivePos('welcome').x || effectivePos('welcome').y ? 'fixed' : 'relative',
              top: effectivePos('welcome').y || undefined,
              left: effectivePos('welcome').x || undefined,
              pointerEvents: 'auto',
              overflow: isMobile ? 'hidden auto' : 'hidden',
            }}
          >
            <div
              onMouseDown={(e) => { e.preventDefault(); draggable.handleDragStart(e, 'welcome'); }}
              onTouchStart={(e) => { e.preventDefault(); draggable.handleDragStart(e, 'welcome'); }}
              style={{
                background: 'var(--titlebar-bg)',
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: draggable.isDragging === 'welcome' ? 'grabbing' : 'grab',
                touchAction: 'none',
                borderBottom: '1px solid var(--panel-border)',
              }}
            >
              <span style={{
                color: 'var(--titlebar-fg)',
                fontFamily: winFont,
                fontSize: '16px',
                letterSpacing: '0.02em',
              }}>
                superself.exe
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSubscribedPopup(false); /* noop: badge is persistent */ }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                aria-label={t.close}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--titlebar-fg)',
                  fontFamily: winFont,
                  fontSize: '15px',
                  cursor: 'pointer',
                  padding: '2px 10px',
                  lineHeight: 1.3,
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap',
                }}
              >
                [ {t.close.toLowerCase()} ]
              </button>
            </div>
            <div style={{ padding: '22px 22px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <span aria-hidden style={{
                  fontSize: 'clamp(1.6rem, 4vw, 2rem)',
                  color: 'var(--popup-fg)',
                  lineHeight: 1,
                  flexShrink: 0,
                }}>
                  [✓]
                </span>
                <span style={{ color: 'var(--popup-fg)', flex: 1 }}>
                  {t.subscribedMessage}
                </span>
              </div>
              <div aria-hidden style={{ height: '1px', background: 'var(--panel-divider)', margin: '0 0 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowSubscribedPopup(false); /* noop: badge is persistent */ }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setShowSubscribedPopup(false); /* noop: badge is persistent */ }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--popup-fg)',
                    fontFamily: winFont,
                    fontSize: 'inherit',
                    padding: '6px 18px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--popup-fg)'; e.currentTarget.style.color = 'var(--popup-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--popup-fg)'; }}
                >
                  [ {t.ok.toLowerCase()} ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* About Panel */}
      {isOpen('about') && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: isMobile ? 'env(safe-area-inset-top, 20px)' : 'clamp(180px, 28vh, 260px)',
            paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 20px)' : 0,
            zIndex: isFocused('about') ? 160 : 90,
            pointerEvents: 'none',
          }}
        >
          <div
            className="popup-window"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setOpenStack(stack => stack[stack.length - 1] === 'about' ? stack : [...stack.filter(s => s !== 'about'), 'about'])}
            onTouchStart={() => setOpenStack(stack => stack[stack.length - 1] === 'about' ? stack : [...stack.filter(s => s !== 'about'), 'about'])}
            style={{
              ...popupTransition.getPopupStyle('about'),
              backgroundColor: 'var(--popup-bg)',
              border: '1px solid var(--panel-border)',
              fontFamily: winFont,
              fontSize: 'clamp(1.05rem, 2.8vw, 1.3rem)',
              color: 'var(--popup-fg)',
              width: '480px',
              maxWidth: '84vw',
              maxHeight: isMobile ? 'calc(100svh - 40px)' : undefined,
              lineHeight: '1.65',
              textAlign: 'left',
              position: effectivePos('about').x || effectivePos('about').y ? 'fixed' : 'relative',
              top: effectivePos('about').y || undefined,
              left: effectivePos('about').x || undefined,
              pointerEvents: 'auto',
              overflow: isMobile ? 'hidden auto' : 'hidden',
            }}
          >
            {/* Flat titlebar */}
            <div
              onMouseDown={(e) => { e.preventDefault(); draggable.handleDragStart(e, 'about'); }}
              onTouchStart={(e) => { e.preventDefault(); draggable.handleDragStart(e, 'about'); }}
              style={{
                background: 'var(--titlebar-bg)',
                padding: '6px 10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: draggable.isDragging === 'about' ? 'grabbing' : 'grab',
                touchAction: 'none',
                borderBottom: '1px solid var(--panel-border)',
              }}
            >
              <span style={{
                color: 'var(--titlebar-fg)',
                fontFamily: winFont,
                fontSize: '16px',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {(scrambled.about ? scrambled.about.replace('> ', '') : t.about.replace('> ', '')) + '.txt'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); popupTransition.triggerClose('about', getCurrentBox('about')); setTimeout(() => { setOpenStack(stack => stack.filter(s => s !== 'about')); }, 300); }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                aria-label={t.close}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--titlebar-fg)',
                  fontFamily: winFont,
                  fontSize: '15px',
                  cursor: 'pointer',
                  padding: '2px 10px',
                  lineHeight: 1.3,
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap',
                }}
              >
                [ {t.close.toLowerCase()} ]
              </button>
            </div>
            <div style={{ padding: '20px 22px', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
              {/* ## about */}
              <div style={{ color: 'var(--panel-prompt)', marginBottom: '6px', letterSpacing: '0.04em' }}>## {t.aboutHeader}</div>
              <p style={{ margin: 0, marginBottom: '14px', wordBreak: 'break-word', color: 'var(--popup-fg)' }}>
                <span style={{ color: 'var(--panel-prompt)', marginRight: '8px' }}>▸</span>
                <span style={{ color: 'var(--popup-fg)', fontWeight: 'bold' }}>superself</span>{' '}
                {scrambled.aboutBio || t.aboutBio}
              </p>
              {/* ASCII divider */}
              <div aria-hidden style={{
                height: '1px',
                background: 'var(--panel-divider)',
                margin: '16px 0',
              }} />
              {/* ## subscribe */}
              <div style={{ color: 'var(--panel-prompt)', marginBottom: '8px', letterSpacing: '0.04em' }}>## {t.subscribe.toLowerCase()}</div>
              <form onSubmit={handleSubscribe} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                <span style={{ color: 'var(--panel-prompt)', flexShrink: 0 }}>▸</span>
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLInputElement).getBoundingClientRect();
                    lastClickPos.current = { x: rect.left + rect.width / 2, y: rect.top };
                  }}
                  placeholder={t.emailPlaceholder}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'transparent',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--popup-fg)',
                    fontFamily: winFont,
                    fontSize: 'inherit',
                    padding: '6px 10px',
                    outline: 'none',
                  }}
                  className="win95-input"
                />
                <button
                  type="submit"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--panel-border)',
                    color: 'var(--popup-fg)',
                    fontFamily: winFont,
                    fontSize: 'inherit',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--popup-fg)'; e.currentTarget.style.color = 'var(--popup-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--popup-fg)'; }}
                >
                  [ {t.confirm.toLowerCase()} ]
                </button>
              </form>
              <p style={{ margin: '12px 0 0', fontSize: '0.9em', color: 'var(--panel-muted)' }}>
                {scrambled.aboutCta || t.aboutCta}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shop Panel */}
      {isOpen('shop') && (
        <Shop
          language={language}
          onClose={() => { popupTransition.triggerClose('shop', getCurrentBox('shop')); setTimeout(() => { setOpenStack(stack => stack.filter(s => s !== 'shop')); }, 300); }}
          position={effectivePos('shop')}
          isActive={isFocused('shop')}
          onActivate={() => setOpenStack(stack => stack[stack.length - 1] === 'shop' ? stack : [...stack.filter(s => s !== 'shop'), 'shop'])}
          onDragStart={(e) => draggable.handleDragStart(e, 'shop')}
          isDragging={draggable.isDragging === 'shop'}
          transitionStyle={popupTransition.getPopupStyle('shop')}
        />
      )}

      {/* Mixes Panel — always mounted so SoundCloud iframe stays alive when panel closed */}
      {showMainContent && (
        <div style={{
          opacity: isOpen('mixes') ? 1 : 0,
          pointerEvents: isOpen('mixes') ? 'auto' : 'none',
          position: isOpen('mixes') ? undefined : 'fixed',
          top: isOpen('mixes') ? undefined : '-200vh',
        }}>
          <Mixes
            language={language}
            onClose={() => { popupTransition.triggerClose('mixes', getCurrentBox('mixes')); setTimeout(() => { setOpenStack(stack => stack.filter(s => s !== 'mixes')); }, 300); }}
            position={effectivePos('mixes')}
            isActive={isFocused('mixes')}
            onActivate={() => setOpenStack(stack => stack[stack.length - 1] === 'mixes' ? stack : [...stack.filter(s => s !== 'mixes'), 'mixes'])}
            onDragStart={(e) => draggable.handleDragStart(e, 'mixes')}
            isDragging={draggable.isDragging === 'mixes'}
            transitionStyle={popupTransition.getPopupStyle('mixes')}
          />
        </div>
      )}

      {/* Email copied toast */}
      {showEmailCopied && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: emailToastPos.y - 50,
            left: emailToastPos.x - 60,
            transform: 'none',
            fontFamily: winFont,
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: 'var(--accent, #0000FF)',
            backgroundColor: '#fff',
            padding: '6px 14px',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {t.emailCopied}
        </div>
      )}

      {/* Invalid email toast */}
      {showEmailError && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            top: emailErrorPos.y || '50%',
            left: emailErrorPos.x || '50%',
            transform: 'translate(-50%, -100%)',
            fontFamily: winFont,
            fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
            color: 'var(--accent, #0000FF)',
            backgroundColor: '#fff',
            padding: '8px 16px',
            zIndex: 200,
            pointerEvents: 'none',
          }}
        >
          {t.invalidEmail}
        </div>
      )}

      {/* Persistent chat badge — keeps the blinking "▶ [N mensaje nuevo]" vibe,
          count wired to the live shoutbox. */}
      {showMainContent && (
        <div
          style={{
            position: 'absolute',
            bottom: contentInsetBottom,
            left: contentInset,
            opacity: entrance.showFooter ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out',
            transitionDelay: entrance.showFooter ? '3.5s' : '0s',
            zIndex: 10,
          }}
        >
          <ShoutboxBadge
            language={language}
            onClick={() => { setShowWelcomePopup(true); setActiveWindow('welcome'); }}
          />
        </div>
      )}

      {/* Language switcher */}
      <div
        className="lang-container"
        role="radiogroup"
        aria-label="Language"
        style={{
          position: 'absolute',
          bottom: frameInsetBottom,
          left: `calc(${frameInset} / 2)`,
          transform: 'translateX(-50%)',
          display: phase === 'main' ? 'flex' : 'none',
          flexDirection: 'column-reverse',
          gap: 'clamp(12px, 3vw, 20px)',
          fontFamily: winFont,
          fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
          opacity: (phase === 'main' && entrance.showFooter) ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
          transitionDelay: phase === 'main' && entrance.showFooter ? '4.0s' : '0s',
          zIndex: 50,
          pointerEvents: 'auto',
        }}
      >
        {(['ES', 'EN', 'JP'] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            role="radio"
            aria-checked={language === lang}
            aria-label={lang}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              writingMode: 'vertical-lr',
              transform: 'rotate(180deg)',
              color: language === lang ? 'var(--text-primary, rgba(255,255,255,0.95))' : 'var(--text-muted, rgba(255,255,255,0.4))',
              letterSpacing: '0.04em',
              transition: 'color 0.25s ease',
              background: 'none',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              padding: 0,
            }}
          >
            <span>{language === lang ? '■' : '□'}</span>
            <span>{lang}</span>
          </button>
        ))}
        {/* Theme toggle — above language buttons (column-reverse: last = top) */}
        {phase === 'main' && (
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Switch theme"
            style={{
              cursor: 'pointer',
              color: 'var(--text-muted, rgba(255,255,255,0.4))',
              background: 'none',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.25s ease, background-color 0.2s ease',
              writingMode: 'horizontal-tb',
            }}
          >
            <span style={{
              display: 'inline-block',
            }}>
              {themeMode === 'dark' ? '\u263D' : themeMode === 'color' ? '\u25D0' : '\u2600'}
            </span>
          </button>
        )}
      </div>

      {/* Theme toggle is now inside language container below */}

      {/* Copyright */}
      <div
        style={{
          position: 'absolute',
          bottom: `calc(${frameInsetBottom} / 2)`,
          left: '50%',
          transform: 'translateX(-50%) translateY(50%)',
          display: showMainContent ? 'block' : 'none',
          opacity: entrance.showFooter ? 1 : 0,
          transition: 'opacity 0.8s ease-in-out',
          transitionDelay: entrance.showFooter ? '4.5s' : '0s',
        }}
      >
        <span
          onClick={() => {
            const w = window as unknown as Record<string, unknown>;
            const count = (w.__biosClicks as number) || 0;
            w.__biosClicks = count + 1;
            if (count + 1 >= 5) {
              w.__biosClicks = 0;
              setPhase('error');
            }
          }}
          style={{ fontFamily: winFont, fontSize: 'clamp(0.6rem, 1.2vw, 0.75rem)', color: 'var(--text-muted, rgba(255,255,255,0.35))', whiteSpace: 'nowrap', cursor: 'default' }}
        >
          {'{ superself '}<Spinner />{' 2026 }'}
        </span>
      </div>

      {/* Skip button removed — ENTER is the skip */}



      {/* Landscape warning */}
      {showLandscapeWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--background)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--win95-bg, #c0c0c0)',
              border: '2px solid',
              borderColor: 'var(--win95-highlight, #dfdfdf) var(--win95-shadow, #0a0a0a) var(--win95-shadow, #0a0a0a) var(--win95-highlight, #dfdfdf)',
              boxShadow: '2px 2px 0 #000',
              maxWidth: '90vw',
            }}
          >
            <div
              style={{
                background: 'var(--win95-title, linear-gradient(90deg, #000080, #1084d0))',
                padding: '3px 4px 3px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'white', fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: '11px', fontWeight: 700 }}>
                {t.warningTitle}
              </span>
              <button
                disabled
                style={{
                  width: '16px',
                  height: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'not-allowed',
                  padding: 0,
                  backgroundColor: 'var(--win95-bg, #c0c0c0)',
                  border: 'none',
                  boxShadow: 'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf)',
                }}
              >
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                  <path d="M0 0H2V1H3V2H5V1H6V0H8V1H7V2H6V3H5V4H6V5H7V6H8V7H6V6H5V5H3V6H2V7H0V6H1V5H2V4H3V3H2V2H1V1H0V0Z" fill="var(--win95-dark, #808080)" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <svg width="32" height="29" viewBox="0 0 32 29" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M18 4H20V5H21V6H22V8H23V10H24V12H25V14H26V16H27V18H28V20H29V22H30V26H29V27H6V26H7V25H27V24H26V22H25V20H24V18H23V16H22V14H21V12H20V10H19V8H18V4Z" fill="var(--win95-dark, #808080)" />
                <path d="M14 2H18V4H19V6H20V8H21V10H22V12H23V14H24V16H25V18H26V20H27V24H4V20H5V18H6V16H7V14H8V12H9V10H10V8H11V6H12V4H13V2H14Z" fill="#000" />
                <path d="M15 4H17V6H18V8H19V10H20V12H21V14H22V16H23V18H24V20H25V22H6V20H7V18H8V16H9V14H10V12H11V10H12V8H13V6H14V4H15Z" fill="#FFFF00" />
                <rect x="15" y="8" width="2" height="8" fill="#000" />
                <rect x="15" y="18" width="2" height="2" fill="#000" />
              </svg>
              <span style={{ fontFamily: '"MS Sans Serif", Arial, sans-serif', fontSize: '11px', color: 'var(--win95-text, #000)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {t.warningMessage}
              </span>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
