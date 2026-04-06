import { NextResponse } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request) {
  const origin = request.headers.get('origin') || '';
  const allowed = ['https://ibilibanhs.vercel.app', 'http://localhost', 'http://127.0.0.1'];
  const ok = allowed.includes(origin) || origin === '';

  const headers = new Headers({
    'Access-Control-Allow-Origin': ok ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405, headers });
  }

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY is not set in environment variables' },
      { status: 500, headers }
    );
  }

  try {
    const body = await request.json();
    if (!body?.messages) {
      return NextResponse.json({ error: 'messages required' }, { status: 400, headers });
    }

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await groqRes.json();
    return NextResponse.json(data, { status: groqRes.status, headers });
  } catch (err) {
    return NextResponse.json(
      { error: 'Proxy error: ' + err.message },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
