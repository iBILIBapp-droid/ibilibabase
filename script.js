const SB_URL = "https://alpvtuximvsrsopsxghq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHZ0dXhpbXZzcnNvcHN4Z2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzUyNTMsImV4cCI6MjA4NzcxMTI1M30.XvAkTQo0QssHGFO7EWFFu7-wLMwP2t9WRS6fb9Jo37o";

// ─── State ───────────────────────────────────────────────
let currentPage      = 'home';   // 'home' | 'category' | 'browser'
let currentPath      = '';       // active folder path, e.g. 'research/Grade-11'
let currentRootScope = '';       // root being browsed, e.g. 'research'
let currentFiles     = [];       // files currently visible in browser page
let searchDebounce   = null;

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
    const files   = items.filter(i =>  i.id && i.name !== '.emptyFolderPlaceholder');

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

    container.innerHTML = `<div class="liquid-card animate-pulse" style="opacity:1">
        <div class="card-icon-wrap"><i data-lucide="loader"></i></div>
        <div class="card-inner"><h3>Loading ${title}…</h3><p>Syncing with archive</p></div>
    </div>`;
    showPage('category');
    document.getElementById('category-page-title').innerText = title;
    lucide.createIcons();

    try {
        const items   = await listPath(path);
        const folders = items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder');
        const files   = items.filter(i =>  i.id && i.name !== '.emptyFolderPlaceholder');

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
function renderFileObjects(files, container) {
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
        // ?download= tells Supabase to send Content-Disposition: attachment
        const downloadUrl = `${SB_URL}/storage/v1/object/public/archives/${f.fullPath}?download=`;
        // View URL must NOT have ?download= or Google Docs Viewer will fail
        const viewUrl = `${SB_URL}/storage/v1/object/public/archives/${f.fullPath}`;

        const div = document.createElement('div');
        div.className = "liquid-card animate-tile";
        div.style.animationDelay = `${i * 0.06}s`;

        const parts = f.fullPath.split('/');
        const breadcrumb = parts.slice(0, -1).join(' › ');

        div.innerHTML = `
            <div class="card-icon-wrap"><i data-lucide="file-text"></i></div>
            <div class="card-inner">
                <h3>${f.name.replace(/_/g, ' ')}</h3>
                <p>${breadcrumb || formatSize(f.size)}</p>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0">
                <button class="btn-icon" title="Download" onclick="event.stopPropagation();directDownload('${downloadUrl}','${f.name}')">
                    <i data-lucide="download"></i>
                </button>
                <button class="btn-purple-action" onclick="event.stopPropagation();openViewer('${viewUrl}')">View</button>
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
    container.innerHTML = `<div class="liquid-card animate-pulse" style="opacity:1">
        <div class="card-icon-wrap"><i data-lucide="search"></i></div>
        <div class="card-inner"><h3>Searching entire library…</h3><p>research · materials · prompts</p></div>
    </div>`;
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
        const matches = all.filter(f => f.name.toLowerCase().replace(/_/g,' ').includes(q));

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
        f.name.toLowerCase().replace(/_/g,' ').includes(q)
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
    container.innerHTML = `<div class="liquid-card animate-pulse" style="opacity:1">
        <div class="card-icon-wrap"><i data-lucide="search"></i></div>
        <div class="card-inner"><h3>Searching ${rootLabels[root] || root}…</h3><p>Looking for "${q}"</p></div>
    </div>`;
    lucide.createIcons();

    document.getElementById('browser-back-btn').onclick = () => showPage('home');

    try {
        const all = await crawlAll(root);
        const matches = all.filter(f => f.name.toLowerCase().replace(/_/g,' ').includes(q));
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
    document.getElementById('pdf-frame').src = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    showPage('viewer');
}

function closeViewer() {
    document.getElementById('pdf-frame').src = "";
    showPage('browser');
}

function directDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function formatSize(bytes) {
    if (!bytes) return 'Document';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function loadResearch()  { smartNavigate('research',  'Research Studies'); }
function loadMaterials() { smartNavigate('materials', 'Learning Materials'); }
function loadPrompts()   { smartNavigate('prompts',   'Writing Prompts'); }

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
    const inp  = document.getElementById('login-pass');
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
    const el  = document.getElementById('login-error');
    const txt = document.getElementById('login-error-msg');
    const fu  = document.getElementById('field-username');
    const fp  = document.getElementById('field-password');
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
    const btn  = document.getElementById('login-btn');

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
    document.getElementById('admin-modal').addEventListener('click', function(e) {
        if (e.target === this) closeAdmin();
    });
    document.getElementById('admin-panel').addEventListener('click', function(e) {
        if (e.target === this) closeAdminPanel();
    });
});

// ═══════════════════════════════════════════════
//  ADMIN — UPLOAD PANEL
// ═══════════════════════════════════════════════
let uploadQueue  = [];   // { file, name }
let selectedCat  = 'research';
const MAX_FILES  = 10;

function openAdminPanel() {
    clearQueue();
    selectedCat = 'research';
    document.querySelectorAll('.cat-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === 'research');
    });
    document.getElementById('upload-subfolder').value = '';
    document.getElementById('upload-progress-wrap').classList.add('hidden');
    document.getElementById('upload-toast').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    lucide.createIcons();
}

function closeAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
    clearQueue();
}

function selectCat(btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCat = btn.dataset.cat;
}

// ── Drop zone ──────────────────────────────────
function dzOver(e)  { e.preventDefault(); document.getElementById('dropzone').classList.add('over'); }
function dzLeave(e) { document.getElementById('dropzone').classList.remove('over'); }
function dzDrop(e)  {
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
    const wrap  = document.getElementById('file-queue');
    const list  = document.getElementById('queue-list');
    const count = document.getElementById('queue-count');
    const btn   = document.getElementById('upload-btn');

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
                <div class="queue-item-name">${item.name.replace(/_/g,' ')}</div>
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

    const subfolder = document.getElementById('upload-subfolder').value.trim().replace(/\//g, '-');
    const basePath  = subfolder ? `${selectedCat}/${subfolder}` : selectedCat;

    const btn     = document.getElementById('upload-btn');
    const progWrap = document.getElementById('upload-progress-wrap');
    const fill    = document.getElementById('progress-fill');
    const pct     = document.getElementById('progress-pct');
    const label   = document.getElementById('progress-label-text');

    btn.disabled  = true;
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
                        'apikey':        SB_KEY,
                        'Authorization': `Bearer ${SB_KEY}`,
                        'Content-Type':  item.file.type || 'application/octet-stream',
                        'x-upsert':      'true'
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
        pct.textContent  = progress + '%';
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
