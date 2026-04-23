'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseBrowser, type ShoutboxMessage } from '@/lib/supabase';
import type { Language } from '../types';
import { translations } from '../translations';
import { COOLDOWN_MS, REGULARS } from '../lib/shoutbox-helpers';

export type ConnStatus = 'connecting' | 'online' | 'offline';

export type PresenceUser = { key: string; nickname: string | null };

export type MergedUser = { name: string; online: boolean };

export type UseShoutboxResult = {
  messages: ShoutboxMessage[];
  loaded: boolean;
  conn: ConnStatus;
  viewers: number;
  presenceList: PresenceUser[];
  mergedUsers: MergedUser[];
  cooldownRemaining: number;
  sending: boolean;
  error: string | null;
  ownIds: ReadonlySet<number>;
  send: (args: { nickname: string; body: string }) => Promise<'ok' | 'rate_limited' | 'rate_limited_daily' | 'rejected'>;
  clearError: () => void;
};

const PRESENCE_KEY_PREFIX = 'sb_';

export function useShoutbox(language: Language): UseShoutboxResult {
  const t = translations[language].shoutbox;

  const [messages, setMessages] = useState<ShoutboxMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [conn, setConn] = useState<ConnStatus>('connecting');
  const [viewers, setViewers] = useState(1);
  const [presenceList, setPresenceList] = useState<PresenceUser[]>([]);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownIds, setOwnIds] = useState<ReadonlySet<number>>(() => new Set<number>());

  const cooldownEndsRef = useRef<number>(0);
  const presenceKeyRef = useRef<string>(PRESENCE_KEY_PREFIX + Math.random().toString(36).slice(2, 10));

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowser();

    (async () => {
      try {
        const res = await fetch('/api/shoutbox', { cache: 'no-store' });
        if (!res.ok) throw new Error('fetch_failed');
        const data = await res.json() as { messages: ShoutboxMessage[]; total: number };
        if (cancelled) return;
        setMessages(data.messages);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();

    const msgChannel = supabase
      .channel('shoutbox_messages_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shoutbox_messages' },
        (payload) => {
          const row = payload.new as ShoutboxMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            const next = [...prev, row];
            if (next.length > 200) next.splice(0, next.length - 200);
            return next;
          });
        }
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === 'SUBSCRIBED') setConn('online');
        else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') setConn('offline');
      });

    const presenceChannel = supabase.channel('shoutbox_room', {
      config: { presence: { key: presenceKeyRef.current } },
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const keys = Object.keys(state);
        if (!cancelled) {
          setViewers(Math.max(1, keys.length));
          setPresenceList(keys.map((k) => {
            const rec = state[k]?.[0] as Record<string, unknown> | undefined;
            const nick = typeof rec?.nickname === 'string' ? (rec.nickname as string) : null;
            return { key: k, nickname: nick };
          }));
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownEndsRef.current - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [cooldownRemaining]);

  const clearError = useCallback(() => setError(null), []);

  const send = useCallback<UseShoutboxResult['send']>(async ({ nickname, body }) => {
    const trimmed = body.trim();
    if (!trimmed || sending || cooldownRemaining > 0) return 'rejected';
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/shoutbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, body: trimmed, lang: language, website: '' }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        if (data.error === 'rate_limited_daily') {
          setError(t.rateLimitedDaily);
          return 'rate_limited_daily';
        }
        cooldownEndsRef.current = Date.now() + COOLDOWN_MS;
        setCooldownRemaining(30);
        return 'rate_limited';
      }
      if (!res.ok) {
        setError(t.rejected);
        return 'rejected';
      }
      const data = await res.json().catch(() => ({} as { message?: { id?: number } }));
      const id = data?.message?.id;
      if (typeof id === 'number') {
        setOwnIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }
      cooldownEndsRef.current = Date.now() + COOLDOWN_MS;
      setCooldownRemaining(30);
      return 'ok';
    } catch {
      setError(t.rejected);
      return 'rejected';
    } finally {
      setSending(false);
    }
  }, [language, sending, cooldownRemaining, t]);

  const mergedUsers = useMemo<MergedUser[]>(() => {
    const onlineNames = new Set<string>();
    for (const p of presenceList) {
      onlineNames.add(p.nickname || `visitor_${p.key.slice(-4)}`);
    }

    const recentFromMessages: string[] = [];
    for (let i = messages.length - 1; i >= 0 && recentFromMessages.length < 40; i--) {
      const n = messages[i].nickname;
      if (n && !recentFromMessages.includes(n)) recentFromMessages.push(n);
    }

    const seen = new Set<string>();
    const ordered: MergedUser[] = [];

    for (const name of onlineNames) {
      if (seen.has(name)) continue;
      seen.add(name);
      ordered.push({ name, online: true });
    }
    for (const name of recentFromMessages) {
      if (seen.has(name)) continue;
      seen.add(name);
      ordered.push({ name, online: onlineNames.has(name) });
    }
    for (const name of REGULARS) {
      if (seen.has(name)) continue;
      seen.add(name);
      ordered.push({ name, online: onlineNames.has(name) });
    }

    return ordered;
  }, [presenceList, messages]);

  return {
    messages, loaded, conn, viewers, presenceList, mergedUsers,
    cooldownRemaining, sending, error, ownIds,
    send, clearError,
  };
}
