// ═══════════════════════════════════════
//  iBilib — Account Manager Component
//  src/pages/teacher/AccountManager.ts
//
//  TypeScript port of account-manager.js
// ═══════════════════════════════════════

import { sb } from '@/lib/supabase';
import type { AccountEntry, PendingRoleChange, RoleMeta, UserRole } from '@/types';

// ── Constants ────────────────────────────────────────────────
const ROLES: UserRole[] = ['student', 'teacher', 'private'];
const ROLE_META: Record<string, RoleMeta> = {
  student: { label: 'Student', color: '#22d3ee', bg: 'rgba(34,211,238,.13)', icon: '🎓' },
  teacher: { label: 'Teacher', color: '#a78bfa', bg: 'rgba(167,139,250,.13)', icon: '📖' },
  private: { label: 'Private', color: '#fbbf24', bg: 'rgba(251,191,36,.13)', icon: '🔒' },
  unknown: { label: 'Unknown', color: '#6b7280', bg: 'rgba(107,114,128,.13)', icon: '❓' },
};

// ── Module state ─────────────────────────────────────────────
let _accounts: AccountEntry[] = [];
let _filtered: AccountEntry[] = [];
let _filterRole = 'all';
let _searchQ = '';
let _pendingChange: PendingRoleChange | null = null;
let _busy = false;
let _debounce: ReturnType<typeof setTimeout> | undefined;

// ── HTML escape helper ───────────────────────────────────────
function esc(s: unknown): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Inject styles ────────────────────────────────────────────
function injectStyles(): void {
  if (document.getElementById('am-styles')) return;
  document.head.insertAdjacentHTML('beforeend', `<style id="am-styles">
  #am-nav-btn{display:flex;align-items:center;gap:6px;padding:7px 15px;background:rgba(167,139,250,.13);border:1px solid rgba(167,139,250,.28);border-radius:50px;color:#c4b5fd;font-family:'DM Sans','Inter',sans-serif;font-size:13px;font-weight:500;cursor:pointer;backdrop-filter:blur(16px);transition:background .2s,border-color .2s,transform .15s;white-space:nowrap;flex-shrink:0}
  #am-nav-btn:hover{background:rgba(167,139,250,.24);border-color:rgba(167,139,250,.5);transform:translateY(-1px)}
  @media(max-width:768px){#am-nav-btn span{display:none}#am-nav-btn{padding:8px;border-radius:50%;width:38px;height:38px;justify-content:center}}
  #am-overlay{position:fixed;inset:0;z-index:99990;background:rgba(8,4,20,.78);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .3s cubic-bezier(.4,0,.2,1);pointer-events:none}
  #am-overlay.am-open{opacity:1;pointer-events:all}
  #am-modal{background:#150e2a;border:1px solid rgba(167,139,250,.18);border-radius:24px;box-shadow:0 32px 80px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04);width:100%;max-width:820px;max-height:90vh;display:flex;flex-direction:column;transform:translateY(18px) scale(.97);transition:transform .35s cubic-bezier(.22,1,.36,1);overflow:hidden}
  #am-overlay.am-open #am-modal{transform:translateY(0) scale(1)}
  .am-header{display:flex;align-items:center;gap:14px;padding:22px 24px 18px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0}
  .am-header-icon{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#a855f7);display:grid;place-items:center;flex-shrink:0}
  .am-header-titles{flex:1;min-width:0}
  .am-header-titles h2{margin:0;font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#f1e9ff}
  .am-header-titles p{margin:4px 0 0;font-size:13px;color:rgba(241,233,255,.5)}
  .am-close{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(241,233,255,.6);cursor:pointer;display:grid;place-items:center;transition:background .2s,color .2s;flex-shrink:0}
  .am-close:hover{background:rgba(248,113,113,.15);color:#fca5a5;border-color:rgba(248,113,113,.3)}
  .am-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 24px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0}
  .am-search-wrap{flex:1;min-width:180px;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:50px;padding:8px 14px}
  .am-search-wrap svg{opacity:.45;flex-shrink:0}
  .am-search-wrap input{border:none;background:transparent;outline:none;color:#f1e9ff;font-size:13px;font-family:'DM Sans',sans-serif;width:100%}
  .am-search-wrap input::placeholder{color:rgba(241,233,255,.3)}
  .am-filter-pills{display:flex;gap:6px;flex-wrap:wrap}
  .am-pill{padding:6px 13px;border-radius:50px;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(241,233,255,.55);transition:background .18s,color .18s,border-color .18s;white-space:nowrap}
  .am-pill.active,.am-pill:hover{background:rgba(167,139,250,.18);color:#c4b5fd;border-color:rgba(167,139,250,.35)}
  .am-count-badge{margin-left:4px;padding:1px 6px;border-radius:50px;background:rgba(167,139,250,.2);color:#c4b5fd;font-size:11px;font-weight:700}
  .am-refresh-btn{width:34px;height:34px;border-radius:50%;flex-shrink:0;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:rgba(241,233,255,.6);cursor:pointer;display:grid;place-items:center;transition:background .18s}
  .am-refresh-btn:hover{background:rgba(167,139,250,.18);color:#c4b5fd}
  .am-refresh-btn.spinning svg{animation:am-spin .7s linear infinite}
  @keyframes am-spin{to{transform:rotate(360deg)}}
  .am-table-wrap{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(167,139,250,.3) transparent}
  .am-table-wrap::-webkit-scrollbar{width:5px}
  .am-table-wrap::-webkit-scrollbar-thumb{background:rgba(167,139,250,.3);border-radius:50px}
  .am-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:52px 24px;color:rgba(241,233,255,.4);font-family:'DM Sans',sans-serif;font-size:14px}
  .am-spinner{width:32px;height:32px;border-radius:50%;border:3px solid rgba(167,139,250,.2);border-top-color:#a855f7;animation:am-spin .7s linear infinite}
  .am-account-row{display:flex;align-items:center;gap:14px;padding:13px 24px;border-bottom:1px solid rgba(255,255,255,.05);transition:background .15s}
  .am-account-row:last-child{border-bottom:none}
  .am-account-row:hover{background:rgba(255,255,255,.03)}
  .am-avatar{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#7c3aed,#a855f7);display:grid;place-items:center;font-size:13px;font-weight:700;color:#fff;letter-spacing:.5px}
  .am-info{flex:1;min-width:0}
  .am-name{font-family:'Syne',sans-serif;font-size:14px;font-weight:600;color:#f1e9ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .am-sub{font-size:11px;color:rgba(241,233,255,.32);margin-top:3px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .am-role-tag{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:50px;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;flex-shrink:0}
  .am-role-select-wrap{flex-shrink:0}
  .am-role-select{appearance:none;-webkit-appearance:none;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:50px;padding:7px 32px 7px 13px;color:#f1e9ff;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;cursor:pointer;outline:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='rgba(241,233,255,.5)' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;transition:border-color .2s,background-color .2s}
  .am-role-select:hover{border-color:rgba(167,139,250,.4);background-color:rgba(167,139,250,.1)}
  .am-role-select:focus{border-color:#a855f7}
  .am-role-select option{background:#1a1030;color:#f1e9ff}
  .am-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 24px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0}
  .am-footer-stats{font-size:12px;color:rgba(241,233,255,.4);font-family:'DM Sans',sans-serif}
  .am-footer-stats strong{color:#c4b5fd}
  .am-toast{padding:8px 16px;border-radius:50px;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;opacity:0;transition:opacity .3s;pointer-events:none}
  .am-toast.show{opacity:1}
  .am-toast.ok{background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.25)}
  .am-toast.err{background:rgba(248,113,113,.15);color:#fca5a5;border:1px solid rgba(248,113,113,.25)}
  #am-confirm{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(8,4,20,.6);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .25s}
  #am-confirm.open{opacity:1;pointer-events:all}
  .am-confirm-box{background:#1e1340;border:1px solid rgba(167,139,250,.22);border-radius:20px;padding:28px;max-width:400px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,.5);transform:scale(.94);transition:transform .28s cubic-bezier(.22,1,.36,1);text-align:center}
  #am-confirm.open .am-confirm-box{transform:scale(1)}
  .am-confirm-icon{font-size:40px;margin-bottom:12px;display:block}
  .am-confirm-box h3{margin:0 0 8px;font-family:'Syne',sans-serif;font-size:18px;color:#f1e9ff}
  .am-confirm-box p{margin:0 0 22px;font-size:13px;color:rgba(241,233,255,.55);line-height:1.6}
  .am-confirm-actions{display:flex;gap:10px;justify-content:center}
  .am-confirm-cancel{padding:9px 22px;border-radius:50px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);color:rgba(241,233,255,.7);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:background .18s}
  .am-confirm-cancel:hover{background:rgba(255,255,255,.12)}
  .am-confirm-ok{padding:9px 22px;border-radius:50px;border:none;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(124,58,237,.35);transition:transform .15s,box-shadow .15s}
  .am-confirm-ok:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(124,58,237,.5)}
  .am-confirm-ok:disabled{opacity:.5;cursor:not-allowed;transform:none}
  .am-no-profile{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:50px;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);color:#fbbf24;font-size:10px;font-weight:600;font-family:'DM Sans',sans-serif;margin-left:6px;vertical-align:middle}
  </style>`);
}

// ── Inject HTML ───────────────────────────────────────────────
function injectHTML(): void {
  document.body.insertAdjacentHTML('beforeend', `
  <div id="am-overlay" role="dialog" aria-modal="true" aria-labelledby="am-title">
    <div id="am-modal">
      <div class="am-header">
        <div class="am-header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="am-header-titles">
          <h2 id="am-title">Account Manager</h2>
          <p>View and manage roles for all registered accounts</p>
        </div>
        <button class="am-close" id="am-close-btn" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="am-toolbar">
        <div class="am-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="am-search" placeholder="Search by name or email…" autocomplete="off" spellcheck="false">
        </div>
        <div class="am-filter-pills">
          <button class="am-pill active" data-role="all">All <span class="am-count-badge" id="am-cnt-all">0</span></button>
          <button class="am-pill" data-role="student">🎓 Students <span class="am-count-badge" id="am-cnt-student">0</span></button>
          <button class="am-pill" data-role="teacher">📖 Teachers <span class="am-count-badge" id="am-cnt-teacher">0</span></button>
          <button class="am-pill" data-role="private">🔒 Private <span class="am-count-badge" id="am-cnt-private">0</span></button>
        </div>
        <button class="am-refresh-btn" id="am-refresh-btn" title="Refresh">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>
      <div class="am-table-wrap" id="am-table-wrap">
        <div class="am-state"><div class="am-spinner"></div><span>Loading accounts…</span></div>
      </div>
      <div class="am-footer">
        <span class="am-footer-stats" id="am-footer-stats">–</span>
        <span class="am-toast" id="am-toast"></span>
      </div>
    </div>
  </div>
  <div id="am-confirm">
    <div class="am-confirm-box">
      <span class="am-confirm-icon">🔄</span>
      <h3>Change Role?</h3>
      <p id="am-confirm-msg"></p>
      <div class="am-confirm-actions">
        <button class="am-confirm-cancel" id="am-confirm-cancel">Cancel</button>
        <button class="am-confirm-ok" id="am-confirm-ok">Apply Change</button>
      </div>
    </div>
  </div>`);
}

// ── Check if current user has 'private' role ─────────────────
async function checkPrivateRole(): Promise<boolean> {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return false;
    const { data } = await sb.from('profiles').select('role').eq('id', session.user.id).single();
    return (data?.role ?? '').toLowerCase() === 'private';
  } catch { return false; }
}

// ── Mount the nav button ──────────────────────────────────────
function mountNavBtn(): void {
  const existing = document.getElementById('am-nav-btn');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.id = 'am-nav-btn';
  btn.className = 'dropdown-item';
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>Account Manager</span>`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close the dropdown parent
    document.getElementById('_user-dropdown')?.classList.remove('open');
    void open();
  });

  const menu = document.getElementById('_user-menu-items');
  if (menu) {
    menu.appendChild(btn);
  } else {
    // Fallback: if dropdown menu is not present, don't mount or mount elsewhere
    console.warn('[AccountManager] _user-menu-items not found, skipping dropdown mount');
  }

  const mob = document.getElementById('mobile-menu');
  if (mob && !document.getElementById('am-mob-link')) {
    const a = document.createElement('a');
    a.id = 'am-mob-link'; a.className = 'mob-link'; a.style.cursor = 'pointer';
    a.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Account Manager`;
    a.addEventListener('click', () => { mob.classList.add('hidden'); void open(); });
    mob.appendChild(a);
  }
}

// ── Open / Close ─────────────────────────────────────────────
async function open(): Promise<void> {
  const isPrivate = await checkPrivateRole();
  if (!isPrivate) return;
  document.getElementById('am-overlay')?.classList.add('am-open');
  document.body.style.overflow = 'hidden';
  void load();
}

function close(): void {
  document.getElementById('am-overlay')?.classList.remove('am-open');
  document.body.style.overflow = '';
}

// ── Load accounts ─────────────────────────────────────────────
async function load(): Promise<void> {
  const wrap = document.getElementById('am-table-wrap')!;
  const refBtn = document.getElementById('am-refresh-btn')!;
  refBtn.classList.add('spinning');
  wrap.innerHTML = `<div class="am-state"><div class="am-spinner"></div><span>Loading accounts…</span></div>`;

  try {
    let myId = '', myEmail = '', myName = '';
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        myId = session.user.id;
        myEmail = session.user.email ?? '';
        myName = (session.user.user_metadata?.['full_name'] as string | undefined)
          ?? (session.user.user_metadata?.['name'] as string | undefined) ?? '';
      }
    } catch { /* ignore */ }

    const { data: profileRows, error: profErr } = await sb
      .from('profiles')
      .select('id, role, full_name')
      .order('full_name', { ascending: true, nullsFirst: false });

    if (profErr) throw profErr;

    _accounts = (profileRows ?? []).map((p: { id: string; role: string | null; full_name: string | null }) => {
      const isMe = p.id === myId;
      const name = p.full_name ?? (isMe ? myName : '') ?? `User ${p.id.slice(0, 6)}`;
      const email = isMe ? myEmail : '';
      return {
        id: p.id,
        name: name.trim() || 'Unnamed',
        email,
        role: ((p.role ?? 'student').toLowerCase()) as UserRole,
        hasProfile: true,
      };
    });

    if (myId && !_accounts.find(u => u.id === myId)) {
      _accounts.unshift({ id: myId, name: myName || myEmail.split('@')[0] || 'You', email: myEmail, role: 'teacher', hasProfile: false });
    }

    _accounts.sort((a, b) => {
      const aUnnamed = a.name.startsWith('User ') || a.name === 'Unnamed';
      const bUnnamed = b.name.startsWith('User ') || b.name === 'Unnamed';
      if (aUnnamed !== bUnnamed) return aUnnamed ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    updateCounts(); render(); updateFooter();

  } catch (err) {
    wrap.innerHTML = `
      <div class="am-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="1.8" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style="color:#fca5a5;font-weight:600">Failed to load accounts</span>
        <span style="font-size:12px;opacity:.65;max-width:320px;text-align:center">${esc((err as Error).message)}</span>
        <button id="am-retry-btn" style="margin-top:8px;padding:8px 20px;border-radius:50px;border:1px solid rgba(167,139,250,.3);background:rgba(167,139,250,.1);color:#c4b5fd;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif">Retry</button>
      </div>`;
    document.getElementById('am-retry-btn')?.addEventListener('click', () => void load());
  } finally {
    refBtn.classList.remove('spinning');
  }
}

// ── Filter & Render ───────────────────────────────────────────
function filter(): AccountEntry[] {
  return _accounts.filter(u => {
    const roleOk = _filterRole === 'all' || u.role === _filterRole;
    const searchOk = !_searchQ || u.name.toLowerCase().includes(_searchQ) || u.email.toLowerCase().includes(_searchQ) || u.id.toLowerCase().includes(_searchQ);
    return roleOk && searchOk;
  });
}

function updateCounts(): void {
  const set = (id: string, n: number) => { const el = document.getElementById(id); if (el) el.textContent = String(n); };
  set('am-cnt-all', _accounts.length);
  set('am-cnt-student', _accounts.filter(u => u.role === 'student').length);
  set('am-cnt-teacher', _accounts.filter(u => u.role === 'teacher').length);
  set('am-cnt-private', _accounts.filter(u => u.role === 'private').length);
}

function updateFooter(): void {
  const el = document.getElementById('am-footer-stats');
  if (!el) return;
  const s = _accounts.filter(u => u.role === 'student').length;
  const t = _accounts.filter(u => u.role === 'teacher').length;
  const p = _accounts.filter(u => u.role === 'private').length;
  el.innerHTML = `Showing <strong>${_filtered.length}</strong> of <strong>${_accounts.length}</strong> &nbsp;·&nbsp; 🎓 ${s} &nbsp;📖 ${t} &nbsp;🔒 ${p}`;
}

function render(): void {
  _filtered = filter();
  const wrap = document.getElementById('am-table-wrap')!;
  if (!_filtered.length) {
    wrap.innerHTML = `<div class="am-state"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>No accounts found</span></div>`;
    updateFooter(); return;
  }

  wrap.innerHTML = _filtered.map(u => {
    const meta = ROLE_META[u.role] ?? ROLE_META['unknown']!;
    const initials = u.name.replace(/^User /, '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
    const subLine = u.email ? esc(u.email) : `id: ${esc(u.id.slice(0, 8))}…`;
    const noProfileChip = u.hasProfile === false ? `<span class="am-no-profile">⚠ no profile row</span>` : '';
    const options = ROLES.map(r => { const rm = ROLE_META[r]!; return `<option value="${r}"${u.role === r ? ' selected' : ''}>${rm.icon} ${rm.label}</option>`; }).join('');
    return `
      <div class="am-account-row">
        <div class="am-avatar">${initials}</div>
        <div class="am-info">
          <div class="am-name">${esc(u.name)}${noProfileChip}</div>
          <div class="am-sub">${subLine}</div>
        </div>
        <span class="am-role-tag" style="color:${meta.color};background:${meta.bg};border:1px solid ${meta.color}33">${meta.icon} ${meta.label}</span>
        <div class="am-role-select-wrap">
          <select class="am-role-select" data-id="${esc(u.id)}" data-cur="${u.role}" data-has-profile="${u.hasProfile}">${options}</select>
        </div>
      </div>`;
  }).join('');

  // Attach change listeners to selects
  wrap.querySelectorAll<HTMLSelectElement>('.am-role-select').forEach(sel => {
    sel.addEventListener('change', () => roleChange(sel));
  });

  updateFooter();
}

// ── Role change → confirm ─────────────────────────────────────
function roleChange(select: HTMLSelectElement): void {
  const id = select.dataset['id']!;
  const oldRole = select.dataset['cur']!;
  const newRole = select.value;
  const hasProfile = select.dataset['hasProfile'] !== 'false';
  if (newRole === oldRole) return;

  const user = _accounts.find(u => u.id === id);
  if (!user) return;

  _pendingChange = { id, name: user.name, oldRole, newRole, hasProfile, selectEl: select };

  const om = ROLE_META[oldRole] ?? ROLE_META['unknown']!;
  const nm = ROLE_META[newRole] ?? ROLE_META['unknown']!;
  const msg = document.getElementById('am-confirm-msg')!;
  msg.innerHTML = `Change <strong>${esc(user.name)}</strong>'s role from<br>
    <span style="color:${om.color}">${om.icon} ${om.label}</span>
    &nbsp;→&nbsp;
    <span style="color:${nm.color}">${nm.icon} ${nm.label}</span>`;
  document.getElementById('am-confirm')?.classList.add('open');
}

function confirmCancel(): void {
  if (_pendingChange) { _pendingChange.selectEl.value = _pendingChange.oldRole; _pendingChange = null; }
  document.getElementById('am-confirm')?.classList.remove('open');
}

async function confirmApply(): Promise<void> {
  if (!_pendingChange || _busy) return;
  _busy = true;
  const okBtn = document.getElementById('am-confirm-ok') as HTMLButtonElement;
  okBtn.disabled = true; okBtn.textContent = 'Saving…';

  const { id, name, oldRole, newRole, selectEl } = _pendingChange;

  try {
    const user = _accounts.find(u => u.id === id);
    const { error } = await sb.from('profiles')
      .upsert({ id, role: newRole, full_name: user?.name ?? null }, { onConflict: 'id' })
      .select();
    if (error) throw error;

    const { data: verify, error: verifyErr } = await sb.from('profiles').select('role').eq('id', id).single();
    if (verifyErr) throw verifyErr;
    if ((verify?.role ?? '').toLowerCase() !== newRole) {
      throw new Error('RLS policy is blocking the write. Run the policy fix in Supabase SQL Editor.');
    }

    const acct = _accounts.find(u => u.id === id);
    if (acct) { acct.role = newRole as UserRole; acct.hasProfile = true; }
    selectEl.dataset['cur'] = newRole;
    selectEl.dataset['hasProfile'] = 'true';

    updateCounts(); render(); updateFooter();
    const nm = ROLE_META[newRole] ?? ROLE_META['unknown']!;
    showToast(`✓ ${name} → ${nm.icon} ${nm.label}`, 'ok');

  } catch (err) {
    selectEl.value = oldRole;
    showToast(`✗ ${(err as Error).message}`, 'err');
    console.error('[AccountManager] role update failed:', err);
  } finally {
    _busy = false; _pendingChange = null;
    okBtn.disabled = false; okBtn.textContent = 'Apply Change';
    document.getElementById('am-confirm')?.classList.remove('open');
  }
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg: string, type: 'ok' | 'err' = 'ok'): void {
  const t = document.getElementById('am-toast') as HTMLElement & { _timer?: ReturnType<typeof setTimeout> };
  t.textContent = msg;
  t.className = `am-toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── Init ─────────────────────────────────────────────────────
export async function initAccountManager(): Promise<void> {
  injectStyles();
  injectHTML();

  // Wire up static event listeners (no inline onclick)
  document.getElementById('am-close-btn')?.addEventListener('click', close);
  document.getElementById('am-overlay')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === 'am-overlay') close();
  });
  document.getElementById('am-refresh-btn')?.addEventListener('click', () => void load());
  document.getElementById('am-search')?.addEventListener('input', (e) => {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => { _searchQ = (e.target as HTMLInputElement).value.trim().toLowerCase(); render(); }, 180);
  });
  document.querySelectorAll<HTMLButtonElement>('.am-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      _filterRole = pill.dataset['role'] ?? 'all';
      document.querySelectorAll('.am-pill').forEach(p => p.classList.toggle('active', p === pill));
      render();
    });
  });
  document.getElementById('am-confirm-cancel')?.addEventListener('click', confirmCancel);
  document.getElementById('am-confirm-ok')?.addEventListener('click', () => void confirmApply());
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('am-confirm')?.classList.contains('open')) { confirmCancel(); return; }
    close();
  });

  // Check if current user has private role, then mount nav button
  const isPrivate = await checkPrivateRole();
  if (isPrivate) mountNavBtn();
}
