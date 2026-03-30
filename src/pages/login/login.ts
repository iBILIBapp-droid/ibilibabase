// ═══════════════════════════════════════
//  iBilib — Login Page Entry Point
//  src/pages/login/login.ts
//
//  TypeScript port of login.js
// ═══════════════════════════════════════

import { sb } from '@/lib/supabase';
import { fadeOut, fadeIn, getRedirectUrl, ROUTES } from '@/utils/auth';
import type { ToastType } from '@/types';
import type { User } from '@supabase/supabase-js';

// ── State ────────────────────────────────────────────────────
let pendingEmail = '';
let redirecting = false;
let resendCooldown = 0;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

// ── Redirect by role ─────────────────────────────────────────
async function redirectByRole(user: User): Promise<void> {
    if (redirecting) return;
    redirecting = true;
    const url = await getRedirectUrl(user);
    fadeOut(() => { window.location.href = url; });
}

// ── Auth state listener (handles Google OAuth redirect) ──────
let authListenerReady = false;
sb.auth.onAuthStateChange(async (event, session) => {
    if (!authListenerReady) { authListenerReady = true; return; }
    if (event === 'PASSWORD_RECOVERY') return;
    if (event === 'SIGNED_IN' && session && !redirecting) {
        await redirectByRole(session.user);
    }
});
setTimeout(() => { authListenerReady = true; }, 100);

// ── Auto-redirect if already logged in ───────────────────────
(async () => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
        fadeOut(() => {
            window.location.replace(ROUTES.updatePassword + hash);
        });
        return;
    }
    const { data: { session } } = await sb.auth.getSession();
    if (session) await redirectByRole(session.user);
})();

// ── Sign In ──────────────────────────────────────────────────
async function handleLogin(e: Event): Promise<void> {
    e.preventDefault();
    const email = (document.getElementById('login-email') as HTMLInputElement).value.trim();
    const pw = (document.getElementById('login-pw') as HTMLInputElement).value;
    if (!email || !pw) { toast('Please fill in all fields.'); return; }

    setLoading('btn-login', true);
    try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        toast('Signed in! Redirecting…', 'success');
        await redirectByRole(data.user);
    } catch (err) {
        const msg = (err as Error).message ?? '';
        if (msg.includes('Invalid login')) toast('Incorrect email or password.');
        else if (msg.includes('Email not confirmed')) toast('Please verify your email first.');
        else toast(msg || 'Login failed. Please try again.');
        setLoading('btn-login', false);
    }
}

// ── Sign Up ──────────────────────────────────────────────────
async function handleSignup(e: Event): Promise<void> {
    e.preventDefault();
    const name = (document.getElementById('signup-name') as HTMLInputElement).value.trim();
    const email = (document.getElementById('signup-email') as HTMLInputElement).value.trim();
    const pw = (document.getElementById('signup-pw') as HTMLInputElement).value;

    if (!name || !email || !pw) { toast('Please fill in all fields.'); return; }
    if (pw.length < 8) { toast('Password must be at least 8 characters.'); return; }

    setLoading('btn-signup', true);
    try {
        const { error } = await sb.auth.signUp({
            email,
            password: pw,
            options: { data: { full_name: name, role: 'student' } },
        });

        if (error) {
            const msg = error.message ?? '';
            if (msg.includes('already registered')) {
                toast('Email already registered. Try signing in.'); return;
            }
            if (!msg.toLowerCase().includes('database error')) throw error;
        }

        // Sign in immediately after signup (no email verification required)
        const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({ email, password: pw });
        if (signInError) {
            toast('Account created! You can now sign in.', 'success');
            setTimeout(() => switchTab('login'), 1500);
            return;
        }
        toast('Account created! Redirecting…', 'success');
        await redirectByRole(signInData.user);

    } catch (err) {
        toast((err as Error).message || 'Sign up failed. Please try again.');
    } finally {
        setLoading('btn-signup', false);
    }
}

// ── OTP verify ───────────────────────────────────────────────
function _showVerifyPanel(email: string): void {
    (document.querySelector('.tab-row') as HTMLElement).style.display = 'none';
    document.querySelectorAll<HTMLElement>('.form-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-verify')?.classList.add('active');
    const label = document.getElementById('verify-email-label');
    if (label) label.textContent = email;
    (document.getElementById('d1') as HTMLInputElement).focus();
}
// Keep available for external call if needed
void _showVerifyPanel;

function initOtpInputs(): void {
    const digits = document.querySelectorAll<HTMLInputElement>('.otp-digit');

    digits.forEach((input, idx) => {
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '').slice(-1);
            if (input.value && idx < digits.length - 1) digits[idx + 1].focus();
            checkOtpComplete();
        });
        input.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Backspace' && !input.value && idx > 0) digits[idx - 1].focus();
        });
    });

    document.getElementById('otp-inputs')?.addEventListener('paste', (e: ClipboardEvent) => {
        e.preventDefault();
        const pasted = (e.clipboardData ?? (window as unknown as { clipboardData: DataTransfer }).clipboardData)
            .getData('text').replace(/\D/g, '').slice(0, 6);
        pasted.split('').forEach((ch, i) => { if (digits[i]) digits[i].value = ch; });
        if (pasted.length === 6) { digits[5].focus(); checkOtpComplete(); }
    });
}

function checkOtpComplete(): void {
    const digits = document.querySelectorAll<HTMLInputElement>('.otp-digit');
    const code = [...digits].map(d => d.value).join('');
    if (code.length === 6) void handleVerify(code);
}

async function handleVerify(code?: string): Promise<void> {
    if (!code) {
        const digits = document.querySelectorAll<HTMLInputElement>('.otp-digit');
        code = [...digits].map(d => d.value).join('');
    }
    if (code.length < 6) { toast('Enter all 6 digits.'); return; }

    setLoading('btn-verify', true);
    try {
        const { data, error } = await sb.auth.verifyOtp({ email: pendingEmail, token: code, type: 'signup' });
        if (error) throw error;
        toast('Email verified! Redirecting…', 'success');
        await redirectByRole(data.user!);
    } catch (err) {
        const msg = (err as Error).message ?? '';
        if (msg.includes('expired') || msg.includes('invalid')) {
            toast('Code is wrong or expired. Request a new one.');
            document.querySelectorAll<HTMLInputElement>('.otp-digit').forEach(d => { d.value = ''; });
            (document.getElementById('d1') as HTMLInputElement).focus();
        } else {
            toast(msg || 'Verification failed.');
        }
        setLoading('btn-verify', false);
    }
}

async function handleResend(): Promise<void> {
    if (resendCooldown > 0 || !pendingEmail) return;
    try {
        await sb.auth.resend({ type: 'signup', email: pendingEmail });
        toast('New code sent!', 'success');
        resendCooldown = 60;
        const btn = document.getElementById('btn-resend') as HTMLButtonElement;
        const tick = setInterval(() => {
            resendCooldown--;
            btn.textContent = resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code';
            if (resendCooldown <= 0) clearInterval(tick);
        }, 1000);
    } catch {
        toast('Could not resend. Try again later.');
    }
}

// ── Forgot Password ──────────────────────────────────────────
async function handleReset(e: Event): Promise<void> {
    e.preventDefault();
    const email = (document.getElementById('reset-email') as HTMLInputElement).value.trim();
    if (!email) { toast('Please enter your email address.'); return; }

    setLoading('btn-reset', true);
    try {
        const { error } = await sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + ROUTES.updatePassword,
        });
        if (error) throw error;
        toast('Reset link sent! Check your inbox.', 'success');
    } catch (err) {
        toast((err as Error).message || 'Could not send reset link.');
    } finally {
        setLoading('btn-reset', false);
    }
}

// handleGoogle removed.

// ── UI Helpers ───────────────────────────────────────────────
function switchTab(tab: string): void {
    document.querySelectorAll<HTMLButtonElement>('.tab-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'signup' && i === 1));
    });
    document.querySelectorAll<HTMLElement>('.form-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + tab)?.classList.add('active');
    (document.querySelector('.tab-row') as HTMLElement).style.display = tab === 'reset' ? 'none' : 'flex';
}

function togglePw(inputId: string, btn: HTMLButtonElement): void {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.title = show ? 'Hide password' : 'Show password';
    btn.innerHTML = show
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function toast(message: string, type: ToastType = 'error'): void {
    const el = document.getElementById('toast')!;
    el.textContent = message;
    el.className = `show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = ''; }, 4000);
}

function setLoading(btnId: string, isLoading: boolean): void {
    const btn = document.getElementById(btnId) as HTMLButtonElement | null;
    if (!btn) return;
    btn.disabled = isLoading;
    if (isLoading) {
        btn.dataset['original'] = btn.innerHTML;
        btn.innerHTML = '<span class="btn-spinner"></span> Please wait…';
    } else {
        btn.innerHTML = btn.dataset['original'] ?? btn.innerHTML;
    }
}

// ── Particles & Ripple ───────────────────────────────────────
function initParticles(): void {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 28; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `
      left: ${Math.random() * 100}%;
      bottom: ${Math.random() * 30}%;
      --dur: ${4 + Math.random() * 6}s;
      --delay: ${Math.random() * 8}s;
      width: ${2 + Math.random() * 3}px;
      height: ${2 + Math.random() * 3}px;
    `;
        container.appendChild(p);
    }
}

function initRipple(): void {
    document.querySelectorAll<HTMLButtonElement>('.btn-primary').forEach(btn => {
        btn.addEventListener('click', (e: MouseEvent) => {
            const r = document.createElement('span');
            r.className = 'ripple';
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;`;
            btn.appendChild(r);
            setTimeout(() => r.remove(), 700);
        });
    });
}

// ── Expose to HTML onclick handlers ─────────────────────────
// (Until template is migrated to pure event listeners)
declare global {
    interface Window {
        handleLogin: (e: Event) => void;
        handleSignup: (e: Event) => void;
        handleVerify: (code?: string) => Promise<void>;
        handleResend: () => Promise<void>;
        handleReset: (e: Event) => void;
        // handleGoogle removed.
        switchTab: (tab: string) => void;
        togglePw: (inputId: string, btn: HTMLButtonElement) => void;
    }
}
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleVerify = handleVerify;
window.handleResend = handleResend;
window.handleReset = handleReset;
// handleGoogle removed.
window.switchTab = switchTab;
window.togglePw = togglePw;

// ── Init ─────────────────────────────────────────────────────
initParticles();
initRipple();
initOtpInputs();
fadeIn(400);

if (sessionStorage.getItem('bypass_attempt') === '1') {
    sessionStorage.removeItem('bypass_attempt');
    setTimeout(() => toast("🔒 Don't bypass the login page. Please sign in first."), 300);
}
