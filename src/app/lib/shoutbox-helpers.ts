import type { Language } from '../types';

export function countryToFlag(code: string | null): string {
  if (!code || !/^[A-Z]{2}$/.test(code)) return '';
  const A = 'A'.charCodeAt(0);
  const base = 0x1f1e6;
  const cp1 = base + (code.charCodeAt(0) - A);
  const cp2 = base + (code.charCodeAt(1) - A);
  return String.fromCodePoint(cp1, cp2);
}

export function formatStamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatSeq(id: number): string {
  return `#${id.toString().padStart(4, '0')}`;
}

// Deterministic HSL from nickname — same nick always same color, hue spread wide.
// Lightness ~55% + high saturation = readable on both light and dark popup backgrounds.
export function nickToColor(nick: string): string {
  let h = 5381;
  for (let i = 0; i < nick.length; i++) {
    h = ((h << 5) + h + nick.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(h) % 360;
  const sat = 68 + (Math.abs(h >> 8) % 22);
  const light = 52 + (Math.abs(h >> 16) % 10);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function formatRelative(iso: string, lang: Language): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return lang === 'JP' ? `${s}秒前` : lang === 'ES' ? `hace ${s}s` : `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return lang === 'JP' ? `${m}分前` : lang === 'ES' ? `hace ${m}m` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === 'JP' ? `${h}時間前` : lang === 'ES' ? `hace ${h}h` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === 'JP' ? `${d}日前` : lang === 'ES' ? `hace ${d}d` : `${d}d ago`;
}

export const MAX_BODY = 140;
export const COOLDOWN_MS = 30_000;
export const NICK_STORAGE_KEY = 'superself.shoutbox.nick';

// Seeded regulars — always appear in the user list so the room feels lived-in.
// Named to fit the label DNA (Lima, electronic, night, signal). Shown offline
// until someone with that exact nick actually connects.
export const REGULARS: readonly string[] = [
  'dj_lima',
  'sesiones_night',
  'radio_static',
  'anon_7',
  'mod_bot',
];
