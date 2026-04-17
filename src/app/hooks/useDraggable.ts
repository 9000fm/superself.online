import { useState, useCallback, useEffect, useRef } from 'react';
import { Position } from '../types';

interface UseDraggableReturn {
  welcomePos: Position;
  aboutPos: Position;
  shopPos: Position;
  mixesPos: Position;
  isDragging: string | null;
  setWelcomePos: (pos: Position) => void;
  setAboutPos: (pos: Position) => void;
  setShopPos: (pos: Position) => void;
  setMixesPos: (pos: Position) => void;
  /** Set position without marking as customized (used for home positions). */
  setPosition: (popupId: string, pos: Position) => void;
  /** Set position AND mark as customized (persists to localStorage). */
  setPositionCustom: (popupId: string, pos: Position) => void;
  getPosition: (popupId: string) => Position;
  /** Has the user explicitly customized this window's position (via drag or saved storage)? */
  isCustomized: (popupId: string) => boolean;
  handleDragStart: (e: React.MouseEvent | React.TouchEvent, popupId: string) => void;
  resetPosition: (popupId: string) => void;
}

const STORAGE_PREFIX = 'superself-pos-';

// How much of a window's titlebar must remain visible so the user can always
// grab and drag it back. Prevents the "window dragged fully off-screen, no way
// to retrieve it" problem.
const KEEP_VISIBLE_X = 120; // px of horizontal titlebar visible
const KEEP_VISIBLE_Y = 40;  // px = titlebar height, always inside viewport

/**
 * Clamp a popup position so its titlebar stays accessible within the viewport.
 * Allows partial off-screen (left/right/bottom) but titlebar top never goes
 * above y=0, and at least KEEP_VISIBLE_X pixels of the window remain grabbable.
 */
export function clampToViewport(pos: Position, popupW: number, popupH: number): Position {
  if (typeof window === 'undefined') return pos;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Horizontal: can go off left until only KEEP_VISIBLE_X right-side px remain,
  // or off right until only KEEP_VISIBLE_X left-side px remain.
  const minX = -(popupW - KEEP_VISIBLE_X);
  const maxX = vw - KEEP_VISIBLE_X;
  // Vertical: titlebar must always be fully visible inside viewport.
  const minY = 0;
  const maxY = vh - KEEP_VISIBLE_Y;
  return {
    x: Math.max(minX, Math.min(pos.x, maxX)),
    y: Math.max(minY, Math.min(pos.y, maxY)),
  };
}

function hydrate(key: string): { pos: Position; customized: boolean } {
  if (typeof window === 'undefined') return { pos: { x: 0, y: 0 }, customized: false };
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return { pos: { x: 0, y: 0 }, customized: false };
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
      return { pos: parsed, customized: true };
    }
  } catch {}
  return { pos: { x: 0, y: 0 }, customized: false };
}

export function useDraggable(): UseDraggableReturn {
  const welcomeInit = hydrate('welcome');
  const aboutInit = hydrate('about');
  const shopInit = hydrate('shop');
  const mixesInit = hydrate('mixes');

  const [welcomePos, setWelcomePos] = useState<Position>(welcomeInit.pos);
  const [aboutPos, setAboutPos] = useState<Position>(aboutInit.pos);
  const [shopPos, setShopPos] = useState<Position>(shopInit.pos);
  const [mixesPos, setMixesPos] = useState<Position>(mixesInit.pos);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Tracks which windows have been user-customized (drag OR hydrated from storage).
  // Only customized windows are persisted to localStorage on change.
  const customizedRef = useRef<Set<string>>(new Set<string>(
    [
      welcomeInit.customized && 'welcome',
      aboutInit.customized && 'about',
      shopInit.customized && 'shop',
      mixesInit.customized && 'mixes',
    ].filter(Boolean) as string[]
  ));

  // Keep latest positions in a ref for stable callback reads
  const posRef = useRef({ welcomePos, aboutPos, shopPos, mixesPos });
  useEffect(() => {
    posRef.current = { welcomePos, aboutPos, shopPos, mixesPos };
  }, [welcomePos, aboutPos, shopPos, mixesPos]);

  const persistIfCustomized = (key: string, pos: Position) => {
    if (typeof window === 'undefined') return;
    if (!customizedRef.current.has(key)) return;
    if (pos.x === 0 && pos.y === 0) return;
    try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(pos)); } catch {}
  };

  // Persist on change — only for customized windows
  useEffect(() => { persistIfCustomized('welcome', welcomePos); }, [welcomePos]);
  useEffect(() => { persistIfCustomized('about', aboutPos); }, [aboutPos]);
  useEffect(() => { persistIfCustomized('shop', shopPos); }, [shopPos]);
  useEffect(() => { persistIfCustomized('mixes', mixesPos); }, [mixesPos]);

  const setPosition = useCallback((popupId: string, pos: Position) => {
    if (popupId === 'welcome') setWelcomePos(pos);
    else if (popupId === 'about') setAboutPos(pos);
    else if (popupId === 'shop') setShopPos(pos);
    else if (popupId === 'mixes') setMixesPos(pos);
  }, []);

  const setPositionCustom = useCallback((popupId: string, pos: Position) => {
    customizedRef.current.add(popupId);
    setPosition(popupId, pos);
  }, [setPosition]);

  const getPosition = useCallback((popupId: string): Position => {
    const p = posRef.current;
    if (popupId === 'welcome') return p.welcomePos;
    if (popupId === 'about') return p.aboutPos;
    if (popupId === 'shop') return p.shopPos;
    if (popupId === 'mixes') return p.mixesPos;
    return { x: 0, y: 0 };
  }, []);

  const isCustomized = useCallback((popupId: string): boolean => {
    return customizedRef.current.has(popupId);
  }, []);

  const resetPosition = useCallback((popupId: string) => {
    customizedRef.current.delete(popupId);
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_PREFIX + popupId); } catch {}
    }
    if (popupId === 'welcome') setWelcomePos({ x: 0, y: 0 });
    else if (popupId === 'about') setAboutPos({ x: 0, y: 0 });
    else if (popupId === 'shop') setShopPos({ x: 0, y: 0 });
    else if (popupId === 'mixes') setMixesPos({ x: 0, y: 0 });
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent, popupId: string) => {
      e.preventDefault();

      const popup = (e.target as HTMLElement).closest('.popup-window');
      const rect = popup?.getBoundingClientRect();
      if (rect) {
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // If popup is centered (position is 0,0), convert to absolute position first
        const currentPos =
          popupId === 'welcome' ? welcomePos : popupId === 'shop' ? shopPos : popupId === 'mixes' ? mixesPos : aboutPos;
        if (currentPos.x === 0 && currentPos.y === 0) {
          const initialPos = { x: rect.left, y: rect.top };
          setPositionCustom(popupId, initialPos);
        }

        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;
        // Snapshot popup size at drag start for clamp calcs
        const popupW = rect.width;
        const popupH = rect.height;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
          if ('touches' in moveEvent) {
            moveEvent.preventDefault();
            if (!moveEvent.touches[0]) return;
          }
          const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
          const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

          const rawPos = { x: moveX - offsetX, y: moveY - offsetY };
          // Clamp so titlebar stays reachable
          const clamped = clampToViewport(rawPos, popupW, popupH);
          setPositionCustom(popupId, clamped);
        };

        const handleEnd = () => {
          document.removeEventListener('mousemove', handleMove);
          document.removeEventListener('mouseup', handleEnd);
          document.removeEventListener('touchmove', handleMove);
          document.removeEventListener('touchend', handleEnd);
          document.removeEventListener('touchcancel', handleEnd);
          setIsDragging(null);
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);

        setIsDragging(popupId);
      }
    },
    [welcomePos, aboutPos, shopPos, mixesPos, setPositionCustom]
  );

  return {
    welcomePos,
    aboutPos,
    shopPos,
    mixesPos,
    isDragging,
    setWelcomePos,
    setAboutPos,
    setShopPos,
    setMixesPos,
    setPosition,
    setPositionCustom,
    getPosition,
    isCustomized,
    handleDragStart,
    resetPosition,
  };
}
