import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'failed' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }

  try {
    const res = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({ email_address: email, tags: ['website'] }),
    });

    if (res.status === 201) {
      return NextResponse.json({ success: true });
    }

    if (res.status === 400) {
      const data = await res.json();
      const msg = JSON.stringify(data).toLowerCase();
      if (msg.includes('already')) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'failed' }, { status: 400 });
    }

    if (res.status === 429) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    }

    return NextResponse.json({ error: 'failed' }, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
