/* ═══════════════════════════════════════
   iBilib Auth Guard — Student Page
   Hides page until session verified
   Blocks teachers from accessing this page
═══════════════════════════════════════ */

document.documentElement.style.cssText = 'visibility:hidden;opacity:0';

(function () {
    const s = document.createElement('style');
    s.textContent = `
    #_gs{position:fixed;inset:0;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0d0820;gap:16px}
    #_gs.blocked{background:#1a0820}
    ._gl{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#f1e9ff;letter-spacing:-.5px}
    ._gl span{color:#a855f7}
    ._gsp{width:36px;height:36px;border-radius:50%;border:3px solid rgba(168,85,247,.2);border-top-color:#a855f7;animation:_gspin .7s linear infinite}
    ._gbi{font-size:48px}
    ._gbt{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#fca5a5;text-align:center}
    ._gbs{font-size:14px;color:#a78fbf;text-align:center}
    ._gbb{margin-top:8px;padding:10px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);border:none;border-radius:50px;color:#fff;font-family:'Syne',sans-serif;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 24px rgba(124,58,237,.4);transition:transform .15s}
    ._gbb:hover{transform:translateY(-2px)}
    @keyframes _gspin{to{transform:rotate(360deg)}}
    #_ab{position:fixed;top:12px;right:16px;z-index:99999;display:flex;align-items:center;gap:8px;animation:_abIn .4s cubic-bezier(.22,1,.36,1) both}
    @keyframes _abIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
    #_up{display:flex;align-items:center;gap:8px;padding:6px 13px 6px 7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:50px;backdrop-filter:blur(16px);box-shadow:0 4px 18px rgba(0,0,0,.25);color:#f1e9ff;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #_av{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:grid;place-items:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
    #_lb{display:flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.28);border-radius:50px;color:#fca5a5;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;cursor:pointer;backdrop-filter:blur(16px);box-shadow:0 4px 18px rgba(0,0,0,.25);transition:background .2s,border-color .2s,transform .15s;white-space:nowrap}
    #_lb:hover{background:rgba(248,113,113,.22);border-color:rgba(248,113,113,.5);transform:translateY(-1px)}
    @media(max-width:768px){#_up{display:none}#_ab{top:10px;right:10px}}
  `;
    document.head.appendChild(s);
    const gs = document.createElement('div');
    gs.id = '_gs';
    gs.innerHTML = '<div class="_gl">i<span>Bilib</span></div><div class="_gsp"></div>';
    document.body.appendChild(gs);
})();

const _SB = supabase.createClient(
    'https://yapnbwxerwppsepcdcxi.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk'
);

function _blocked(msg) {
    const gs = document.getElementById('_gs');
    gs.classList.add('blocked');
    gs.innerHTML = `<div class="_gbi">🔒</div><div class="_gbt">Access Denied</div><div class="_gbs">${msg}</div><button class="_gbb" onclick="window.location.replace('../index.html')">← Go to Login</button>`;
    document.documentElement.style.cssText = 'visibility:visible;opacity:1';
}

async function _getRole(user) {
    const meta = (user.user_metadata || {});
    const r = (meta.role || meta.user_role || '').toLowerCase();
    if (r) return r;
    try {
        const res = await Promise.race([
            _SB.from('profiles').select('role').eq('id', user.id).single(),
            new Promise((_, rej) => setTimeout(() => rej('timeout'), 3000))
        ]);
        return (res?.data?.role || 'student').toLowerCase();
    } catch { return 'student'; }
}

(async () => {
    const { data: { session } } = await _SB.auth.getSession();
    if (!session) { window.location.replace('./index.html'); return; }

    const role = await _getRole(session.user);
    if (role === 'teacher' || role === 'private') {
        _blocked('This page is for students only.');
        return;
    }

    // ✅ Auth passed — reveal page
    document.getElementById('_gs')?.remove();
    document.documentElement.style.cssText = 'visibility:visible;opacity:1;transition:opacity .3s';

    const name = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const bar = document.createElement('div');
    bar.id = '_ab';
    bar.innerHTML = `<div id="_up"><div id="_av">${initials}</div>${name}</div>
    <button id="_lb" onclick="_logout()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>Logout</button>`;
    document.body.appendChild(bar);

    window._logout = async () => {
        const b = document.getElementById('_lb');
        b.textContent = 'Signing out…'; b.disabled = true;
        await _SB.auth.signOut();
        window.location.replace('../index.html');
    };
    _SB.auth.onAuthStateChange(e => {
        if (e === 'SIGNED_OUT') window.location.replace('../index.html');
    });
})();

/* ═══ iBilib Script ═══ */
// ─── Organization 1 — PORTFOLIO ──────────────────────────────
const SB_URL_PORTFOLIO = "https://gujzpqpcobwdsigxjcem.supabase.co";
const SB_KEY_PORTFOLIO = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1anpwcXBjb2J3ZHNpZ3hqY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjMyMzMsImV4cCI6MjA4NzkzOTIzM30.3W1BtfXpXRcikt1bfOGwdFBQEVtT3xhrGbub-PyGQ6o";

// ─── Organization 2 — iBILIB (previous) ──────────────────────
const SB_URL_IBILIB = "https://utpuzryjocromtvstxeb.supabase.co";
const SB_KEY_IBILIB = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cHV6cnlqb2Nyb210dnN0eGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg1MTYsImV4cCI6MjA4ODI5NDUxNn0.G_km1SkeuexDBmfx0oC1l0dFLM95CCQrfvJrdRxYXkk";

// ─── Organization 3 — iBILIB (active) ────────────────────────
const SB_URL_IBILIB3 = "https://yapnbwxerwppsepcdcxi.supabase.co";
const SB_KEY_IBILIB3 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk";

// ─── Aliases used by admin upload panel (targets Org 3) ───────
// Admin uploads go to Organization 3 — iBilib active project (yapnbwxerwppsepcdcxi).
const SB_URL = SB_URL_IBILIB3;
const SB_KEY = SB_KEY_IBILIB3;

// ─── Backwards-compat aliases (used internally) ───────────────
const SB_URL_ORG1 = SB_URL_PORTFOLIO;
const SB_KEY_ORG1 = SB_KEY_PORTFOLIO;
const SB_URL_ORG2 = SB_URL_IBILIB;
const SB_KEY_ORG2 = SB_KEY_IBILIB;
const SB_URL_ORG3 = SB_URL_IBILIB3;
const SB_KEY_ORG3 = SB_KEY_IBILIB3;

// ─── State ───────────────────────────────────────────────
let currentPage = 'home';   // 'home' | 'category' | 'browser'
let currentPath = '';       // active folder path, e.g. 'research/Grade-11'
let currentRootScope = '';       // root being browsed, e.g. 'research'
let currentFiles = [];       // files currently visible in browser page
let searchDebounce = null;
let lastSearchResults = [];  // save last search results for back navigation
let lastSearchQuery = '';    // save last search query
let currentCategoryRoot = '';  // current category root for back navigation
let currentCategoryTitle = ''; // current category title for back navigation

// ─── Page control ─────────────────────────────────────────
function showPage(p) {
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(p + '-page');
    if (target) {
        target.classList.remove('hidden');
        target.style.display = (p === 'viewer') ? 'flex' : 'block';
    }
    currentPage = p;

    // Reset search box when going home
    if (p === 'home') {
        currentPath = '';
        currentRootScope = '';
        currentFiles = [];
        lastSearchResults = []; // Clear saved search results
        lastSearchQuery = '';
        currentCategoryRoot = '';  // Clear category info
        currentCategoryTitle = '';
        document.querySelectorAll('.search-input').forEach(i => i.value = '');
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (p === 'home') document.querySelector('.nav-link')?.classList.add('active');
    if (window.lucide) lucide.createIcons();
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) { menu.classList.toggle('hidden'); lucide.createIcons(); }
}

// ─── Supabase list helper ─────────────────────────────────
// url and key default to PORTFOLIO for backwards-compatibility.
async function listPath(prefix, url = SB_URL_ORG1, key = SB_KEY_ORG1) {
    const orgLabel = url.includes('gujzpq') ? 'PORTFOLIO' : 'iBILIB';
    const res = await fetch(`${url}/storage/v1/object/list/archives`, {
        method: 'POST',
        headers: {
            "apikey": key,
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prefix, limit: 200 })
    });
    const data = await res.json();
    if (!res.ok) {
        console.error(`[listPath] ${orgLabel} ERROR ${res.status} for prefix "${prefix}":`, data);
        return [];
    }
    if (!Array.isArray(data)) {
        console.warn(`[listPath] ${orgLabel} unexpected response for prefix "${prefix}":`, data);
        return [];
    }
    console.log(`[listPath] ${orgLabel} "${prefix}" -> ${data.length} items`);
    return data;
}

// ─── Recursive file crawler (for global search) ────────────
// orgUrl / orgKey allow targeting either organization.
async function crawlAll(prefix, results = [], orgUrl = SB_URL_ORG1, orgKey = SB_KEY_ORG1) {
    const items = await listPath(prefix, orgUrl, orgKey);
    // listPath now always returns an array (empty on error), so no silent bail-out
    const folders = items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder');
    const files = items.filter(i => i.id && i.name !== '.emptyFolderPlaceholder' && i.name.match(/\.(pdf|doc|docx)$/i));

    for (const f of files) {
        results.push({ name: f.name, fullPath: `${prefix}/${f.name}`, size: f.metadata?.size, orgUrl, orgKey });
    }
    // Crawl subfolders in parallel
    await Promise.all(folders.map(f => crawlAll(`${prefix}/${f.name}`, results, orgUrl, orgKey)));
    return results;
}

// ─── Navigate into a folder ───────────────────────────────
// orgUrl / orgKey default to Org 1; pass Org 2 constants to target the second project.
async function smartNavigate(path, title, orgUrl = SB_URL_ORG1, orgKey = SB_KEY_ORG1) {
    const container = document.getElementById('category-container');
    const browserContainer = document.getElementById('browser-container');

    currentPath = path;
    // Set root scope from first segment
    currentRootScope = path.split('/')[0];

    // Clear search results since we're navigating to a folder
    // (the back button will use category info instead)
    lastSearchResults = [];
    lastSearchQuery = '';

    let skeletonHTML = '';
    for (let i = 0; i < 6; i++) {
        skeletonHTML += `<div class="liquid-card skeleton-card animate-pulse" style="opacity:1; animation-delay: ${i * 0.1}s">
            <div class="card-icon-wrap"></div>
            <div class="card-inner">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-desc"></div>
            </div>
            <div class="skeleton-action"></div>
        </div>`;
    }
    container.innerHTML = skeletonHTML;
    showPage('category');
    document.getElementById('category-page-title').innerText = title;
    lucide.createIcons();

    try {
        const items = await listPath(path, orgUrl, orgKey);
        const files = items.filter(i => i.id && i.name !== '.emptyFolderPlaceholder' && i.name.match(/\.(pdf|doc|docx)$/i));

        currentFiles = files.map(f => ({
            name: f.name,
            fullPath: `${path}/${f.name}`,
            size: f.metadata?.size,
            orgUrl,
            orgKey
        }));

        showPage('browser');
        document.getElementById('browser-title').innerText = title;
        renderFileObjects(currentFiles, browserContainer, true); // Use true for search appearance to show paths if desired
        document.getElementById('browser-back-btn').onclick = () => handleBack(path, orgUrl, orgKey);
        lucide.createIcons();
    } catch (e) {
        container.innerHTML = `<div class="liquid-card" style="opacity:1">
            <div class="card-icon-wrap"><i data-lucide="wifi-off"></i></div>
            <div class="card-inner"><h3>Network Error</h3><p>Could not reach archive</p></div>
        </div>`;
        lucide.createIcons();
    }
}

// ─── Render a list of file objects ────────────────────────
function renderFileObjects(files, container, isSearch = false) {
    container.innerHTML = "";
    if (!files || files.length === 0) {
        container.innerHTML = `<div class="liquid-card" style="opacity:1">
            <div class="card-icon-wrap"><i data-lucide="inbox"></i></div>
            <div class="card-inner"><h3>No results found</h3><p>Try a different search term</p></div>
        </div>`;
        lucide.createIcons();
        return;
    }
    files.forEach((f, i) => {
        // Use the file's own org URL if available, fall back to default Org 1
        const fileOrgUrl = f.orgUrl || SB_URL_ORG1;
        const baseUrl = `${fileOrgUrl}/storage/v1/object/public/archives/${f.fullPath}`;

        const div = document.createElement('div');
        div.className = "liquid-card animate-tile";
        div.style.animationDelay = `${i * 0.07}s`;
        div.dataset.filename = f.name;

        const parts = f.fullPath.split('/');
        const breadcrumb = parts.slice(0, -1).join(' › ');

        const h3 = document.createElement('h3');
        h3.textContent = f.name.replace(/_/g, ' ');

        const p = document.createElement('p');
        p.textContent = isSearch ? breadcrumb : formatSize(f.size);

        div.innerHTML = `
            <div class="card-icon-wrap"><i data-lucide="file-text"></i></div>
            <div class="card-inner">
                <div class="h3-placeholder"></div>
                <div class="p-placeholder"></div>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0">
                <button class="btn-icon" title="Download" onclick="event.stopPropagation(); directDownload('${baseUrl}', '${f.name.replace(/'/g, "\\'")}')">
                    <i data-lucide="download"></i>
                </button>
                <button class="btn-purple-action" onclick="event.stopPropagation(); openViewer('${baseUrl}')">View</button>
            </div>`;

        div.querySelector('.h3-placeholder').replaceWith(h3);
        div.querySelector('.p-placeholder').replaceWith(p);

        container.appendChild(div);
    });
    lucide.createIcons();

    // BILIBot scroll-to: wait for the longest card animation to finish, then scroll
    if (window._biliBotScrollTarget) {
        const target = window._biliBotScrollTarget;
        window._biliBotScrollTarget = null;
        // Longest stagger = files.length * 0.07s + 0.65s animation = ~1.3s max
        // Use 800ms as a safe wait that covers most cases without feeling slow
        const waitMs = Math.min(files.length * 70 + 100, 800);
        setTimeout(() => {
            const card = container.querySelector(`[data-filename="${CSS.escape(target)}"]`);
            if (card) {
                card.style.animation = 'none';
                card.style.opacity = '1';
                card.scrollIntoView({ behavior: 'instant', block: 'center' });
                // Force a reflow so the highlight starts fresh
                void card.offsetHeight;
                card.classList.add('bilibot-highlight');
                setTimeout(() => card.classList.remove('bilibot-highlight'), 1800);
            }
        }, waitMs);
    }
}

// Legacy wrapper kept for compatibility
function renderFiles(files, container, path) {
    const mapped = files.map(f => ({
        name: f.name,
        fullPath: `${path}/${f.name}`,
        size: f.metadata?.size
    }));
    renderFileObjects(mapped, container);
}

// ─── Search handler ────────────────────────────────────────
function handleSearch(val) {
    // Sync all search inputs
    document.querySelectorAll('.search-input').forEach(inp => inp.value = val);

    clearTimeout(searchDebounce);
    const q = val.trim().toLowerCase();

    if (!q) {
        // Empty query — restore normal view
        if (currentPage === 'browser') {
            if (lastSearchResults.length) {
                // Restore last search results
                document.getElementById('browser-title').innerText =
                    `"${lastSearchQuery}" — ${lastSearchResults.length} result${lastSearchResults.length > 1 ? 's' : ''}`;
                renderFileObjects(lastSearchResults, document.getElementById('browser-container'), true);
            } else if (currentFiles.length) {
                renderFileObjects(currentFiles, document.getElementById('browser-container'));
            }
        }
        return;
    }

    searchDebounce = setTimeout(() => {
        if (currentPage === 'home') {
            runGlobalSearch(q);
        } else if (currentPage === 'browser') {
            runLocalSearch(q);
        } else if (currentPage === 'category') {
            // From category view, do a scoped search within the current root
            runScopedSearch(q, currentRootScope);
        }
    }, 350);
}

// Search across ALL three root folders from BOTH organizations
async function runGlobalSearch(q) {
    const container = document.getElementById('browser-container');

    // Switch to browser page to show results
    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const browserPage = document.getElementById('browser-page');
    browserPage.classList.remove('hidden');
    browserPage.style.display = 'block';
    currentPage = 'browser';

    document.getElementById('browser-title').innerText = `Search: "${q}"`;
    let skeletonHTML = '';
    for (let i = 0; i < 6; i++) {
        skeletonHTML += `<div class="liquid-card skeleton-card animate-pulse" style="opacity:1; animation-delay: ${i * 0.1}s">
            <div class="card-icon-wrap"></div>
            <div class="card-inner">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-desc"></div>
            </div>
            <div class="skeleton-action"></div>
        </div>`;
    }
    container.innerHTML = skeletonHTML;
    lucide.createIcons();

    document.getElementById('browser-back-btn').onclick = () => {
        showPage('browser');
        handleSearch(''); // Restore search results
    };

    try {
        // Crawl all three root categories across all organizations in parallel
        const [
            res1Files, mat1Files, pro1Files,
            res2Files, mat2Files, pro2Files,
            res3Files, mat3Files, pro3Files
        ] = await Promise.all([
            crawlAll('research', [], SB_URL_ORG1, SB_KEY_ORG1),
            crawlAll('materials', [], SB_URL_ORG1, SB_KEY_ORG1),
            crawlAll('prompts', [], SB_URL_ORG1, SB_KEY_ORG1),
            crawlAll('research', [], SB_URL_ORG2, SB_KEY_ORG2),
            crawlAll('materials', [], SB_URL_ORG2, SB_KEY_ORG2),
            crawlAll('prompts', [], SB_URL_ORG2, SB_KEY_ORG2),
            crawlAll('research', [], SB_URL_ORG3, SB_KEY_ORG3),
            crawlAll('materials', [], SB_URL_ORG3, SB_KEY_ORG3),
            crawlAll('prompts', [], SB_URL_ORG3, SB_KEY_ORG3),
        ]);

        const all = [...res1Files, ...mat1Files, ...pro1Files, ...res2Files, ...mat2Files, ...pro2Files, ...res3Files, ...mat3Files, ...pro3Files];
        const matches = all.filter(f => f.name.toLowerCase().replace(/_/g, ' ').includes(q));

        // Save search results for back navigation
        lastSearchResults = matches;
        lastSearchQuery = q;
        currentFiles = matches; // Also update currentFiles so handleSearch can restore

        document.getElementById('browser-title').innerText =
            matches.length ? `"${q}" — ${matches.length} result${matches.length > 1 ? 's' : ''}` : `No results for "${q}"`;

        renderFileObjects(matches, container, true);
    } catch (e) {
        container.innerHTML = `<div class="liquid-card" style="opacity:1">
            <div class="card-icon-wrap"><i data-lucide="wifi-off"></i></div>
            <div class="card-inner"><h3>Network Error</h3><p>Could not search archive</p></div>
        </div>`;
        lucide.createIcons();
    }
}

// Search only within the currently displayed file list (browser page)
function runLocalSearch(q) {
    const container = document.getElementById('browser-container');
    const matches = currentFiles.filter(f =>
        f.name.toLowerCase().replace(/_/g, ' ').includes(q)
    );
    // Save search results for back navigation
    lastSearchResults = matches;
    lastSearchQuery = q;
    document.getElementById('browser-title').innerText =
        matches.length ? `"${q}" — ${matches.length} result${matches.length > 1 ? 's' : ''}` : `No results for "${q}"`;
    renderFileObjects(matches, container);
}

// Search within a root category (when on category-page)
async function runScopedSearch(q, root) {
    const container = document.getElementById('browser-container');

    document.querySelectorAll('main > section').forEach(s => s.classList.add('hidden'));
    const browserPage = document.getElementById('browser-page');
    browserPage.classList.remove('hidden');
    browserPage.style.display = 'block';
    currentPage = 'browser';

    const rootLabels = { research: 'Research Studies', materials: 'Learning Materials', prompts: 'Writing Prompts' };
    document.getElementById('browser-title').innerText = `Searching in ${rootLabels[root] || root}…`;
    let skeletonHTML = '';
    for (let i = 0; i < 6; i++) {
        skeletonHTML += `<div class="liquid-card skeleton-card animate-pulse" style="opacity:1; animation-delay: ${i * 0.1}s">
            <div class="card-icon-wrap"></div>
            <div class="card-inner">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-desc"></div>
            </div>
            <div class="skeleton-action"></div>
        </div>`;
    }
    container.innerHTML = skeletonHTML;
    lucide.createIcons();

    document.getElementById('browser-back-btn').onclick = () => {
        showPage('browser');
        handleSearch(''); // Restore search results
    };

    try {
        // Search the scoped root across all organizations
        const [org1Files, org2Files, org3Files] = await Promise.all([
            crawlAll(root, [], SB_URL_ORG1, SB_KEY_ORG1),
            crawlAll(root, [], SB_URL_ORG2, SB_KEY_ORG2),
            crawlAll(root, [], SB_URL_ORG3, SB_KEY_ORG3),
        ]);
        const all = [...org1Files, ...org2Files, ...org3Files];
        const matches = all.filter(f => f.name.toLowerCase().replace(/_/g, ' ').includes(q));
        // Save search results for back navigation
        lastSearchResults = matches;
        lastSearchQuery = q;
        currentFiles = matches;
        document.getElementById('browser-title').innerText =
            matches.length
                ? `"${q}" in ${rootLabels[root]} — ${matches.length} result${matches.length > 1 ? 's' : ''}`
                : `No results for "${q}"`;
        renderFileObjects(matches, container, true);
    } catch (e) {
        container.innerHTML = `<div class="liquid-card" style="opacity:1">
            <div class="card-icon-wrap"><i data-lucide="wifi-off"></i></div>
            <div class="card-inner"><h3>Network Error</h3><p>Could not search</p></div>
        </div>`;
        lucide.createIcons();
    }
}

// ─── Misc helpers ──────────────────────────────────────────
function handleBack(path, orgUrl = SB_URL_ORG1, orgKey = SB_KEY_ORG1) {
    const parts = path.split('/');
    if (parts.length <= 1) {
        showPage('home');
    } else {
        parts.pop();
        const parentPath = parts.join('/');

        // Route strictly to their custom UI views
        if (parentPath === 'research') {
            loadCategory('research', 'Research Studies');
            return;
        }
        if (parentPath === 'materials') {
            loadCategory('materials', 'Learning Materials');
            return;
        }
        if (parentPath === 'prompts') {
            loadCategory('prompts', 'Writing Prompts');
            return;
        }

        smartNavigate(parentPath, parts[parts.length - 1] || 'Back', orgUrl, orgKey);
    }
}

function openViewer(url) {
    // Use Mozilla PDF.js viewer — renders ALL pages, fits to screen width on any device
    const pdfjs = 'https://mozilla.github.io/pdf.js/web/viewer.html';
    document.getElementById('pdf-frame').src = `${pdfjs}?file=${encodeURIComponent(url)}`;
    showPage('viewer');
}

function closeViewer() {
    document.getElementById('pdf-frame').src = "";
    showPage('browser');
}

function directDownload(url, filename) {
    // 1. Append ?download= — tells Supabase to send Content-Disposition: attachment
    const downloadUrl = url + (url.includes('?') ? '&' : '?') + 'download=';

    // 2. Create a hidden anchor element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename); // Suggest the filename

    // 3. target _self triggers the Android Download Manager
    link.target = '_self';

    // 4. Programmatically click the link
    document.body.appendChild(link);
    link.click();

    // 5. Cleanup
    document.body.removeChild(link);
}

function formatSize(bytes) {
    if (!bytes) return 'Document';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// ─── Load a root category from BOTH orgs and merge into one view ─────────────
async function loadCategory(root, title) {
    // Save category info for back navigation
    currentCategoryRoot = root;
    currentCategoryTitle = title;

    const container = document.getElementById('category-container');
    currentRootScope = root;

    // Show skeleton
    let skeletonHTML = '';
    for (let i = 0; i < 6; i++) {
        skeletonHTML += `<div class="liquid-card skeleton-card animate-pulse" style="opacity:1; animation-delay: ${i * 0.1}s">
            <div class="card-icon-wrap"></div>
            <div class="card-inner">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-desc"></div>
            </div>
            <div class="skeleton-action"></div>
        </div>`;
    }
    container.innerHTML = skeletonHTML;
    showPage('category');
    document.getElementById('category-page-title').innerText = title;
    document.getElementById('category-back-btn').onclick = () => showPage('home');
    lucide.createIcons();

    const orgs = [
        { url: SB_URL_ORG1, key: SB_KEY_ORG1, label: 'PORTFOLIO' },
        { url: SB_URL_ORG2, key: SB_KEY_ORG2, label: 'iBILIB' },
        { url: SB_URL_ORG3, key: SB_KEY_ORG3, label: 'ACTIVE' },
    ];

    try {
        const [org1Files, org2Files, org3Files] = await Promise.all([
            crawlAll(root, [], SB_URL_ORG1, SB_KEY_ORG1).catch(() => []),
            crawlAll(root, [], SB_URL_ORG2, SB_KEY_ORG2).catch(() => []),
            crawlAll(root, [], SB_URL_ORG3, SB_KEY_ORG3).catch(() => []),
        ]);

        const allDocs = [...org1Files, ...org2Files, ...org3Files];
        const folderMap = new Map();
        const rootDocs = [];

        allDocs.forEach(f => {
            const dirPath = f.fullPath.substring(0, f.fullPath.lastIndexOf('/'));
            if (dirPath === root || dirPath === root + '/') {
                rootDocs.push(f);
                return;
            }

            const relPath = dirPath.substring(root.length + 1);
            let name = relPath.replace(/\//g, ' › ');

            const key = dirPath + '::' + f.orgUrl;
            if (!folderMap.has(key)) {
                folderMap.set(key, {
                    name: name,
                    fullPath: dirPath,
                    orgUrl: f.orgUrl,
                    orgKey: f.orgKey
                });
            }
        });

        const merged = Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        container.innerHTML = '';

        if (merged.length > 0) {
            merged.forEach((f, i) => {
                let orgTag = '';
                const copies = merged.filter(x => x.name === f.name);
                if (copies.length > 1) {
                    if (f.orgUrl === SB_URL_ORG1) orgTag = ' <span style="font-size:10px;color:#a78bfa">[Portfolio]</span>';
                    else if (f.orgUrl === SB_URL_ORG2) orgTag = ' <span style="font-size:10px;color:#34d399">[iBilib]</span>';
                    else if (f.orgUrl === SB_URL_ORG3) orgTag = ' <span style="font-size:10px;color:#fbbf24">[Active]</span>';
                }
                const div = document.createElement('div');
                div.className = 'liquid-card animate-tile';
                div.style.animationDelay = `${i * 0.08}s`;
                div.onclick = () => smartNavigate(f.fullPath, f.name, f.orgUrl, f.orgKey);
                div.innerHTML = `
                    <div class="card-icon-wrap"><i data-lucide="folder"></i></div>
                    <div class="card-inner"><h3>${f.name}${orgTag}</h3><p>Document Folder</p></div>
                    <i data-lucide="arrow-right" class="card-arrow purple-text"></i>`;
                container.appendChild(div);
            });

            if (rootDocs.length > 0) {
                const div = document.createElement('div');
                div.className = 'liquid-card animate-tile';
                div.style.animationDelay = `${merged.length * 0.08}s`;
                div.onclick = () => smartNavigate(root, 'Root Documents', rootDocs[0].orgUrl, rootDocs[0].orgKey);
                div.innerHTML = `
                    <div class="card-icon-wrap"><i data-lucide="folder"></i></div>
                    <div class="card-inner"><h3>Root Documents</h3><p>Direct files in ${title}</p></div>
                    <i data-lucide="arrow-right" class="card-arrow purple-text"></i>`;
                container.appendChild(div);
            }
        } else {
            if (rootDocs.length > 0) {
                currentFiles = rootDocs;
                showPage('browser');
                document.getElementById('browser-title').innerText = title;
                renderFileObjects(currentFiles, document.getElementById('browser-container'));
                document.getElementById('browser-back-btn').onclick = () => {
                    if (currentCategoryRoot) {
                        loadCategory(currentCategoryRoot, currentCategoryTitle);
                    } else {
                        showPage('home');
                    }
                };
            } else {
                container.innerHTML = `<div class="liquid-card" style="opacity:1">
                    <div class="card-icon-wrap"><i data-lucide="inbox"></i></div>
                    <div class="card-inner"><h3>Empty</h3><p>No documents found in any archive</p></div>
                </div>`;
            }
        }

        lucide.createIcons();
    } catch (e) {
        container.innerHTML = `<div class="liquid-card" style="opacity:1">
            <div class="card-icon-wrap"><i data-lucide="wifi-off"></i></div>
            <div class="card-inner"><h3>Network Error</h3><p>Could not reach archive</p></div>
        </div>`;
        lucide.createIcons();
    }
}

function loadResearch() { loadCategory('research', 'Research Studies'); }
function loadMaterials() { loadCategory('materials', 'Learning Materials'); }
function loadPrompts() { loadCategory('prompts', 'Writing Prompts'); }

// ─── Theme toggle ──────────────────────────────
function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === 'light';

    if (isLight) {
        html.removeAttribute('data-theme');
        localStorage.setItem('ibiblib-theme', 'dark');
    } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('ibiblib-theme', 'light');
    }
}

function applyStoredTheme() {
    // data-theme already set by inline script in <head> before paint
    // Nothing extra needed — just make sure body class is clean
    document.body.classList.remove('light');
}

function openAdmin() {
    if (prompt("Admin Passkey:") === "Ibilibadminaccesskey") alert("✓ Authorized Access");
}

// ─── Init ──────────────────────────────────────────────────
window.onload = () => {
    // Block transitions during initial paint to prevent theme glitch
    document.body.classList.add('no-transition');
    applyStoredTheme();

    const intro = document.getElementById('intro-screen');
    if (intro) setTimeout(() => intro.remove(), 2300);
    showPage('home');
    loadGroqKeys();
    document.querySelectorAll('#home-page .liquid-card').forEach((card, i) => {
        card.classList.add('animate-tile');
        card.style.animationDelay = `${i * 0.15}s`;
    });
    lucide.createIcons();

    // Re-enable transitions after first paint is complete
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.body.classList.remove('no-transition');
        });
    });
};

// ═══════════════════════════════════════════════
//  ADMIN — LOGIN
// ═══════════════════════════════════════════════
const ADMIN_USER = 'root';
const ADMIN_PASS = 'Ibilibadminaccesskey';

function openAdmin() {
    // Close mobile menu if open
    document.getElementById('mobile-menu')?.classList.add('hidden');
    // Reset form
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    setLoginError(false);
    document.getElementById('admin-modal').classList.remove('hidden');
    lucide.createIcons();
    setTimeout(() => document.getElementById('login-user').focus(), 100);
}

function closeAdmin() {
    document.getElementById('admin-modal').classList.add('hidden');
}

function togglePass() {
    const inp = document.getElementById('login-pass');
    const icon = document.getElementById('pass-eye');
    if (inp.type === 'password') {
        inp.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        inp.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

function setLoginError(show, msg = 'Invalid username or password') {
    const el = document.getElementById('login-error');
    const txt = document.getElementById('login-error-msg');
    const fu = document.getElementById('field-username');
    const fp = document.getElementById('field-password');
    if (show) {
        txt.textContent = msg;
        el.classList.remove('hidden');
        fu.querySelector('.input-wrap').classList.add('error');
        fp.querySelector('.input-wrap').classList.add('error');
    } else {
        el.classList.add('hidden');
        fu.querySelector('.input-wrap')?.classList.remove('error');
        fp.querySelector('.input-wrap')?.classList.remove('error');
    }
}

function submitLogin(e) {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    const btn = document.getElementById('login-btn');

    if (!user || !pass) {
        setLoginError(true, 'Please fill in both fields');
        return;
    }

    // Animate button
    btn.innerHTML = '<span>Verifying…</span>';
    btn.disabled = true;

    setTimeout(() => {
        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            closeAdmin();
            openAdminPanel();
        } else {
            btn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right"></i>';
            btn.disabled = false;
            lucide.createIcons();
            setLoginError(true);
            // Shake the box
            const box = document.getElementById('admin-login-box');
            box.style.animation = 'none';
            requestAnimationFrame(() => { box.style.animation = ''; });
        }
    }, 600);
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('admin-modal').addEventListener('click', function (e) {
        if (e.target === this) closeAdmin();
    });
    document.getElementById('admin-panel').addEventListener('click', function (e) {
        if (e.target === this) closeAdminPanel();
    });
});

// ═══════════════════════════════════════════════
//  ADMIN — UPLOAD PANEL
// ═══════════════════════════════════════════════
let uploadQueue = [];   // { file, name }
let selectedCat = 'research';
const MAX_FILES = 10;

function openAdminPanel() {
    clearQueue();
    selectedCat = 'research';
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === 'research');
    });
    const subInput = document.getElementById('upload-subfolder');
    if (subInput) subInput.value = '';
    const newWrap = document.getElementById('new-folder-wrap');
    if (newWrap) newWrap.style.display = 'none';
    const newBtn = document.getElementById('subfolder-new-btn');
    if (newBtn) newBtn.classList.remove('active');
    document.getElementById('upload-progress-wrap').classList.add('hidden');
    document.getElementById('upload-toast').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    lucide.createIcons();
    loadSubfolders('research');
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
    clearQueue();
}

function selectCat(btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCat = btn.dataset.cat;
    loadSubfolders(selectedCat);
}

async function loadSubfolders(cat) {
    const select = document.getElementById('upload-subfolder-select');
    const hint = document.getElementById('subfolder-hint');
    if (!select) return;

    // Animate: loading state
    hint.textContent = '⏳ Loading…';
    hint.classList.remove('pulse');
    select.classList.add('loading');
    select.classList.remove('loaded');
    select.innerHTML = '<option value="">— Root (no subfolder) —</option>';

    const orgs = [
        { url: SB_URL_ORG1, key: SB_KEY_ORG1 },
        { url: SB_URL_ORG2, key: SB_KEY_ORG2 },
        { url: SB_URL_ORG3, key: SB_KEY_ORG3 },
    ];

    try {
        const rootResults = await Promise.all(
            orgs.map(org => listPath(cat, org.url, org.key).catch(() => []))
        );

        const folderSet = new Set();
        rootResults.forEach(items => {
            const arr = Array.isArray(items) ? items : [];
            arr.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder').forEach(f => {
                folderSet.add(f.name);
            });
        });

        const folders = Array.from(folderSet).sort();

        // Clear + rebuild options
        select.innerHTML = '<option value="">— Root (no subfolder) —</option>';

        if (folders.length === 0) {
            hint.textContent = 'No subfolders yet';
        } else {
            for (const f of folders) {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = '📁 ' + f;
                select.appendChild(opt);

                try {
                    const subResults = await Promise.all(
                        orgs.map(org => listPath(cat + '/' + f, org.url, org.key).catch(() => []))
                    );
                    const subFolderSet = new Set();
                    subResults.forEach(subItems => {
                        const arr = Array.isArray(subItems) ? subItems : [];
                        arr.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder').forEach(sf => {
                            subFolderSet.add(sf.name);
                        });
                    });

                    const subFolders = Array.from(subFolderSet).sort();
                    subFolders.forEach(sf => {
                        const subOpt = document.createElement('option');
                        subOpt.value = f + '/' + sf;
                        subOpt.textContent = '  └ 📁 ' + f + ' › ' + sf;
                        select.appendChild(subOpt);
                    });
                } catch (e) { }
            }
            hint.textContent = '✦ ' + folders.length + ' folder' + (folders.length > 1 ? 's' : '') + ' found';
        }

        // Animate in
        select.classList.remove('loading');
        select.classList.add('loaded');
        void select.offsetWidth; // force reflow
        hint.classList.add('pulse');
        setTimeout(() => hint.classList.remove('pulse'), 600);

    } catch (e) {
        hint.textContent = '⚠️ Could not load folders';
        select.classList.remove('loading');
    }
    lucide.createIcons();
}

function onSubfolderSelect(sel) {
    // If user picks from dropdown, clear the manual text input
    if (sel.value) {
        const input = document.getElementById('upload-subfolder');
        if (input) input.value = '';
        document.getElementById('new-folder-wrap').style.display = 'none';
        document.getElementById('subfolder-new-btn').classList.remove('active');
    }
}

function toggleNewFolder() {
    const wrap = document.getElementById('new-folder-wrap');
    const btn = document.getElementById('subfolder-new-btn');
    const sel = document.getElementById('upload-subfolder-select');
    const isHidden = wrap.style.display === 'none';
    wrap.style.display = isHidden ? 'flex' : 'none';
    btn.classList.toggle('active', isHidden);
    if (isHidden) {
        sel.value = ''; // deselect dropdown
        document.getElementById('upload-subfolder').focus();
    }
    lucide.createIcons();
}

// ── Drop zone ──────────────────────────────────
function dzOver(e) { e.preventDefault(); document.getElementById('dropzone').classList.add('over'); }
function dzLeave(e) { document.getElementById('dropzone').classList.remove('over'); }
function dzDrop(e) {
    e.preventDefault();
    document.getElementById('dropzone').classList.remove('over');
    addFiles(e.dataTransfer.files);
}

function addFiles(fileList) {
    const remaining = MAX_FILES - uploadQueue.length;
    if (remaining <= 0) { showToast('error', `Maximum ${MAX_FILES} files reached`); return; }

    let added = 0;
    Array.from(fileList).slice(0, remaining).forEach(file => {
        // Avoid duplicates by name
        if (!uploadQueue.find(q => q.name === file.name)) {
            uploadQueue.push({ file, name: file.name, status: 'pending' });
            added++;
        }
    });

    if (added < fileList.length && fileList.length > remaining) {
        showToast('error', `Only ${remaining} slot${remaining !== 1 ? 's' : ''} remaining — added ${added} file${added !== 1 ? 's' : ''}`);
    }

    renderQueue();
    // Reset file input so same file can be re-added after remove
    document.getElementById('file-input').value = '';
}

function removeFile(idx) {
    uploadQueue.splice(idx, 1);
    renderQueue();
}

function clearQueue() {
    uploadQueue = [];
    renderQueue();
}

function renderQueue() {
    const wrap = document.getElementById('file-queue');
    const list = document.getElementById('queue-list');
    const count = document.getElementById('queue-count');
    const btn = document.getElementById('upload-btn');

    if (uploadQueue.length === 0) {
        wrap.classList.add('hidden');
        btn.disabled = true;
        return;
    }

    wrap.classList.remove('hidden');
    count.textContent = `${uploadQueue.length} / ${MAX_FILES} file${uploadQueue.length !== 1 ? 's' : ''}`;
    btn.disabled = false;

    list.innerHTML = '';
    uploadQueue.forEach((item, idx) => {
        const statusClass = item.status === 'done' ? 'done' : item.status === 'failed' ? 'failed' : item.status === 'uploading' ? 'uploading' : '';
        const iconName = item.status === 'done' ? 'check' : item.status === 'failed' ? 'x' : 'file-text';
        const div = document.createElement('div');
        div.className = `queue-item ${statusClass}`;
        div.innerHTML = `
            <div class="queue-item-icon"><i data-lucide="${iconName}"></i></div>
            <div class="queue-item-info">
                <div class="queue-item-name">${item.name.replace(/_/g, ' ')}</div>
                <div class="queue-item-size">${formatSize(item.file.size)}</div>
            </div>
            ${item.status === 'pending' ? `<button class="queue-item-remove" onclick="removeFile(${idx})"><i data-lucide="x"></i></button>` : ''}`;
        list.appendChild(div);
    });
    lucide.createIcons();
}

// ── Upload ─────────────────────────────────────
async function startUpload() {
    if (uploadQueue.length === 0) return;

    // Get subfolder: prefer new-folder input if visible, else dropdown
    const newFolderWrap = document.getElementById('new-folder-wrap');
    const newFolderInput = document.getElementById('upload-subfolder');
    const subSelect = document.getElementById('upload-subfolder-select');
    let subfolder = '';
    if (newFolderWrap && newFolderWrap.style.display !== 'none' && newFolderInput && newFolderInput.value.trim()) {
        subfolder = newFolderInput.value.trim().replace(/\//g, '-');
    } else if (subSelect && subSelect.value) {
        subfolder = subSelect.value;
    }
    const basePath = subfolder ? `${selectedCat}/${subfolder}` : selectedCat;

    const btn = document.getElementById('upload-btn');
    const progWrap = document.getElementById('upload-progress-wrap');
    const fill = document.getElementById('progress-fill');
    const pct = document.getElementById('progress-pct');
    const label = document.getElementById('progress-label-text');

    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader"></i><span>Uploading…</span>';
    progWrap.classList.remove('hidden');
    document.getElementById('upload-toast').classList.add('hidden');
    lucide.createIcons();

    let done = 0, failed = 0;

    for (let i = 0; i < uploadQueue.length; i++) {
        const item = uploadQueue[i];
        item.status = 'uploading';
        renderQueue();
        label.textContent = `Uploading ${i + 1} of ${uploadQueue.length}…`;

        try {
            const res = await fetch(
                `${SB_URL}/storage/v1/object/archives/${basePath}/${item.name}`,
                {
                    method: 'POST',
                    headers: {
                        'apikey': SB_KEY,
                        'Authorization': `Bearer ${SB_KEY}`,
                        'Content-Type': item.file.type || 'application/octet-stream',
                        'x-upsert': 'true'
                    },
                    body: item.file
                }
            );

            if (res.ok || res.status === 200 || res.status === 201) {
                item.status = 'done'; done++;
            } else {
                const err = await res.json().catch(() => ({}));
                item.status = 'failed'; failed++;
                console.error('Upload failed:', err);
            }
        } catch (e) {
            item.status = 'failed'; failed++;
            console.error('Upload error:', e);
        }

        const progress = Math.round(((i + 1) / uploadQueue.length) * 100);
        fill.style.width = progress + '%';
        pct.textContent = progress + '%';
        renderQueue();
    }

    label.textContent = 'Complete';
    btn.innerHTML = '<i data-lucide="check"></i><span>Done</span>';
    lucide.createIcons();

    if (failed === 0) {
        showToast('success', `✓ ${done} file${done !== 1 ? 's' : ''} uploaded successfully to ${basePath}`);
    } else {
        showToast('error', `${done} uploaded, ${failed} failed. Check your connection.`);
    }

    // Re-enable after delay
    setTimeout(() => {
        btn.innerHTML = '<i data-lucide="upload-cloud"></i><span>Upload More</span>';
        btn.disabled = uploadQueue.filter(q => q.status === 'pending').length === 0;
        lucide.createIcons();
    }, 1500);
}

function showToast(type, msg) {
    const toast = document.getElementById('upload-toast');
    toast.className = `upload-toast ${type}`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i><span>${msg}</span>`;
    toast.classList.remove('hidden');
    lucide.createIcons();
}
/* =============================================
   BILIBOT AI CHAT
   ============================================= */

// ── Groq config ─────────────────────────────────────────────
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

let groqKeyPool = [];
let groqActiveKey = null;

async function loadGroqKeys() {
    try {
        const res = await fetch(
            `${SB_URL_ORG3}/rest/v1/groq_keys?is_invalid=eq.false&select=id,key&order=id.asc`,
            { headers: { 'apikey': SB_KEY_ORG3, 'Authorization': `Bearer ${SB_KEY_ORG3}` } }
        );
        if (!res.ok) throw new Error('Supabase fetch failed: ' + res.status);
        const rows = await res.json();
        groqKeyPool = Array.isArray(rows) ? rows : [];
        groqActiveKey = groqKeyPool.length > 0 ? groqKeyPool[0].key : null;
        console.log(`[BILIBot] ${groqKeyPool.length} Groq key(s) loaded.`);
    } catch (e) {
        console.warn('[BILIBot] Could not load Groq keys:', e);
        groqActiveKey = null;
    }
}

async function trashGroqKey(keyString) {
    const entry = groqKeyPool.find(k => k.key === keyString);
    if (entry) {
        try {
            await fetch(`${SB_URL_ORG3}/rest/v1/groq_keys?id=eq.${entry.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SB_KEY_ORG3,
                    'Authorization': `Bearer ${SB_KEY_ORG3}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ is_invalid: true, trashed_at: new Date().toISOString() })
            });
            console.warn('[BILIBot] Trashed invalid key id:', entry.id);
        } catch (e) { console.warn('[BILIBot] Could not trash key:', e); }
    }
    groqKeyPool = groqKeyPool.filter(k => k.key !== keyString);
    groqActiveKey = groqKeyPool.length > 0 ? groqKeyPool[0].key : null;
}

async function groqFetch(body) {
    if (!groqActiveKey) await loadGroqKeys();
    if (!groqActiveKey) throw new Error('NO_KEYS');
    for (let attempt = 0; attempt < groqKeyPool.length + 1; attempt++) {
        if (!groqActiveKey) break;
        const currentKey = groqActiveKey;
        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + currentKey },
            body: JSON.stringify(body)
        });
        if (res.status === 401) {
            console.warn('[BILIBot] 401 — trashing key and rotating…');
            await trashGroqKey(currentKey);
            continue;
        }
        return res;
    }
    throw new Error('ALL_KEYS_INVALID');
}
// ──────────────────────────────────────────────────────────

let biliBotOpen = false;
let biliBotHistory = [];
let biliBotFiles = []; // stores {name, content} up to 3
let biliBotMode = 'fast'; // 'fast' or 'deep' — default fast

function setBiliBotMode(mode) {
    biliBotMode = mode;
    document.getElementById('mode-fast').classList.toggle('active', mode === 'fast');
    document.getElementById('mode-deep').classList.toggle('active', mode === 'deep');
    const label = mode === 'fast' ? '⚡ Fast mode — quick answers!' : '🧠 Deep mode — careful thinking!';
    appendMessage('bot', label);
}

// ─── BILIBot: crawl archive for keyword matches ────────────
// Searches across both Org 1 and Org 2 and merges the results.
async function biliBotSearchArchive(keywords, roots) {
    if (!roots) roots = ['research', 'materials', 'prompts'];

    // Normalize keywords: lowercase, trim, also split multi-word into individual words
    // so "solar energy" matches files containing "solar" OR "energy" OR "solar energy"
    const rawQs = (Array.isArray(keywords) ? keywords : [keywords])
        .map(k => k.toLowerCase().trim()).filter(Boolean);
    const qs = [...new Set([
        ...rawQs,
        ...rawQs.flatMap(q => q.split(/[\s_\-]+/)).filter(w => w.length > 2)
    ])];

    // Helper: normalize a filename for matching — underscores/hyphens/dots → spaces
    const normalize = str => str.toLowerCase().replace(/[_\-\.]+/g, ' ');

    // Fuzzy match: returns true if query is "close enough" to any word in the target
    // Uses Levenshtein distance — tolerates 1 typo for short words, 2 for longer ones
    const fuzzyMatch = (query, target) => {
        // First try exact substring (fast path)
        if (target.includes(query)) return true;
        // Split target into individual words and check each
        const targetWords = target.split(' ').filter(w => w.length > 2);
        for (const word of targetWords) {
            if (Math.abs(word.length - query.length) > 2) continue; // skip if too different in length
            const maxDist = query.length <= 4 ? 1 : 2; // allow 1 typo for short, 2 for long
            if (levenshtein(query, word) <= maxDist) return true;
        }
        return false;
    };

    // Levenshtein distance (edit distance between two strings)
    const levenshtein = (a, b) => {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
        for (let j = 0; j <= n; j++) dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                dp[i][j] = a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
        return dp[m][n];
    };

    const seen = new Set();
    const results = [];
    let crawlError = null;

    // Search ALL three orgs — Org 1, 2 (read), and Org 3 (admin uploads)
    const orgs = [
        { url: SB_URL_ORG1, key: SB_KEY_ORG1 },
        { url: SB_URL_ORG2, key: SB_KEY_ORG2 },
        { url: SB_URL_ORG3, key: SB_KEY_ORG3 },
    ];

    await Promise.all(orgs.flatMap(org =>
        roots.map(async root => {
            try {
                const all = await crawlAll(root, [], org.url, org.key);
                console.log('[BILIBot] crawled', root, '(org:', org.url.split('.')[0].split('//')[1], ') →', all.length, 'files');
                all.forEach(f => {
                    // Only match against the file TITLE/NAME — not folder path
                    const normName = normalize(f.name);
                    const uniqueKey = `${org.url}::${f.fullPath}`;
                    const isMatch = qs.some(q => fuzzyMatch(q, normName));
                    if (isMatch && !seen.has(uniqueKey)) {
                        seen.add(uniqueKey);
                        results.push({ ...f, orgUrl: org.url, orgKey: org.key });
                    }
                });
            } catch (e) {
                crawlError = e;
                console.error('[BILIBot] crawl error for', root, 'org:', org.url, e);
            }
        })
    ));

    console.log('[BILIBot] search results:', results.length, 'for keywords:', qs);

    // Fallback: folder-level search across all three orgs
    if (results.length === 0 && !crawlError) {
        await Promise.all(orgs.flatMap(org =>
            roots.map(async root => {
                try {
                    const items = await listPath(root, org.url, org.key);
                    if (!Array.isArray(items)) return;
                    items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder').forEach(folder => {
                        const normName = normalize(folder.name);
                        const uniqueKey = `${org.url}::${root}/${folder.name}/_folder_`;
                        if (qs.some(q => fuzzyMatch(q, normName)) && !seen.has(uniqueKey)) {
                            seen.add(uniqueKey);
                            results.push({ name: folder.name, fullPath: root + '/' + folder.name + '/_folder_', size: 0, orgUrl: org.url, orgKey: org.key });
                        }
                    });
                } catch (e) { }
            })
        ));
        console.log('[BILIBot] folder-level results:', results.length);
    }

    return results;
}

// ─── BILIBot nav card click handler (global scope) ────────
window.biliBotNavGo = function (folder, title, orgUrl, orgKey) {
    smartNavigate(folder, title, orgUrl || SB_URL_ORG1, orgKey || SB_KEY_ORG1);
    if (biliBotOpen) toggleBiliBot();
};

window.biliBotGoToFile = async function (folder, title, filename, orgUrl, orgKey) {
    if (biliBotOpen) toggleBiliBot();

    const resolvedUrl = orgUrl || SB_URL_ORG1;
    const resolvedKey = orgKey || SB_KEY_ORG1;

    // Show browser page immediately with skeleton while loading
    const browserContainer = document.getElementById('browser-container');
    let skeletonHTML = '';
    for (let i = 0; i < 6; i++) {
        skeletonHTML += `<div class="liquid-card skeleton-card animate-pulse" style="opacity:1;animation-delay:${i * 0.1}s">
            <div class="card-icon-wrap"></div>
            <div class="card-inner">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-desc"></div>
            </div>
            <div class="skeleton-action"></div>
        </div>`;
    }
    browserContainer.innerHTML = skeletonHTML;
    showPage('browser');
    document.getElementById('browser-title').innerText = title;
    document.getElementById('browser-back-btn').onclick = () => handleBack(folder, resolvedUrl, resolvedKey);
    lucide.createIcons();

    try {
        // Fetch the folder's files directly — no intermediate category page
        const items = await listPath(folder, resolvedUrl, resolvedKey);
        currentFiles = items
            .filter(i => i.id && i.name !== '.emptyFolderPlaceholder' && i.name.match(/\.(pdf|doc|docx)$/i))
            .map(f => ({
                name: f.name,
                fullPath: `${folder}/${f.name}`,
                size: f.metadata?.size,
                orgUrl: resolvedUrl,
                orgKey: resolvedKey
            }));
        currentPath = folder;
        currentRootScope = folder.split('/')[0];

        // Set scroll target BEFORE rendering so renderFileObjects picks it up
        window._biliBotScrollTarget = filename;
        renderFileObjects(currentFiles, browserContainer);
        document.getElementById('browser-back-btn').onclick = () => handleBack(folder, resolvedUrl, resolvedKey);
        // DO NOT call lucide.createIcons() again — renderFileObjects already does it
        // and a second call resets the DOM, breaking the scroll target
    } catch (e) {
        browserContainer.innerHTML = `<div class="liquid-card" style="opacity:1">
            <div class="card-icon-wrap"><i data-lucide="wifi-off"></i></div>
            <div class="card-inner"><h3>Network Error</h3><p>Could not reach archive</p></div>
        </div>`;
        lucide.createIcons();
    }
};

// ─── BILIBot: render nav result cards in chat ─────────────
function appendNavResults(matches, queryLabel) {
    const container = document.getElementById('bilibot-messages');
    const wrap = document.createElement('div');
    wrap.className = 'bilibot-msg bot';

    const avatar = document.createElement('div');
    avatar.className = 'bilibot-msg-avatar';
    avatar.innerHTML = `<img src="/ibilib-teacher/image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`;
    wrap.appendChild(avatar);

    const bubble = document.createElement('div');
    bubble.className = 'bilibot-bubble';
    bubble.style.cssText = 'max-width:100%;padding:10px 12px';

    if (matches.length === 0) {
        bubble.innerHTML = `I searched the archive for <strong>${queryLabel}</strong> but couldn't find anything. Try browsing manually using the menu above! 🔍`;
    } else {
        // Group by folder — treat _folder_ sentinel as folder-only result
        const grouped = {};
        matches.forEach(f => {
            const isFolder = f.fullPath.endsWith('/_folder_');
            const folder = isFolder
                ? f.fullPath.replace('/_folder_', '')
                : f.fullPath.split('/').slice(0, -1).join('/');
            if (!grouped[folder]) grouped[folder] = { files: [], isFolder };
            if (!isFolder) grouped[folder].files.push(f);
        });

        const total = Object.keys(grouped).length;
        const header = document.createElement('div');
        header.style.cssText = 'margin-bottom:10px;font-size:13px';
        header.innerHTML = `Found <strong>${total}</strong> location${total > 1 ? 's' : ''} for <strong>"${queryLabel}"</strong>:`;
        bubble.appendChild(header);

        const cardsWrap = document.createElement('div');
        cardsWrap.className = 'bilibot-nav-cards';

        Object.entries(grouped).slice(0, 5).forEach(([folder, data]) => {
            const parts = folder.split('/');
            const root = parts[0];
            const folderName = parts[parts.length - 1];
            const subFolder = parts.slice(1).join(' › ') || root;
            const rootIcon = root === 'research' ? '📚' : root === 'materials' ? '📋' : '✏️';
            const rootLabel = root === 'research' ? 'Research' : root === 'materials' ? 'Materials' : 'Prompts';
            const fileCount = data.files.length;

            const repFile = data.files[0] || {};
            const card = document.createElement('div');
            card.className = 'bilibot-nav-card';

            let filesHTML = '';
            if (fileCount > 0) {
                filesHTML = data.files.slice(0, 3).map(f => {
                    const fname = f.fullPath.split('/').pop();
                    const sf = folder.replace(/'/g, "\'");
                    const sfn = folderName.replace(/'/g, "\'");
                    const sfname = fname.replace(/'/g, "\'");
                    const sou = (f.orgUrl || '').replace(/'/g, "\'");
                    const sok = (f.orgKey || '').replace(/'/g, "\'");
                    return `<div class="bilibot-nav-file-row">
                        <span class="bilibot-nav-file-name">${fname.replace(/_/g, ' ')}</span>
                        <button class="bilibot-go-btn" onclick="event.stopPropagation();window.biliBotGoToFile('${sf}','${sfn}','${sfname}','${sou}','${sok}')">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> Go
                        </button>
                    </div>`;
                }).join('') + (fileCount > 3 ? `<div class="bilibot-nav-file-row"><span>+${fileCount - 3} more</span></div>` : '');
            } else {
                filesHTML = `<span>📂 Open folder</span>`;
            }

            card.innerHTML = `
                <div class="bilibot-nav-card-top">
                    <span class="bilibot-nav-root">${rootIcon} ${rootLabel}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
                <div class="bilibot-nav-folder">📁 ${subFolder}</div>
                <div class="bilibot-nav-files">${filesHTML}</div>`;

            card.addEventListener('click', () => window.biliBotNavGo(folder, folderName, repFile.orgUrl, repFile.orgKey));
            cardsWrap.appendChild(card);
        });

        bubble.appendChild(cardsWrap);

        const hint = document.createElement('div');
        hint.style.cssText = 'font-size:11px;color:#a78bfa;margin-top:8px';
        hint.textContent = 'Tap a card to go there 👆';
        bubble.appendChild(hint);
    }

    wrap.appendChild(bubble);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
}

// ─── BILIBot: render clarification question with pick buttons ─
function appendClarification(question, options) {
    const container = document.getElementById('bilibot-messages');
    const wrap = document.createElement('div');
    wrap.className = 'bilibot-msg bot';

    const avatar = document.createElement('div');
    avatar.className = 'bilibot-msg-avatar';
    avatar.innerHTML = `<img src="/ibilib-teacher/image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`;
    wrap.appendChild(avatar);

    const bubble = document.createElement('div');
    bubble.className = 'bilibot-clarify-bubble';

    const q = document.createElement('div');
    q.className = 'bilibot-clarify-question';
    q.textContent = question;
    bubble.appendChild(q);

    const optWrap = document.createElement('div');
    optWrap.className = 'bilibot-clarify-options';
    options.forEach(function (opt) {
        const btn = document.createElement('button');
        btn.className = 'bilibot-clarify-btn';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
            // Disable all options in this set
            optWrap.querySelectorAll('.bilibot-clarify-btn').forEach(function (b) { b.disabled = true; b.style.opacity = '0.5'; });
            btn.style.opacity = '1';
            btn.style.background = 'linear-gradient(135deg,#7c3aed,#a855f7)';
            btn.style.color = 'white';
            btn.style.borderColor = 'transparent';
            // Send the chosen option as the next message
            document.getElementById('bilibot-input').value = opt;
            sendBiliBot();
        });
        optWrap.appendChild(btn);
    });
    bubble.appendChild(optWrap);
    wrap.appendChild(bubble);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
}

function toggleBiliBot() {
    biliBotOpen = !biliBotOpen;
    const panel = document.getElementById('bilibot-panel');
    const fab = document.getElementById('bilibot-fab');
    const notif = document.getElementById('bilibot-notif');

    if (biliBotOpen) {
        panel.classList.remove('hidden');
        fab.classList.add('open');
        notif.classList.add('hidden');
        setTimeout(() => document.getElementById('bilibot-input').focus(), 200);
    } else {
        panel.classList.add('hidden');
        fab.classList.remove('open');
    }
}

function sendSuggestion(btn) {
    const text = btn.textContent;
    document.getElementById('bilibot-suggestions').style.display = 'none';
    document.getElementById('bilibot-input').value = text;
    sendBiliBot();
}

// ── Find-in-library quick bar ────────────────────────────
// Appended after every bot reply so the user can always search fast
function showFindBar() {
    const container = document.getElementById('bilibot-messages');
    // Remove any existing find bars first so there's only ever one at the bottom
    container.querySelectorAll('.bilibot-find-bar').forEach(el => el.remove());

    const bar = document.createElement('div');
    bar.className = 'bilibot-find-bar';
    bar.innerHTML = `
        <span class="bilibot-find-label">🔍 Find in library:</span>
        <div class="bilibot-find-row">
            <input class="bilibot-find-input" type="text" placeholder='e.g. "bangus study"' autocomplete="off" spellcheck="false">
            <button class="bilibot-find-btn">Search</button>
        </div>
        <div class="bilibot-find-chips">
            <button onclick="biliBotQuickFind(this)" data-q="research">📚 Research</button>
            <button onclick="biliBotQuickFind(this)" data-q="materials">📖 Materials</button>
            <button onclick="biliBotQuickFind(this)" data-q="prompts">✏️ Prompts</button>
        </div>`;

    // Wire up the search input + button
    const inp = bar.querySelector('.bilibot-find-input');
    const btn = bar.querySelector('.bilibot-find-btn');
    const doSearch = () => {
        const q = inp.value.trim();
        if (!q) return;
        inp.value = '';
        document.getElementById('bilibot-input').value = 'find "' + q + '"';
        sendBiliBot();
    };
    btn.addEventListener('click', doSearch);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

    container.appendChild(bar);
    container.scrollTop = container.scrollHeight;
}

function biliBotQuickFind(btn) {
    const q = btn.dataset.q;
    document.getElementById('bilibot-input').value = 'find "' + q + '"';
    sendBiliBot();
}

function appendMessage(role, text) {
    const container = document.getElementById('bilibot-messages');
    const div = document.createElement('div');
    div.className = `bilibot-msg ${role}`;

    if (role === 'bot') {
        div.innerHTML = `
            <div class="bilibot-msg-avatar">
                <img src="/ibilib-teacher/image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">
            </div>
            <div class="bilibot-bubble">${text}</div>`;
    } else {
        div.innerHTML = `<div class="bilibot-bubble">${text}</div>`;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
}

function showTyping() {
    const container = document.getElementById('bilibot-messages');
    const div = document.createElement('div');
    div.className = 'bilibot-msg bot bilibot-typing';
    div.id = 'bilibot-typing';
    div.innerHTML = `
        <div class="bilibot-msg-avatar">
            <img src="/ibilib-teacher/image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">
        </div>
        <div class="bilibot-bubble">
            <div class="bilibot-thinking-label">BILIBot is thinking…</div>
            <div class="bilibot-thinking-bar-wrap">
                <div class="bilibot-thinking-bar"></div>
            </div>
            <div class="bilibot-thinking-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('bilibot-typing');
    if (el) el.remove();
}

function biliBotPickFiles() {
    if (biliBotFiles.length >= 3) {
        alert('Maximum 3 files allowed. Remove a file first.');
        return;
    }
    document.getElementById('bilibot-file-input').click();
}

function biliBotHandleFiles(filesInput) {
    Array.from(filesInput).forEach(file => {
        if (biliBotFiles.length >= 3) return;
        const isDocx = file.name.endsWith('.docx') ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        if (isDocx) {
            // Use mammoth.js to extract text from DOCX
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    biliBotFiles.push({ name: file.name, content: result.value });
                    renderBiliBotFilePills();
                } catch (err) {
                    alert('Could not read ' + file.name + '. Make sure it is a valid .docx file.');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            // Plain text, CSV, HTML, MD etc.
            const reader = new FileReader();
            reader.onload = (e) => {
                biliBotFiles.push({ name: file.name, content: e.target.result });
                renderBiliBotFilePills();
            };
            reader.readAsText(file);
        }
    });
    document.getElementById('bilibot-file-input').value = '';
}

function removeBiliBotFile(idx) {
    biliBotFiles.splice(idx, 1);
    renderBiliBotFilePills();
}

function renderBiliBotFilePills() {
    const wrap = document.getElementById('bilibot-file-pills');
    const btn = document.getElementById('bilibot-attach-btn');
    if (!biliBotFiles.length) {
        wrap.innerHTML = '';
        wrap.classList.add('hidden');
        btn.style.opacity = '1';
        return;
    }
    wrap.classList.remove('hidden');
    btn.style.opacity = biliBotFiles.length >= 3 ? '0.4' : '1';
    wrap.innerHTML = biliBotFiles.map((f, i) => `
        <div class="bilibot-file-pill">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>${f.name.length > 18 ? f.name.slice(0, 15) + '...' : f.name}</span>
            <button onclick="removeBiliBotFile(${i})">×</button>
        </div>`).join('');
}

async function sendBiliBot() {
    const input = document.getElementById('bilibot-input');
    const sendBtn = document.getElementById('bilibot-send-btn');
    const text = input.value.trim();
    if (!text && biliBotFiles.length === 0) return;

    // ── Fast-find shortcut: find "topic" or find topic ──────
    const findMatch = text.match(/^find\s+"([^"]+)"/i) || text.match(/^find\s+(.+)/i);
    if (findMatch) {
        const topic = findMatch[1].trim();
        // Pass the whole phrase AND individual words so partial matches work
        const topicWords = topic.split(/[\s_\-]+/).filter(w => w.length > 2);
        const searchTerms = [topic, ...topicWords];
        input.value = '';
        appendMessage('user', text.replace(/</g, '&lt;'));
        showTyping();
        setTimeout(async () => {
            hideTyping();
            appendMessage('bot', '🔍 Searching the library for <strong>"' + topic + '"</strong>…');
            const matches = await biliBotSearchArchive(searchTerms, ['research']);
            appendNavResults(matches, topic);
            showFindBar();
        }, 400);
        return;
    }
    // ────────────────────────────────────────────────────────

    const userText = text || '(See attached files)';
    input.value = '';
    input.disabled = true;
    sendBtn.disabled = true;

    // Build display message with file names
    let displayMsg = text ? text.replace(/</g, '&lt;') : '';
    if (biliBotFiles.length > 0) {
        const fileNames = biliBotFiles.map(f =>
            `<span class="bilibot-file-pill-msg"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${f.name}</span>`
        ).join('');
        displayMsg += (displayMsg ? '<br>' : '') + fileNames;
    }
    appendMessage('user', displayMsg);

    // Build content with file text appended
    let fullContent = userText;
    if (biliBotFiles.length > 0) {
        const fileDump = biliBotFiles.map(f =>
            `\n\n--- File: ${f.name} ---\n${f.content.slice(0, 3000)}${f.content.length > 3000 ? '\n[truncated...]' : ''}`
        ).join('');
        fullContent += fileDump;
    }

    biliBotHistory.push({ role: 'user', content: fullContent });

    // Clear files after send
    biliBotFiles = [];
    renderBiliBotFilePills();

    // ── Client-side vague detector (instant clarification) ──
    const vaguePatterns = [
        { pattern: /^help me in research$/i, q: "What kind of research help do you need?", opts: ["Find a research file", "Help me write a research", "Explain a research topic", "Review my research"] },
        { pattern: /^help me( with)? research$/i, q: "What kind of research help do you need?", opts: ["Find a research file", "Help me write a research", "Explain a research topic", "Review my research"] },
        { pattern: /^(help me|i need help|help)$/i, q: "What can I help you with today?", opts: ["Find a file in the archive", "Help with research", "Help with writing prompts", "Study tips"] },
        { pattern: /^(i need|show me|find) materials?$/i, q: "What subject are the materials for?", opts: ["Science", "English", "Math", "Other subject"] },
        { pattern: /^(i need|show me|find) prompts?$/i, q: "What type of writing prompt?", opts: ["Narrative", "Persuasive", "Descriptive", "Expository"] },
        { pattern: /^(i need help|help me) (study|studying)$/i, q: "What subject do you need help studying?", opts: ["Science", "English", "Math", "Filipino"] },
    ];

    const vagueFull = [
        "help me", "i need help", "help", "help me please",
        "i need something", "find something", "show me something"
    ];

    const lowerUser = userText.toLowerCase().trim();
    const vagueMatch = vaguePatterns.find(function (v) { return v.pattern.test(lowerUser); });
    const isVague = vagueMatch || vagueFull.includes(lowerUser);

    if (isVague) {
        const q = vagueMatch ? vagueMatch.q : "What can I help you with today?";
        const opts = vagueMatch ? vagueMatch.opts : ["Find a file in the archive", "Help with research", "Help with writing", "Study tips"];
        appendClarification(q, opts);
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
        return;
    }
    // ── End vague detector ────────────────────────────────

    showTyping();

    // ── Detect archive navigation intent ──────────────────
    const lowerText = fullContent.toLowerCase();

    // 1a. "What's available?" — show real examples from archive
    const availablePatterns = [
        { regex: / (what|show|list|give|any).{0,25}(available|examples?|list).{0,20}research /i, root: 'research', title: 'Research Studies', icon: '📚' },
        { regex: / what.{0,20}research.{0,25}(available|there|have|exist) /i, root: 'research', title: 'Research Studies', icon: '📚' },
        { regex: / (what|show|list|give|any).{0,25}(available|examples?|list).{0,20}(material|module) /i, root: 'materials', title: 'Learning Materials', icon: '📋' },
        { regex: / (what|show|list|give|any).{0,25}(available|examples?|list).{0,20}prompt /i, root: 'prompts', title: 'Writing Prompts', icon: '✏️' },
        { regex: / what.{0,20}(material|module).{0,25}(available|there|have) /i, root: 'materials', title: 'Learning Materials', icon: '📋' },
        { regex: / what.{0,20}prompt.{0,25}(available|there|have) /i, root: 'prompts', title: 'Writing Prompts', icon: '✏️' },
        // bare "what are available" / "what are the available" without category = default to research
        { regex: / what.{0,10}are.{0,10}(the\s+)?available /i, root: 'research', title: 'Research Studies', icon: '📚' },
        { regex: / what.{0,10}(files?|docs?|documents?).{0,10}(are\s+)?(available|there) /i, root: 'research', title: 'Research Studies', icon: '📚' },
    ];

    const availableMatch = availablePatterns.find(function (p) { return p.regex.test(lowerText); });

    if (availableMatch) {
        hideTyping();
        appendMessage('bot', availableMatch.icon + ' Let me grab some examples from <strong>' + availableMatch.title + '</strong>…');
        try {
            const items = await listPath(availableMatch.root);
            const folders = Array.isArray(items) ? items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder') : [];
            const files = Array.isArray(items) ? items.filter(i => i.id && i.name !== '.emptyFolderPlaceholder' && i.name.match(/\.(pdf|doc|docx)$/i)) : [];

            // Build sample list — show up to 6 folders or files
            const samples = folders.length > 0 ? folders : files;
            const preview = samples.slice(0, 6);

            const container2 = document.getElementById('bilibot-messages');
            const wrap2 = document.createElement('div');
            wrap2.className = 'bilibot-msg bot';

            const av2 = document.createElement('div');
            av2.className = 'bilibot-msg-avatar';
            av2.innerHTML = '<img src="/ibilib-teacher/image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
            wrap2.appendChild(av2);

            const bub2 = document.createElement('div');
            bub2.className = 'bilibot-bubble';
            bub2.style.cssText = 'max-width:100%;padding:10px 14px';

            if (preview.length === 0) {
                bub2.innerHTML = 'The <strong>' + availableMatch.title + '</strong> archive appears to be empty right now. Check back later!';
            } else {
                const isFolder = folders.length > 0;
                let html = 'Here are some ' + (isFolder ? 'folders' : 'files') + ' in <strong>' + availableMatch.title + '</strong>:<br><br>';
                html += '<div class="bilibot-nav-cards">';
                preview.forEach(function (item) {
                    const navPath = availableMatch.root + '/' + item.name;
                    const card = document.createElement('div'); // temp — build via string then attach listener
                    html += '<div class="bilibot-sample-card" data-path="' + navPath + '" data-name="' + item.name + '">' +
                        (isFolder ? '📁' : '📄') + ' ' + item.name +
                        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="margin-left:auto;flex-shrink:0"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
                        '</div>';
                });
                html += '</div>';
                if (samples.length > 6) html += '<div style="font-size:11px;color:#a78bfa;margin-top:8px">+ ' + (samples.length - 6) + ' more — browse all in the menu</div>';
                html += '<div style="font-size:11px;color:#a78bfa;margin-top:6px">Tap any to open it 👆</div>';
                bub2.innerHTML = html;

                // Attach click listeners after innerHTML
                bub2.querySelectorAll('.bilibot-sample-card').forEach(function (card) {
                    card.addEventListener('click', function () {
                        window.biliBotNavGo(card.dataset.path, card.dataset.name);
                    });
                });
            }

            wrap2.appendChild(bub2);
            container2.appendChild(wrap2);
            container2.scrollTop = container2.scrollHeight;
        } catch (e) {
            appendMessage('bot', '⚠️ Could not load archive examples. Try browsing using the menu above!');
        }
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
        return;
    }

    // 1b. Direct category routing — if user mentions only a category keyword, go straight there
    const categoryRoutes = [
        { patterns: ['research studies', 'research study', 'show research', 'open research', 'go to research', 'what research', 'research topics', 'research available', 'research folder'], root: 'research', title: 'Research Studies', icon: '📚' },
        { patterns: ['learning material', 'learning module', 'show materials', 'open materials', 'go to materials', 'study material', 'modules available', 'show modules', 'materials available'], root: 'materials', title: 'Learning Materials', icon: '📋' },
        { patterns: ['writing prompt', 'show prompts', 'open prompts', 'go to prompts', 'prompts available', 'writing tasks', 'essay prompt'], root: 'prompts', title: 'Writing Prompts', icon: '✏️' },
    ];

    const matchedRoute = categoryRoutes.find(function (r) {
        return r.patterns.some(function (p) { return lowerText.includes(p); });
    });

    if (matchedRoute) {
        hideTyping();
        appendMessage('bot', matchedRoute.icon + ' Taking you to <strong>' + matchedRoute.title + '</strong>…');
        setTimeout(function () {
            window.biliBotNavGo(matchedRoute.root, matchedRoute.title);
        }, 600);
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
        return;
    }

    // 2. Topic search — only trigger if there's an actual topic keyword beyond just category words
    const navTriggers = ['find', 'search', 'look for', 'where is', 'show me', 'locate', 'navigate to',
        'looking for', 'do you have', 'capstone', 'thesis', 'study about', 'module about',
        'research about', 'materials about', 'prompts about', 'about'];
    const isNavIntent = navTriggers.some(t => lowerText.includes(t));

    // BILIBot only navigates Research Studies
    const searchRoots = ['research'];




    if (isNavIntent) {
        try {
            const kwRes = await groqFetch({
                model: GROQ_MODEL,
                max_tokens: 80,
                messages: [{
                    role: 'user',
                    content: 'Extract the specific topic the user wants to find in a school archive. Include scientific/alternate names (e.g. "bangus" → ["bangus","milkfish"]). Reply ONLY as a JSON array of strings, max 4 items. The topic must be a real subject — NOT generic words like "research", "materials", "file", "topic", "something", "available". If no specific topic exists, reply exactly: ["NONE"]. User message: "' + userText + '"'
                }]
            });
            const kwData = await kwRes.json();
            let raw = (kwData.choices?.[0]?.message?.content || '').trim().replace(/```json|```/g, '').trim();
            let keywords = [];
            try { keywords = JSON.parse(raw); } catch (e) { keywords = [raw.replace(/[\[\]"']/g, '').split(',')[0].trim()]; }

            // Strict filter — reject generic/category words and NONE
            const rejectWords = ['none', 'research', 'materials', 'material', 'prompts', 'prompt', 'module', 'files', 'file', 'topic', 'topics', 'something', 'available', 'studies', 'study'];
            keywords = keywords.filter(function (k) {
                const kl = k.toLowerCase().trim();
                return kl && kl !== 'none' && kl.length > 1 && !rejectWords.includes(kl);
            });

            if (keywords.length > 0) {
                hideTyping();
                const label = keywords[0];
                appendMessage('bot', '🔍 Searching for <strong>"' + label + '"</strong>' + (keywords.length > 1 ? ' and related terms' : '') + '…');
                const matches = await biliBotSearchArchive(keywords, searchRoots);
                appendNavResults(matches, keywords.join(' / '));
                showFindBar();
                input.disabled = false;
                sendBtn.disabled = false;
                input.focus();
                return;
            }
        } catch (e) { /* fall through to normal AI reply */ }
    }
    // ── End nav intent ──────────────────────────────────────

    const isFast = biliBotMode === 'fast';

    const systemPrompt = `You are BILIBot, the friendly AI assistant for iBilib — the Digital Archive of Aringay National High School (NHS) in the Philippines.
You help students and teachers with research studies, learning materials, and writing prompts. You can read uploaded files and answer questions about them.

SPELLING & LANGUAGE RULE:
- Users may type with typos, wrong spelling, or mixed Filipino/English (Taglish). Always try to understand what they mean.
- Examples: "reserch" = research, "materyal" = material, "anong" = what is, "pwede" = can/may, "maghanap" = find/search, "capston" = capstone, "bangos" = bangus.
- Never reject a message just because of spelling. Figure out the intent and respond helpfully.

${isFast ? `MODE: FAST — Give a short, direct answer immediately. No long explanations. Max 2-3 sentences.` : `MODE: DEEP THINKING — Before answering, briefly analyze what the user is really asking (consider typos, implied meaning, context). Then give a thorough, helpful response. Structure your answer clearly.`}

CLARIFICATION RULE:
If the message is vague → respond ONLY with this JSON (no other text):
{"clarify": true, "question": "Short question?", "options": ["Option A", "Option B", "Option C", "Option D"]}
If specific → reply as plain text. NEVER mix text + JSON.

Be warm and encouraging. You may use occasional emojis.`;

    let response, data;
    try {
        response = await groqFetch({
            model: GROQ_MODEL,
            max_tokens: isFast ? 300 : 1000,
            messages: [
                { role: 'system', content: systemPrompt },
                ...biliBotHistory.slice(-6)
            ]
        });
        data = await response.json();
    } catch (poolErr) {
        hideTyping();
        if (poolErr.message === 'NO_KEYS' || poolErr.message === 'ALL_KEYS_INVALID') {
            appendMessage('bot', '⚠️ BILIBot is temporarily unavailable — all API keys have been used up. Please ask the admin to add new keys.');
        } else {
            appendMessage('bot', '⚠️ Connection error: ' + poolErr.message);
        }
        input.disabled = false; sendBtn.disabled = false; input.focus();
        return;
    }

    try {
        if (!response.ok) {
            const errMsg = data.error?.message || JSON.stringify(data);
            hideTyping();
            appendMessage('bot', '⚠️ API Error (' + response.status + '): ' + errMsg);
            return;
        }

        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response. Please try again!";
        hideTyping();
        biliBotHistory.push({ role: 'assistant', content: reply });

        // Check if the AI wants to clarify (handle stray text before JSON too)
        const trimmed = reply.trim();
        const jsonStart = trimmed.indexOf('{');
        const jsonEnd = trimmed.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            try {
                const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
                if (parsed.clarify && parsed.question && Array.isArray(parsed.options)) {
                    appendClarification(parsed.question, parsed.options);
                    showFindBar();
                    return;
                }
            } catch (e) { /* not JSON, fall through */ }
        }

        const formatted = reply
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        appendMessage('bot', formatted);
        showFindBar();

    } catch (err) {
        hideTyping();
        appendMessage('bot', '⚠️ Connection error: ' + err.message);
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}