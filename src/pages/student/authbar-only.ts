// ═══════════════════════════════════════
//  iBilib — Student AuthBar-Only Entry
//  src/pages/student/authbar-only.ts
//
//  student.js already handles its own
//  session guard and page reveal. 
//  This module only adds the AuthBar
//  user pill/logout.
// ═══════════════════════════════════════

import { sb } from '@/lib/supabase';
import { watchAuthState, fadeOut, ROUTES } from '@/utils/auth';
import { mountAuthBar } from '@/components/AuthBar';

(async () => {
    try {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return; // student.js already handles the redirect

        // Mount user pill + logout button
        mountAuthBar(session.user);

        // Watch for sign-out from other browser tabs
        watchAuthState(() => fadeOut(() => window.location.replace(ROUTES.login)));
    } catch {
        // Silently ignore — student.js guards the page
    }
})();
