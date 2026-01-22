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
  burgerShow: 5000,
  welcomePopup: { min: 18000, max: 22000 },

  // Main entrance (skip mode)
  skipFrameShow: 300,
  skipTitleStart: 800,
  skipFooterShow: 1500,
  skipBurgerShow: 2000,
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
  burgerFade: 600,

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
    backgroundColor: '#c0c0c0',
    border: 'none',
    boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
  },
  buttonPressed: {
    backgroundColor: '#c0c0c0',
    border: 'none',
    boxShadow: 'inset 1px 1px 0 #0a0a0a, inset -1px -1px 0 #ffffff, inset 2px 2px 0 #808080, inset -2px -2px 0 #dfdfdf, inset 3px 3px 0 #404040',
  },
  windowBorder: {
    border: '2px solid',
    borderColor: '#ffffff #0a0a0a #0a0a0a #ffffff',
    boxShadow: '1px 1px 0 #000',
  },
  closeButton: {
    width: '22px',
    height: '20px',
    backgroundColor: '#c0c0c0',
    border: 'none',
    boxShadow: 'inset -1px -1px 0 #0a0a0a, inset 1px 1px 0 #ffffff, inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf',
  },
  titlebarGradient: 'linear-gradient(90deg, #000080, #1084d0)',
} as const;

// Font stack for terminal/DOS style
export const WIN_FONT = 'var(--font-terminal), VT323, Fixedsys, Terminal, Consolas, monospace';

// Frame insets with safe-area support
export const FRAME_INSETS = {
  frame: 'max(clamp(30px, 5vw, 60px), env(safe-area-inset-top, 0px))',
  frameBottom: 'max(clamp(30px, 5vw, 60px), env(safe-area-inset-bottom, 0px))',
  content: 'max(clamp(45px, 7vw, 80px), env(safe-area-inset-top, 0px))',
  contentBottom: 'max(clamp(45px, 7vw, 80px), env(safe-area-inset-bottom, 0px))',
} as const;

// Spinner animation frames
export const SPINNER_CHARS = ['|', '/', '-', '\\'] as const;
