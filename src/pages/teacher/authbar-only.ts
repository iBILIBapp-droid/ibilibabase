// ═══════════════════════════════════════
//  iBilib — Teacher AuthBar-Only Entry
//  src/pages/teacher/authbar-only.ts
//
//  teacher.js already handles its own
//  session guard and page reveal.
//  This module only adds the AuthBar
//  user pill/logout + AccountManager
//  on top of the existing teacher page.
// ═══════════════════════════════════════

import { sb } from '@/lib/supabase';
import { watchAuthState, fadeOut, ROUTES } from '@/utils/auth';
import { mountAuthBar } from '@/components/AuthBar';
import { initAccountManager } from '@/pages/teacher/AccountManager';

(async () => {
    try {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return; // teacher.js already handles the redirect

        // Mount the user pill + logout button
        mountAuthBar(session.user);

        // Watch for sign-out from other browser tabs
        watchAuthState(() => fadeOut(() => window.location.replace(ROUTES.login)));

        // Init Account Manager (only shows nav button if role === 'private')
        await initAccountManager();
    } catch {
        // Silently ignore — teacher.js guards the page
    }
})();
