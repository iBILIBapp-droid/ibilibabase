// ═══════════════════════════════════════
//  iBilib — Auth Bar Component (Redesign)
//  src/components/AuthBar.ts
// ═══════════════════════════════════════

import { sb } from '@/lib/supabase';
import { fadeOut, ROUTES } from '@/utils/auth';
import type { User } from '@supabase/supabase-js';

// ── Build and mount the auth bar ─────────────────────────────
export function mountAuthBar(user: User): void {
  // 1. Singleton check
  const existing = document.getElementById('_user-dropdown');
  if (existing) existing.remove();

  const fullName = (user.user_metadata?.['full_name'] as string | undefined)
    ?? user.email?.split('@')[0]
    ?? 'User';

  const initials = fullName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const container = document.createElement('div');
  container.className = 'user-dropdown';
  container.id = '_user-dropdown';
  container.innerHTML = `
    <div class="user-trigger" id="_user-trigger" title="Account settings">
      <div class="user-avatar-small">${initials}</div>
      <div class="user-name-small">${fullName}</div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="opacity:0.5;margin-left:-4px"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="dropdown-menu" id="_user-menu">
      <div class="dropdown-header">
        <div class="dropdown-user-name">${fullName}</div>
        <div class="dropdown-user-role">${document.title.includes('Teacher') ? 'Teacher Portal' : 'Student Portal'}</div>
      </div>
      <div id="_user-menu-items">
        <!-- Other modules can inject items here -->
      </div>
      <button class="dropdown-item logout" id="_logout-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Logout</span>
      </button>
    </div>
  `;

  // 2. Mount to navbar
  const target = document.getElementById('nav-actions') || document.querySelector('.nav-inner');
  if (target) {
    target.appendChild(container);
  } else {
    document.body.appendChild(container); // last resort
  }

  // 3. Dropdown Toggle Logic
  const trigger = document.getElementById('_user-trigger');
  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    container.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      container.classList.remove('open');
    }
  });

  // 4. Logout handler
  let loggingOut = false;
  document.getElementById('_logout-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (loggingOut) return;
    loggingOut = true;

    const btn = e.currentTarget as HTMLButtonElement;
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation:am-spin .7s linear infinite">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>Signing out…</span>`;

    try { await sb.auth.signOut(); } catch { /* ignore */ }
    fadeOut(() => window.location.replace(ROUTES.login));
  });

  // 5. Mobile Menu Integration
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    if (!document.getElementById('_mobile-logout-btn')) {
      const mobDivider = document.createElement('div');
      mobDivider.className = 'dropdown-divider-mobile';
      mobDivider.style.margin = '12px 16px';
      mobDivider.style.height = '1px';
      mobDivider.style.background = 'rgba(255,255,255,0.08)';

      const mobLogout = document.createElement('a');
      mobLogout.id = '_mobile-logout-btn';
      mobLogout.className = 'mob-link logout-mob';
      mobLogout.style.color = '#f87171';
      mobLogout.innerHTML = '<i data-lucide="log-out"></i>Logout';
      mobLogout.onclick = () => {
        const btn = document.getElementById('_logout-btn');
        if (btn) btn.click();
      };

      mobileMenu.appendChild(mobDivider);
      mobileMenu.appendChild(mobLogout);

      // Refresh icons if lucide is available
      const _w = window as any;
      if (_w.lucide) _w.lucide.createIcons();
    }
  }
}
