// ═══════════════════════════════════════
//  iBilib — Teacher Portal Entry Point
//  src/pages/teacher/teacher.ts
//
//  Bootstraps auth guard, AuthBar,
//  and AccountManager for teacher.html
// ═══════════════════════════════════════

import { guardSession, watchAuthState, fadeOut, ROUTES } from '@/utils/auth';
import { mountAuthBar } from '@/components/AuthBar';
import { initAccountManager } from '@/pages/teacher/AccountManager';

// ── Guard session first — throws + redirects if no session ───
guardSession()
    .then(async (user) => {
        // Mount user pill + logout button in navbar
        mountAuthBar(user);

        // Listen for sign-out from other tabs
        watchAuthState(() => fadeOut(() => window.location.replace(ROUTES.login)));

        // Init Account Manager (only shows button to 'private' role users)
        await initAccountManager();

        // ── The rest of teacher.js / teacherscript.js logic
        //    continues to run from its own <script> tags in teacher.html
        //    until those files are also fully ported to TypeScript.
        //    Import them here once ready:
        //    import './Teacher';
        //    import './TeacherScript';
    })
    .catch(() => {
        // guardSession already redirects to login — nothing to do here
    });
