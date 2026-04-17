import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioReturn {
  isMuted: boolean;
  isPlaying: boolean;
  init: () => void;
  playWoosh: () => void;
  startMusic: () => void;
  toggleMute: () => void;
  stopAll: () => void;
}

// Try loading WebM first (smaller, better quality), fall back to MP3
async function loadAudioBuffer(ctx: AudioContext, basePath: string): Promise<AudioBuffer> {
  for (const ext of ['.webm', '.mp3']) {
    try {
      const res = await fetch(basePath + ext);
      if (!res.ok) continue;
      const arrayBuffer = await res.arrayBuffer();
      return await ctx.decodeAudioData(arrayBuffer);
    } catch {
      continue;
    }
  }
  throw new Error(`Failed to load audio: ${basePath}`);
}

export function useAudio(): UseAudioReturn {
  // Always start unmuted to avoid hydration mismatch, restore from localStorage in effect
  const [isMuted, setIsMuted] = useState(false);
  const restoredRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const wooshBufferRef = useRef<AudioBuffer | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  const initedRef = useRef(false);

  // Restore muted state from localStorage after hydration
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = localStorage.getItem('superself-muted') === 'true';
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of persisted mute state; guarded by restoredRef, mirrors external (localStorage) into React.
    if (saved) setIsMuted(true);
  }, []);

  const init = useCallback(() => {
    if (initedRef.current) return;
    if (typeof window === 'undefined') return;

    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    ctxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = isMuted ? 0 : 1;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Pre-load audio files in background
    loadAudioBuffer(ctx, '/audio/woosh').then(buf => { wooshBufferRef.current = buf; }).catch(() => {});
    loadAudioBuffer(ctx, '/audio/loop').then(buf => { musicBufferRef.current = buf; }).catch(() => {});

    initedRef.current = true;
  }, [isMuted]);

  const playWoosh = useCallback(() => {
    const ctx = ctxRef.current;
    const gain = masterGainRef.current;
    if (!ctx || !gain) return;

    // If buffer isn't loaded yet, try loading inline
    if (!wooshBufferRef.current) {
      loadAudioBuffer(ctx, '/audio/woosh').then(buf => {
        wooshBufferRef.current = buf;
        const source = ctx.createBufferSource();
        source.buffer = buf;
        source.connect(gain);
        source.start();
      }).catch(() => {});
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = wooshBufferRef.current;
    source.connect(gain);
    source.start();
  }, []);

  const startMusic = useCallback(() => {
    const ctx = ctxRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain) return;

    const playBuffer = (buf: AudioBuffer) => {
      // Create a gain node for fade-in
      const musicGain = ctx.createGain();
      musicGain.gain.setValueAtTime(0, ctx.currentTime);
      musicGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2); // fade in over 2s
      musicGain.connect(masterGain);
      musicGainRef.current = musicGain;

      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.connect(musicGain);
      source.start();
      musicSourceRef.current = source;
      setIsPlaying(true);
    };

    if (musicBufferRef.current) {
      playBuffer(musicBufferRef.current);
    } else {
      // Not loaded yet, load and play
      loadAudioBuffer(ctx, '/audio/loop').then(buf => {
        musicBufferRef.current = buf;
        playBuffer(buf);
      }).catch(() => {});
    }
  }, []);

  const toggleMute = useCallback(() => {
    const gain = masterGainRef.current;
    setIsMuted(prev => {
      const next = !prev;
      if (gain) {
        gain.gain.setValueAtTime(next ? 0 : 1, ctxRef.current?.currentTime ?? 0);
      }
      localStorage.setItem('superself-muted', String(next));
      return next;
    });
  }, []);

  const stopAll = useCallback(() => {
    try { musicSourceRef.current?.stop(); } catch {}
    musicSourceRef.current = null;
    setIsPlaying(false);
  }, []);

  return { isMuted, isPlaying, init, playWoosh, startMusic, toggleMute, stopAll };
}
