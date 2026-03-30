// ═══════════════════════════════════════
//  iBilib — Auth Utilities
//  src/utils/auth.ts
//
//  Replaces the old auth.js session guard.
//  Import and call guardSession() at the top
//  of every protected page entry point.
// ═══════════════════════════════════════

import { sb } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

// ── Page routes ──────────────────────────────────────────────
export const ROUTES = {
    login: './index.html',
    student: './student.html',
    teacher: './teacher.html',
    updatePassword: './update-password.html',
} as const;

// ── Smooth fade-out transition ───────────────────────────────
export function fadeOut(cb: () => void, duration = 380): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:9999999',
        'background:#0d0820', 'opacity:0',
        `transition:opacity ${duration}ms cubic-bezier(0.4,0,0.2,1)`,
        'pointer-events:all',
    ].join(';');
    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            setTimeout(cb, duration);
        });
    });
}

// ── Smooth fade-in on page load ──────────────────────────────
export function fadeIn(duration = 350): void {
    document.documentElement.style.opacity = '0';
    document.documentElement.style.transition = `opacity ${duration}ms cubic-bezier(0.4,0,0.2,1)`;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.documentElement.style.opacity = '1';
        });
    });
}

// ── Determine the correct portal for a user ─────────────────
export async function getRedirectUrl(user: User): Promise<string> {
    // Profiles table is the source of truth for role
    try {
        const result = await Promise.race([
            sb.from('profiles').select('role').eq('id', user.id).single(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 3000)
            ),
        ]) as { data: { role: string } | null; error: unknown };

        const profileRole = (result?.data?.role ?? '').toLowerCase() as UserRole;
        if (profileRole === 'teacher' || profileRole === 'private') return ROUTES.teacher;
        if (profileRole === 'student') return ROUTES.student;
    } catch {
        // profiles lookup failed — fall back to metadata
    }

    const meta = (user.user_metadata ?? {}) as Record<string, string>;
    const metaRole = (meta['role'] ?? meta['user_role'] ?? '').toLowerCase();
    if (metaRole === 'teacher' || metaRole === 'private') return ROUTES.teacher;

    return ROUTES.student; // default
}

// ── Session guard for protected pages ───────────────────────
/**
 * Call at the top of protected page scripts.
 * Redirects to login if no valid session exists.
 * Returns the authenticated User for the page to use.
 */
export async function guardSession(): Promise<User> {
    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
        // Bypass detection — tell login page to show a warning
        sessionStorage.setItem('bypass_attempt', '1');
        fadeOut(() => window.location.replace(ROUTES.login));
        // Throw to stop any further execution on the protected page
        throw new Error('Unauthenticated');
    }

    return session.user;
}

// ── Listen for sign-out from other tabs ─────────────────────
export function watchAuthState(onSignOut: () => void): void {
    sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') onSignOut();
    });
}
