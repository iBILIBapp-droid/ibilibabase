// ═══════════════════════════════════════
//  iBilib — Student Portal Entry Point
//  src/pages/student/student.ts
//
//  Bootstraps auth guard and AuthBar
//  for student.html
// ═══════════════════════════════════════

import { guardSession, watchAuthState, fadeOut, ROUTES } from '@/utils/auth';
import { mountAuthBar } from '@/components/AuthBar';

// ── Guard session first — throws + redirects if no session ───
guardSession()
    .then((user) => {
        // Mount user pill + logout button in navbar
        mountAuthBar(user);

        // Listen for sign-out from other tabs
        watchAuthState(() => fadeOut(() => window.location.replace(ROUTES.login)));

        // ── The rest of student.js / script.js logic
        //    continues to run from its own <script> tags in student.html
        //    until those files are also fully ported to TypeScript.
        //    Import them here once ready:
        //    import './Student';
        //    import './Script';
    })
    .catch(() => {
        // guardSession already redirects to login — nothing to do here
    });
