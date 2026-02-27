const SB_URL = "https://alpvtuximvsrsopsxghq.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHZ0dXhpbXZzcnNvcHN4Z2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzUyNTMsImV4cCI6MjA4NzcxMTI1M30.XvAkTQo0QssHGFO7EWFFu7-wLMwP2t9WRS6fb9Jo37o";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let libraries = [];
let activeLibId = null;

// Initialize App
async function init() {
    const { data, error } = await supabaseClient.from('libraries').select('*').order('created_at', { ascending: true });
    if (data) {
        libraries = data;
        if (!activeLibId && libraries.length > 0) activeLibId = libraries[0].id;
        renderUI();
    }
}

function renderUI() {
    const list = document.getElementById('libraryList');
    list.innerHTML = '';
    libraries.forEach(lib => {
        const li = document.createElement('li');
        li.className = `library-item ${lib.id === activeLibId ? 'active' : ''}`;
        li.innerHTML = `<i data-lucide="folder"></i> ${lib.name}`;
        li.onclick = () => { 
            activeLibId = lib.id; 
            renderUI(); 
            if(window.innerWidth <= 768) toggleSidebar(); 
        };
        list.appendChild(li);
    });

    const activeLib = libraries.find(l => l.id === activeLibId);
    if (!activeLib) return;

    document.getElementById('activeLibraryName').innerText = activeLib.name;
    document.getElementById('fileCount').innerText = `${activeLib.files.length} files`;

    const grid = document.getElementById('fileGrid');
    grid.innerHTML = '';
    activeLib.files.forEach((file, index) => {
        const ext = file.name.split('.').pop().toUpperCase();
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="file-icon">${ext}</div>
            <h3>${file.name}</h3>
            <div class="card-actions">
                <a href="${file.url}" target="_blank" class="view-btn">View</a>
                <a href="${file.url}" download="${file.name}" class="dl-btn">Download</a>
            </div>
            <button class="del-btn" onclick="deleteFile(${index})">Delete</button>
        `;
        grid.appendChild(card);
    });
    lucide.createIcons();
}

// Sidebar Toggle for Mobile
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// Add Library
async function addLibrary() {
    const name = prompt("New Library Name:");
    if (name) {
        const { error } = await supabaseClient.from('libraries').insert([{ name, files: [] }]);
        if (error) alert(error.message);
        else init();
    }
}

// Upload File
async function uploadFile() {
    if (!activeLibId) return alert("Select a library first!");
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        const path = `${Date.now()}_${file.name}`;
        
        // 1. Upload to Storage
        const { error: stErr } = await supabaseClient.storage.from('archive-files').upload(path, file);
        if (stErr) return alert("Upload failed: " + stErr.message);

        // 2. Update Database
        const { data: urlData } = supabaseClient.storage.from('archive-files').getPublicUrl(path);
        const activeLib = libraries.find(l => l.id === activeLibId);
        const updatedFiles = [...activeLib.files, { name: file.name, url: urlData.publicUrl, path: path }];

        await supabaseClient.from('libraries').update({ files: updatedFiles }).eq('id', activeLibId);
        init();
    };
    input.click();
}

// Delete File
async function deleteFile(index) {
    if (!confirm("Delete this file forever?")) return;
    const activeLib = libraries.find(l => l.id === activeLibId);
    const file = activeLib.files[index];

    if (file.path) await supabaseClient.storage.from('archive-files').remove([file.path]);

    const updatedFiles = activeLib.files.filter((_, i) => i !== index);
    await supabaseClient.from('libraries').update({ files: updatedFiles }).eq('id', activeLibId);
    init();
}

// Search Filter
function filterFiles() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const name = card.querySelector('h3').innerText.toLowerCase();
        card.style.display = name.includes(term) ? "block" : "none";
    });
}

init();