// api/chat.js — Vercel serverless function
// Single hardcoded Groq key — simple and reliable.
// To change the key: update GROQ_KEY below and redeploy.

const GROQ_KEY = process.env.GROQ_API_KEY; // set this in Vercel Environment Variables
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

module.exports = async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  const allowed = ['https://ibilibanhs.vercel.app', 'http://localhost', 'http://127.0.0.1'];
  const ok = allowed.includes(origin) || origin === '';
  res.setHeader('Access-Control-Allow-Origin', ok ? (origin || '*') : 'null');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GROQ_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not set in Vercel Environment Variables.' });
  }

  // Parse body
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { } }
  if (!body?.messages) return res.status(400).json({ error: 'messages required' });

  // Forward to Groq
  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await groqRes.json();
    return res.status(groqRes.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
};
