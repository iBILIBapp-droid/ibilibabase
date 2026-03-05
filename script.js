const SB_URL = "https://alpvtuximvsrsopsxghq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHZ0dXhpbXZzcnNvcHN4Z2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzUyNTMsImV4cCI6MjA4NzcxMTI1M30.XvAkTQo0QssHGFO7EWFFu7-wLMwP2t9WRS6fb9Jo37o";

// ─── State ───────────────────────────────────────────────
let currentPage = 'home';   // 'home' | 'category' | 'browser'
let currentPath = '';       // active folder path, e.g. 'research/Grade-11'
let currentRootScope = '';       // root being browsed, e.g. 'research'
let currentFiles = [];       // files currently visible in browser page
let searchDebounce = null;

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
async function listPath(prefix) {
    const res = await fetch(`${SB_URL}/storage/v1/object/list/archives`, {
        method: 'POST',
        headers: {
            "apikey": SB_KEY,
            "Authorization": `Bearer ${SB_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ prefix, limit: 200 })
    });
    return res.json();
}

// ─── Recursive file crawler (for global search) ────────────
async function crawlAll(prefix, results = []) {
    const items = await listPath(prefix);
    if (!Array.isArray(items)) return results;

    const folders = items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder');
    const files = items.filter(i => i.id && i.name !== '.emptyFolderPlaceholder');

    for (const f of files) {
        results.push({ name: f.name, fullPath: `${prefix}/${f.name}`, size: f.metadata?.size });
    }
    // Crawl subfolders in parallel
    await Promise.all(folders.map(f => crawlAll(`${prefix}/${f.name}`, results)));
    return results;
}

// ─── Navigate into a folder ───────────────────────────────
async function smartNavigate(path, title) {
    const container = document.getElementById('category-container');
    const browserContainer = document.getElementById('browser-container');

    currentPath = path;
    // Set root scope from first segment
    currentRootScope = path.split('/')[0];

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
        const items = await listPath(path);
        const folders = items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder');
        const files = items.filter(i => i.id && i.name !== '.emptyFolderPlaceholder');

        if (folders.length > 0) {
            container.innerHTML = "";
            folders.forEach((f, i) => {
                const div = document.createElement('div');
                div.className = "liquid-card animate-tile";
                div.style.animationDelay = `${i * 0.08}s`;
                div.onclick = () => smartNavigate(`${path}/${f.name}`, f.name);
                div.innerHTML = `
                    <div class="card-icon-wrap"><i data-lucide="folder"></i></div>
                    <div class="card-inner"><h3>${f.name}</h3><p>Folder</p></div>
                    <i data-lucide="arrow-right" class="card-arrow purple-text"></i>`;
                container.appendChild(div);
            });
            document.getElementById('category-back-btn').onclick = () => handleBack(path);
        } else {
            currentFiles = files.map(f => ({
                name: f.name,
                fullPath: `${path}/${f.name}`,
                size: f.metadata?.size
            }));
            showPage('browser');
            document.getElementById('browser-title').innerText = title;
            renderFileObjects(currentFiles, browserContainer);
            document.getElementById('browser-back-btn').onclick = () => handleBack(path);
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
        const baseUrl = `${SB_URL}/storage/v1/object/public/archives/${f.fullPath}`;

        const div = document.createElement('div');
        div.className = "liquid-card animate-tile";
        div.style.animationDelay = `${i * 0.07}s`;

        const parts = f.fullPath.split('/');
        const breadcrumb = parts.slice(0, -1).join(' › ');

        div.innerHTML = `
            <div class="card-icon-wrap"><i data-lucide="file-text"></i></div>
            <div class="card-inner">
                <h3>${f.name.replace(/_/g, ' ')}</h3>
                <p>${isSearch ? breadcrumb : formatSize(f.size)}</p>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0">
                <button class="btn-icon" title="Download" onclick="event.stopPropagation(); directDownload('${baseUrl}', '${f.name}')">
                    <i data-lucide="download"></i>
                </button>
                <button class="btn-purple-action" onclick="event.stopPropagation(); openViewer('${baseUrl}')">View</button>
            </div>`;
        container.appendChild(div);
    });
    lucide.createIcons();
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
        if (currentPage === 'browser' && currentFiles.length) {
            renderFileObjects(currentFiles, document.getElementById('browser-container'));
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

// Search across ALL three root folders
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

    document.getElementById('browser-back-btn').onclick = () => showPage('home');

    try {
        // Crawl all three root categories in parallel
        const [resFiles, matFiles, proFiles] = await Promise.all([
            crawlAll('research'),
            crawlAll('materials'),
            crawlAll('prompts')
        ]);

        const all = [...resFiles, ...matFiles, ...proFiles];
        const matches = all.filter(f => f.name.toLowerCase().replace(/_/g, ' ').includes(q));

        document.getElementById('browser-title').innerText =
            matches.length ? `"${q}" — ${matches.length} result${matches.length > 1 ? 's' : ''}` : `No results for "${q}"`;

        renderFileObjects(matches, container);
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

    document.getElementById('browser-back-btn').onclick = () => showPage('home');

    try {
        const all = await crawlAll(root);
        const matches = all.filter(f => f.name.toLowerCase().replace(/_/g, ' ').includes(q));
        document.getElementById('browser-title').innerText =
            matches.length
                ? `"${q}" in ${rootLabels[root]} — ${matches.length} result${matches.length > 1 ? 's' : ''}`
                : `No results for "${q}"`;
        renderFileObjects(matches, container);
    } catch (e) {
        container.innerHTML = `<div class="liquid-card" style="opacity:1">
            <div class="card-icon-wrap"><i data-lucide="wifi-off"></i></div>
            <div class="card-inner"><h3>Network Error</h3><p>Could not search</p></div>
        </div>`;
        lucide.createIcons();
    }
}

// ─── Misc helpers ──────────────────────────────────────────
function handleBack(path) {
    const parts = path.split('/');
    if (parts.length <= 1) showPage('home');
    else { parts.pop(); smartNavigate(parts.join('/'), parts[parts.length - 1] || 'Back'); }
}

function openViewer(url) {
    const src = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true&zoom=page-fit`;
    document.getElementById('pdf-frame').src = src;
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

function loadResearch() { smartNavigate('research', 'Research Studies'); }
function loadMaterials() { smartNavigate('materials', 'Learning Materials'); }
function loadPrompts() { smartNavigate('prompts', 'Writing Prompts'); }

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

    try {
        const items = await listPath(cat);
        const folders = Array.isArray(items)
            ? items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder')
            : [];

        // Clear + rebuild options
        select.innerHTML = '<option value="">— Root (no subfolder) —</option>';

        if (folders.length === 0) {
            hint.textContent = 'No subfolders yet';
        } else {
            for (const f of folders) {
                const opt = document.createElement('option');
                opt.value = f.name;
                opt.textContent = '📁 ' + f.name;
                select.appendChild(opt);

                try {
                    const sub = await listPath(cat + '/' + f.name);
                    const subFolders = Array.isArray(sub)
                        ? sub.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder')
                        : [];
                    subFolders.forEach(sf => {
                        const subOpt = document.createElement('option');
                        subOpt.value = f.name + '/' + sf.name;
                        subOpt.textContent = '  └ 📁 ' + f.name + ' › ' + sf.name;
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

// ── Groq config — update key here if it changes ────────────
const GROQ_API_KEY = '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
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
async function biliBotSearchArchive(keywords, roots) {
    if (!roots) roots = ['research', 'materials', 'prompts'];
    const qs = (Array.isArray(keywords) ? keywords : [keywords]).map(k => k.toLowerCase().trim()).filter(Boolean);
    const seen = new Set();
    const results = [];
    let crawlError = null;

    await Promise.all(roots.map(async root => {
        try {
            const all = await crawlAll(root);
            console.log('[BILIBot] crawled', root, '→', all.length, 'files');
            all.forEach(f => {
                const path = f.fullPath.toLowerCase();
                if (qs.some(q => path.includes(q)) && !seen.has(f.fullPath)) {
                    seen.add(f.fullPath);
                    results.push(f);
                }
            });
        } catch (e) {
            crawlError = e;
            console.error('[BILIBot] crawl error for', root, e);
        }
    }));

    console.log('[BILIBot] search results:', results.length, 'for keywords:', qs);

    // If nothing matched but we have keywords, try folder-level search
    if (results.length === 0 && !crawlError) {
        await Promise.all(roots.map(async root => {
            try {
                const items = await listPath(root);
                if (!Array.isArray(items)) return;
                items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder').forEach(folder => {
                    const fname = folder.name.toLowerCase();
                    if (qs.some(q => fname.includes(q))) {
                        results.push({ name: folder.name, fullPath: root + '/' + folder.name + '/_folder_', size: 0 });
                    }
                });
            } catch (e) { }
        }));
        console.log('[BILIBot] folder-level results:', results.length);
    }

    return results;
}

// ─── BILIBot nav card click handler (global scope) ────────
window.biliBotNavGo = function (folder, title) {
    smartNavigate(folder, title);
    if (biliBotOpen) toggleBiliBot();
};

// ─── BILIBot: render nav result cards in chat ─────────────
function appendNavResults(matches, queryLabel) {
    const container = document.getElementById('bilibot-messages');
    const wrap = document.createElement('div');
    wrap.className = 'bilibot-msg bot';

    const avatar = document.createElement('div');
    avatar.className = 'bilibot-msg-avatar';
    avatar.innerHTML = `<img src="image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`;
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

            const card = document.createElement('div');
            card.className = 'bilibot-nav-card';
            card.innerHTML = `
                <div class="bilibot-nav-card-top">
                    <span class="bilibot-nav-root">${rootIcon} ${rootLabel}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </div>
                <div class="bilibot-nav-folder">📁 ${subFolder}</div>
                <div class="bilibot-nav-files">
                    ${fileCount > 0
                    ? data.files.slice(0, 3).map(f => `<span>${f.fullPath.split('/').pop()}</span>`).join('') + (fileCount > 3 ? `<span>+${fileCount - 3} more</span>` : '')
                    : `<span>📂 Open folder</span>`
                }
                </div>`;
            card.addEventListener('click', () => window.biliBotNavGo(folder, folderName));
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
    avatar.innerHTML = `<img src="image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`;
    wrap.appendChild(avatar);

    const bubble = document.createElement('div');
    bubble.className = 'bilibot-bubble bilibot-clarify-bubble';

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

function appendMessage(role, text) {
    const container = document.getElementById('bilibot-messages');
    const div = document.createElement('div');
    div.className = `bilibot-msg ${role}`;

    if (role === 'bot') {
        div.innerHTML = `
            <div class="bilibot-msg-avatar">
                <img src="image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">
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
            <img src="image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">
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
        { regex: /(what|show|list|give|any).{0,25}(available|examples?|list).{0,20}research/i, root: 'research', title: 'Research Studies', icon: '📚' },
        { regex: /what.{0,20}research.{0,25}(available|there|have|exist)/i, root: 'research', title: 'Research Studies', icon: '📚' },
        { regex: /(what|show|list|give|any).{0,25}(available|examples?|list).{0,20}(material|module)/i, root: 'materials', title: 'Learning Materials', icon: '📋' },
        { regex: /(what|show|list|give|any).{0,25}(available|examples?|list).{0,20}prompt/i, root: 'prompts', title: 'Writing Prompts', icon: '✏️' },
        { regex: /what.{0,20}(material|module).{0,25}(available|there|have)/i, root: 'materials', title: 'Learning Materials', icon: '📋' },
        { regex: /what.{0,20}prompt.{0,25}(available|there|have)/i, root: 'prompts', title: 'Writing Prompts', icon: '✏️' },
        // bare "what are available" / "what are the available" without category = default to research
        { regex: /what.{0,10}are.{0,10}(the\s+)?available/i, root: 'research', title: 'Research Studies', icon: '📚' },
        { regex: /what.{0,10}(files?|docs?|documents?).{0,10}(are\s+)?(available|there)/i, root: 'research', title: 'Research Studies', icon: '📚' },
    ];

    const availableMatch = availablePatterns.find(function (p) { return p.regex.test(lowerText); });

    if (availableMatch) {
        hideTyping();
        appendMessage('bot', availableMatch.icon + ' Let me grab some examples from <strong>' + availableMatch.title + '</strong>…');
        try {
            const items = await listPath(availableMatch.root);
            const folders = Array.isArray(items) ? items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder') : [];
            const files = Array.isArray(items) ? items.filter(i => i.id && i.name !== '.emptyFolderPlaceholder') : [];

            // Build sample list — show up to 6 folders or files
            const samples = folders.length > 0 ? folders : files;
            const preview = samples.slice(0, 6);

            const container2 = document.getElementById('bilibot-messages');
            const wrap2 = document.createElement('div');
            wrap2.className = 'bilibot-msg bot';

            const av2 = document.createElement('div');
            av2.className = 'bilibot-msg-avatar';
            av2.innerHTML = '<img src="image/BILIBot.png" alt="BILIBot" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">';
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

    // Determine which root to search based on context clues
    let searchRoots = ['research', 'materials', 'prompts']; // default: all
    if (/(research|capstone|thesis|study)/.test(lowerText)) searchRoots = ['research'];
    else if (/(material|module|lesson|module)/.test(lowerText)) searchRoots = ['materials'];
    else if (/(prompt|essay|writing task)/.test(lowerText)) searchRoots = ['prompts'];

    if (isNavIntent) {
        try {
            const kwRes = await fetch(GROQ_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    max_tokens: 80,
                    messages: [{
                        role: 'user',
                        content: 'Extract the specific topic the user wants to find in a school archive. Include scientific/alternate names (e.g. "bangus" → ["bangus","milkfish"]). Reply ONLY as a JSON array of strings, max 4 items. The topic must be a real subject — NOT generic words like "research", "materials", "file", "topic", "something", "available". If no specific topic exists, reply exactly: ["NONE"]. User message: "' + userText + '"'
                    }]
                })
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

    try {
        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + GROQ_API_KEY
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                max_tokens: isFast ? 300 : 1000,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...biliBotHistory.slice(-6)
                ]
            })
        });

        const data = await response.json();

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
                    return;
                }
            } catch (e) { /* not JSON, fall through */ }
        }

        const formatted = reply
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');

        appendMessage('bot', formatted);

    } catch (err) {
        hideTyping();
        appendMessage('bot', '⚠️ Connection error: ' + err.message);
    } finally {
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
    }
}
