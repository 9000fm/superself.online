// Brand colors
export const COLORS = {
  primary: '#0000FF',       // Electric blue
  secondary: '#FFFFFF',     // White
  win95Gray: '#c0c0c0',     // Windows 95 gray
  win95DarkGray: '#808080', // Windows 95 dark gray
  win95Navy: '#000080',     // Windows 95 title bar blue
  black: '#000000',
  transparent: 'transparent',
} as const;

// Animation timing values (in milliseconds)
export const TIMING = {
  // Boot sequence
  logoDelay: 600,
  loaderDelay: 1400,
  pauseAfterLoading: 800,

  // Confirm screen
  cursorShowDelay: 300,
  typingStartDelay: 1000,
  typingSpeed: 70,         // Welcome text
  confirmTypingSpeed: 50,  // Question text
  optionTypingSpeed: 80,   // YES/NO options
  dotAnimationSpeed: 300,
  pauseAfterDots: 600,
  pauseBetweenOptions: 200,
  selectorShowDelay: 400,

  // Loading dots (YES transition)
  loadingDotTimings: [300, 600, 900, 1300],
  transitionToMain: 1600,

  // Shutdown sequence
  shutdownDotSpeed: 400,
  shutdownCycleReset: 600,
  shutdownToOff: 4600,
  offToReboot: 6200,

  // Main entrance (normal mode)
  frameShow: 800,
  titleStart: 1500,
  footerShow: 3500,
  welcomePopup: { min: 18000, max: 22000 },

  // Main entrance (skip mode)
  skipFrameShow: 300,
  skipTitleStart: 800,
  skipFooterShow: 1500,
  skipWelcomePopup: 12000,

  // Scramble effects
  scrambleInterval: 40,
  scrambleMaxFrames: 18,
  confirmScrambleInterval: 50,
  confirmScrambleMaxFrames: 15,

  // Title scramble
  normalScrambleSpeed: 55,
  skipScrambleSpeed: 30,
  normalLockMultiplier: 14,
  skipLockMultiplier: 8,

  // Fade transitions
  frameFade: 600,
  footerFade: 1500,
  // Toast duration
  toastDuration: 2000,

  // About panel typing
  aboutTypingDelay: 300,
  aboutTypingSpeed: 50,

  // Shop dots animation
  shopDotsSpeed: 400,
} as const;

// Contact information
export const CONTACT = {
  email: 'flavio@superself.online',
  whatsapp: '+51990028077',
  whatsappFormatted: '+51 990 028 077',
  instagram: 'https://www.instagram.com/superself__/',
  soundcloud: 'https://soundcloud.com/superself-music',
} as const;

// Scramble effect characters
export const SCRAMBLE_CHARS = {
  base: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
  japanese: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
} as const;

// Windows 95 style constants
export const WIN95_STYLES = {
  button: {
    backgroundColor: 'var(--win95-bg, #c0c0c0)',
    border: 'none',
    boxShadow: 'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf), inset -2px -2px 0 var(--win95-dark, #808080), inset 2px 2px 0 var(--win95-highlight, #dfdfdf)',
  },
  buttonPressed: {
    backgroundColor: 'var(--win95-bg, #c0c0c0)',
    border: 'none',
    boxShadow: 'inset 1px 1px 0 var(--win95-shadow, #0a0a0a), inset -1px -1px 0 var(--win95-highlight, #dfdfdf), inset 2px 2px 0 var(--win95-dark, #808080), inset -2px -2px 0 var(--win95-highlight, #dfdfdf), inset 3px 3px 0 var(--win95-dark, #808080)',
  },
  windowBorder: {
    border: '2px solid',
    borderColor: 'var(--win95-highlight, #dfdfdf) var(--win95-shadow, #0a0a0a) var(--win95-shadow, #0a0a0a) var(--win95-highlight, #dfdfdf)',
    boxShadow: '1px 1px 0 #000',
  },
  closeButton: {
    width: '22px',
    height: '20px',
    backgroundColor: 'var(--win95-bg, #c0c0c0)',
    border: 'none',
    boxShadow: 'inset -1px -1px 0 var(--win95-shadow, #0a0a0a), inset 1px 1px 0 var(--win95-highlight, #dfdfdf), inset -2px -2px 0 var(--win95-dark, #808080), inset 2px 2px 0 var(--win95-highlight, #dfdfdf)',
  },
  titlebarGradient: 'var(--win95-title, linear-gradient(90deg, #000080, #1084d0))',
} as const;

// Font stack for terminal/DOS style
export const WIN_FONT = 'var(--font-terminal), VT323, Fixedsys, Terminal, Consolas, monospace';

// Frame insets with safe-area support
export const FRAME_INSETS = {
  frame: 'max(clamp(24px, 3.5vw, 42px), env(safe-area-inset-top, 0px))',
  frameBottom: 'max(clamp(24px, 3.5vw, 42px), env(safe-area-inset-bottom, 0px))',
  content: 'max(clamp(32px, 4.5vw, 54px), env(safe-area-inset-top, 0px))',
  contentBottom: 'max(clamp(32px, 4.5vw, 54px), env(safe-area-inset-bottom, 0px))',
} as const;

// Multilingual "ENTER" translations for the enter screen
export const ENTER_TRANSLATIONS = [
  // Fixed order (first 8 — always shown in this sequence)
  'ENTER',        // EN
  'ENTRAR',       // ES
  'ENTRER',       // FR
  '入る',          // JP
  'ENTRAR',       // PT
  'ВОЙТИ',        // RU
  '进入',          // ZH
  '들어가기',       // KO
  // Random pool (shuffled after the fixed 8)
  'INGRESSO',     // IT
  'الدخول',        // AR
  'EINTRETEN',    // DE
  'INTRARE',      // RO
] as const;

// How many translations are in fixed order (the rest get shuffled)
export const ENTER_FIXED_COUNT = 8;

// Enter screen timing
export const ENTER_TIMING = {
  holdDuration: 4000,      // ms to hold resolved word (~4 seconds)
  initialDelay: 600,       // ms before first word appears
} as const;

// Color theme palettes — curated aesthetic combos
// Each palette defines bg + foreground + frame/lines + accents
export const COLOR_PALETTES = [
  { id: 'blue',     bg: '#0000FF', fg: '#ffffff', bar: '#0000FF', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#0000FF', hoverBg: '#ffffff', hoverFg: '#0000FF' },
  { id: 'purple',   bg: '#4B0082', fg: '#ffffff', bar: '#4B0082', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#4B0082', hoverBg: '#ffffff', hoverFg: '#4B0082' },
  { id: 'red',      bg: '#8B0000', fg: '#ffffff', bar: '#8B0000', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#8B0000', hoverBg: '#ffffff', hoverFg: '#8B0000' },
  { id: 'green',    bg: '#004D00', fg: '#ffffff', bar: '#004D00', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#004D00', hoverBg: '#ffffff', hoverFg: '#004D00' },
  { id: 'yellow',   bg: '#C8A800', fg: '#000000', bar: '#000000', frame: 'rgba(0,0,0,0.5)',       muted: 'rgba(0,0,0,0.55)',      primary: 'rgba(0,0,0,0.85)',        selBg: '#000000', selFg: '#C8A800', hoverBg: '#000000', hoverFg: '#C8A800' },
  { id: 'orange',   bg: '#CC4400', fg: '#ffffff', bar: '#CC4400', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#CC4400', hoverBg: '#ffffff', hoverFg: '#CC4400' },
  { id: 'teal',     bg: '#005F5F', fg: '#ffffff', bar: '#005F5F', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#005F5F', hoverBg: '#ffffff', hoverFg: '#005F5F' },
  { id: 'pink',     bg: '#8B005A', fg: '#ffffff', bar: '#8B005A', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#8B005A', hoverBg: '#ffffff', hoverFg: '#8B005A' },
  { id: 'acid',     bg: '#00CC00', fg: '#000000', bar: '#000000', frame: 'rgba(0,0,0,0.5)',       muted: 'rgba(0,0,0,0.55)',      primary: 'rgba(0,0,0,0.85)',        selBg: '#000000', selFg: '#00CC00', hoverBg: '#000000', hoverFg: '#00CC00' },
  { id: 'coral',    bg: '#FF4444', fg: '#ffffff', bar: '#FF4444', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#FF4444', hoverBg: '#ffffff', hoverFg: '#FF4444' },
  { id: 'midnight', bg: '#0D0D2B', fg: '#ffffff', bar: '#0D0D2B', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#0D0D2B', hoverBg: '#ffffff', hoverFg: '#6666FF' },
  { id: 'rust',     bg: '#8B4513', fg: '#ffffff', bar: '#8B4513', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#8B4513', hoverBg: '#ffffff', hoverFg: '#8B4513' },
  { id: 'lavender', bg: '#6644AA', fg: '#ffffff', bar: '#6644AA', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#6644AA', hoverBg: '#ffffff', hoverFg: '#6644AA' },
  { id: 'olive',    bg: '#556B2F', fg: '#ffffff', bar: '#556B2F', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#556B2F', hoverBg: '#ffffff', hoverFg: '#556B2F' },
  { id: 'cyan',     bg: '#008B8B', fg: '#ffffff', bar: '#008B8B', frame: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.4)', primary: 'rgba(255,255,255,0.95)', selBg: '#ffffff', selFg: '#008B8B', hoverBg: '#ffffff', hoverFg: '#008B8B' },
  { id: 'charcoal', bg: '#2D2D2D', fg: '#4488FF', bar: '#4488FF', frame: 'rgba(68,136,255,0.5)', muted: 'rgba(68,136,255,0.55)', primary: 'rgba(68,136,255,0.9)', selBg: '#4488FF', selFg: '#2D2D2D', hoverBg: '#4488FF', hoverFg: '#2D2D2D' },
  { id: 'gold',     bg: '#AA8800', fg: '#000000', bar: '#000000', frame: 'rgba(0,0,0,0.5)',       muted: 'rgba(0,0,0,0.55)',      primary: 'rgba(0,0,0,0.85)',        selBg: '#000000', selFg: '#AA8800', hoverBg: '#000000', hoverFg: '#AA8800' },
  { id: 'blood',    bg: '#440000', fg: '#FF4444', bar: '#FF4444', frame: 'rgba(255,68,68,0.5)',   muted: 'rgba(255,68,68,0.55)',  primary: 'rgba(255,68,68,0.9)',     selBg: '#FF4444', selFg: '#440000', hoverBg: '#FF4444', hoverFg: '#440000' },
] as const;

// Spinner animation frames
export const SPINNER_CHARS = ['|', '/', '-', '\\'] as const;
