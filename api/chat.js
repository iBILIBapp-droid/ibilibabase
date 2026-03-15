// api/chat.js — Vercel serverless function (CommonJS)
// Proxies BILIBot → Groq with server-side key rotation.
// Keys are loaded from Supabase groq_keys table — never exposed to browser.

const SB_URL  = 'https://yapnbwxerwppsepcdcxi.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk';
const GROQ    = 'https://api.groq.com/openai/v1/chat/completions';

// ── In-memory key pool (persists across warm invocations) ──
let _pool = [];      // [{ id, key }]
let _loaded = false;

async function loadKeys() {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/groq_keys?is_invalid=eq.false&select=id,key&order=id.asc`,
      { headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` } }
    );
    if (!r.ok) throw new Error('Supabase fetch failed: ' + r.status);
    const rows = await r.json();
    _pool = Array.isArray(rows) ? rows : [];
    _loaded = true;
    console.log(`[chat proxy] loaded ${_pool.length} key(s)`);
  } catch (e) {
    console.error('[chat proxy] loadKeys error:', e.message);
    _pool = [];
    _loaded = false;
  }
}

async function markInvalid(id) {
  try {
    await fetch(`${SB_URL}/rest/v1/groq_keys?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SB_ANON,
        Authorization: `Bearer ${SB_ANON}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ is_invalid: true, trashed_at: new Date().toISOString() })
    });
    console.warn(`[chat proxy] marked key id=${id} as invalid`);
  } catch (e) {
    console.warn('[chat proxy] markInvalid error:', e.message);
  }
  // Remove from in-memory pool immediately
  _pool = _pool.filter(k => k.id !== id);
}

module.exports = async function handler(req, res) {
  // ── CORS ──
  const origin = req.headers.origin || '';
  const allowed = ['https://ibilibanhs.vercel.app', 'http://localhost', 'http://127.0.0.1'];
  const isAllowed = allowed.some(o => origin.startsWith(o)) || origin === '';
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? (origin || '*') : 'null');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Parse body ──
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {}
  }
  if (!body || !body.messages) {
    return res.status(400).json({ error: 'Invalid request — messages required' });
  }

  // ── Load keys if pool is empty ──
  if (!_loaded || _pool.length === 0) await loadKeys();
  if (_pool.length === 0) {
    return res.status(503).json({ error: 'No Groq keys available. Add keys to the groq_keys table in Supabase.' });
  }

  // ── Try each key, rotate on 401/429 ──
  const tried = new Set();
  while (_pool.length > 0) {
    const entry = _pool[0];
    if (tried.has(entry.id)) break; // full loop — all exhausted
    tried.add(entry.id);

    try {
      const groqRes = await fetch(GROQ, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${entry.key}`
        },
        body: JSON.stringify(body)
      });

      // 401 = bad key, 429 = rate limited → mark invalid and rotate
      if (groqRes.status === 401 || groqRes.status === 429) {
        console.warn(`[chat proxy] key id=${entry.id} returned ${groqRes.status}, rotating…`);
        await markInvalid(entry.id);
        // Reload from Supabase to get fresh list
        await loadKeys();
        continue;
      }

      const data = await groqRes.json();
      return res.status(groqRes.status).json(data);

    } catch (err) {
      console.error('[chat proxy] fetch error:', err.message);
      return res.status(500).json({ error: 'Proxy error: ' + err.message });
    }
  }

  // All keys exhausted
  return res.status(503).json({ error: 'All Groq keys exhausted. Please add new keys to the groq_keys table.' });
};
