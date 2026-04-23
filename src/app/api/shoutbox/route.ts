import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSupabaseServer, type ShoutboxMessage } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hashIp(ip: string): string {
  const salt = process.env.SHOUTBOX_IP_SALT ?? '';
  const dayBucket = Math.floor(Date.now() / 86_400_000).toString();
  return createHash('sha256').update(`${salt}:${dayBucket}:${ip}`).digest('hex');
}

function extractIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return '0.0.0.0';
}

function extractCountry(req: Request): string | null {
  const c = req.headers.get('x-vercel-ip-country');
  if (!c) return null;
  const up = c.toUpperCase();
  return /^[A-Z]{2}$/.test(up) ? up : null;
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const [messagesRes, countRes] = await Promise.all([
      supabase
        .from('shoutbox_messages')
        .select('id, created_at, nickname, body, country_code, lang')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.rpc('shoutbox_count'),
    ]);

    if (messagesRes.error) {
      return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
    }

    const messages = (messagesRes.data ?? []) as ShoutboxMessage[];
    const total = typeof countRes.data === 'number'
      ? countRes.data
      : Number(countRes.data ?? messages.length);

    return NextResponse.json(
      { messages: messages.reverse(), total },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload: { nickname?: unknown; body?: unknown; lang?: unknown; website?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // Honeypot — bots fill this field, real users don't see it.
  if (typeof payload.website === 'string' && payload.website.length > 0) {
    return NextResponse.json({ success: true });
  }

  const body = typeof payload.body === 'string' ? payload.body : '';
  if (body.trim().length === 0) {
    return NextResponse.json({ error: 'empty_body' }, { status: 400 });
  }
  if (body.length > 280) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  const nickname = typeof payload.nickname === 'string' ? payload.nickname : '';
  const lang = typeof payload.lang === 'string' ? payload.lang : 'EN';

  const ip = extractIp(request);
  const ipHash = hashIp(ip);
  const country = extractCountry(request);

  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.rpc('shoutbox_insert', {
      p_nickname: nickname,
      p_body: body,
      p_country_code: country,
      p_ip_hash: ipHash,
      p_lang: lang,
    });

    if (error) {
      const code = error.code;
      if (code === 'P0003') return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
      if (code === 'P0004') return NextResponse.json({ error: 'rate_limited_daily' }, { status: 429 });
      if (code === 'P0002') return NextResponse.json({ error: 'empty_body' }, { status: 400 });
      if (code === 'P0001') return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data as ShoutboxMessage });
  } catch {
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }
}
