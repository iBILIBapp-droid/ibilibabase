/* ═══════════════════════════════════════
   iBilib — auth.js
   Add to BOTH iBilib versions:
   - ibilib/index.html
   - ibilib-teacher/index.html

   Place this BEFORE script.js:
   <script src="../auth.js"></script>
   <script src="script.js"></script>
═══════════════════════════════════════ */

const _SB_URL  = 'https://yapnbwxerwppsepcdcxi.supabase.co';
const _SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk';
const _LOGIN   = '/index.html';

(async () => {
  /* Wait for Supabase CDN to load */
  const _sb = supabase.createClient(_SB_URL, _SB_ANON);

  /* ── Check session ── */
  const { data: { session } } = await _sb.auth.getSession();
  if (!session) {
    window.location.replace(_LOGIN);
    return;
  }

  const user     = session.user;
  const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
  const initials = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  /* ── Inject styles ── */
  const style = document.createElement('style');
  style.textContent = `
    #_auth-bar {
      position: fixed;
      top: 14px;
      right: 16px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: _authIn 0.4s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes _authIn {
      from { opacity:0; transform:translateY(-10px); }
      to   { opacity:1; transform:translateY(0); }
    }
    #_user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 13px 6px 7px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.13);
      border-radius: 50px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 4px 18px rgba(0,0,0,0.25);
      color: #f1e9ff;
      font-family: 'DM Sans', 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: default;
    }
    #_avatar {
      width: 26px; height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      display: grid; place-items: center;
      font-size: 11px; font-weight: 700;
      color: #fff; flex-shrink: 0;
      letter-spacing: 0.5px;
    }
    #_logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      background: rgba(248,113,113,0.1);
      border: 1px solid rgba(248,113,113,0.28);
      border-radius: 50px;
      color: #fca5a5;
      font-family: 'DM Sans', 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 4px 18px rgba(0,0,0,0.25);
      transition: background 0.2s, border-color 0.2s, transform 0.15s;
      white-space: nowrap;
    }
    #_logout-btn:hover {
      background: rgba(248,113,113,0.22);
      border-color: rgba(248,113,113,0.5);
      transform: translateY(-1px);
    }
    #_logout-btn:active { transform: translateY(0); }
    #_logout-btn svg { flex-shrink: 0; }

    /* Push navbar right side so logout doesn't overlap */
    .nav-right { padding-right: 200px; }
    @media (max-width: 768px) {
      .nav-right { padding-right: 0; }
      #_user-pill { display: none; }
      #_auth-bar { top: 10px; right: 10px; }
    }
  `;
  document.head.appendChild(style);

  /* ── Inject HTML ── */
  const bar = document.createElement('div');
  bar.id = '_auth-bar';
  bar.innerHTML = `
    <div id="_user-pill">
      <div id="_avatar">${initials}</div>
      ${fullName}
    </div>
    <button id="_logout-btn" onclick="_doLogout()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Logout
    </button>
  `;
  document.body.appendChild(bar);

  /* ── Logout handler ── */
  window._doLogout = async () => {
    const btn = document.getElementById('_logout-btn');
    btn.textContent = 'Signing out…';
    btn.disabled = true;
    await _sb.auth.signOut();
    window.location.replace(_LOGIN);
  };

  /* ── Sign out from other tabs ── */
  _sb.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      window.location.replace(_LOGIN);
    }
  });

})();
