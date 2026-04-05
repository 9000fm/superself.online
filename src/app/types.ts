// Application phase states
export type Phase = 'boot' | 'loading' | 'pause' | 'confirm' | 'shutdown' | 'off' | 'error' | 'main';

// Supported languages
export type Language = 'ES' | 'EN' | 'JP';

// Active section in main view
export type ActiveSection = 'about' | 'shop' | 'mixes' | null;

// Active window for z-index management
export type ActiveWindow = 'welcome' | 'about' | 'shop' | 'mixes' | null;

// Position type for draggable elements
export type Position = { x: number; y: number };

// Welcome popup step
export type WelcomeStep = 'message' | 'subscribe';

// Confirm screen selection
export type ConfirmOption = 'yes' | 'no';
