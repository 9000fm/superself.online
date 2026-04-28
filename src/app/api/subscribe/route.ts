import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(request: Request) {
  const { email, lang } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'failed' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  try {
    const supa = getSupabaseServer();
    const { error } = await supa
      .from('subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        source: 'website',
        lang: typeof lang === 'string' ? lang : null,
      });

    // 23505 = unique violation → already subscribed, treat as success
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: 'failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
