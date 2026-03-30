/* ═══════════════════════════════════════
   iBilib Login — JavaScript
   login.js
═══════════════════════════════════════ */

const SUPABASE_URL = 'https://yapnbwxerwppsepcdcxi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);


/* ── Smooth page transition helper ── */
function _fadeOut(cb, duration = 380) {
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999999',
    'background:#0d0820', 'opacity:0',
    'transition:opacity ' + duration + 'ms cubic-bezier(0.4,0,0.2,1)',
    'pointer-events:all'
  ].join(';');
  document.body.appendChild(overlay);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      setTimeout(cb, duration);
    });
  });
}

function _fadeIn(duration = 350) {
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity ' + duration + 'ms cubic-bezier(0.4,0,0.2,1)';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.style.opacity = '1';
    });
  });
}

const STUDENT_URL = './ibilib/student.html';
const TEACHER_URL = './ibilib-teacher/teacher.html';

/* ── store email between signup → verify steps ── */
let pendingEmail = '';

/* ══════════════════════════════════════
   REDIRECT BY ROLE
══════════════════════════════════════ */
let redirecting = false;

async function redirectByRole(user) {
  if (redirecting) return;
  redirecting = true;

  /* ── Always check profiles table first — it is the source of truth.
     user_metadata.role is only set at signup and goes stale when a
     teacher changes the role via Account Manager.               ── */
  try {
    const result = await Promise.race([
      sb.from('profiles').select('role').eq('id', user.id).single(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    const profileRole = (result?.data?.role || '').toLowerCase();

    if (profileRole === 'teacher' || profileRole === 'private') {
      _fadeOut(() => { window.location.href = TEACHER_URL; }); return;
    }
    if (profileRole === 'student') {
      _fadeOut(() => { window.location.href = STUDENT_URL; }); return;
    }
  } catch { /* profiles lookup failed — fall back to metadata */ }

  /* ── Fallback: use user_metadata if profiles lookup failed ── */
  const meta = user.user_metadata || {};
  const metaRole = (meta.role || meta.user_role || '').toLowerCase();
  if (metaRole === 'teacher' || metaRole === 'private') {
    _fadeOut(() => { window.location.href = TEACHER_URL; }); return;
  }

  /* Default: send to student page */
  _fadeOut(() => { window.location.href = STUDENT_URL; });
}

/* ══════════════════════════════════════
   AUTH STATE LISTENER (Google OAuth only)
══════════════════════════════════════ */
let authListenerReady = false;
sb.auth.onAuthStateChange(async (event, session) => {
  if (!authListenerReady) { authListenerReady = true; return; }
  // Never auto-redirect on PASSWORD_RECOVERY — that belongs on update-password.html
  if (event === 'PASSWORD_RECOVERY') return;
  if (event === 'SIGNED_IN' && session && !redirecting) {
    await redirectByRole(session.user);
  }
});
setTimeout(() => { authListenerReady = true; }, 100);

/* ══════════════════════════════════════
   AUTO-REDIRECT IF ALREADY LOGGED IN
   If the user visits the login page while
   already having a valid session, skip the
   form and send them straight to their app.
   SKIP if this is a password recovery link
   (type=recovery in the URL hash) — those
   should land on update-password.html only.
══════════════════════════════════════ */
(async () => {
  // If the URL hash contains a recovery token, redirect to update-password.html
  // instead of auto-logging in. This happens when Supabase appends the token
  // to the login page URL instead of directly hitting update-password.html.
  const hash = window.location.hash;
  if (hash.includes('type=recovery')) {
    _fadeOut(() => {
      window.location.replace('./update-password.html' + hash);
    });
    return;
  }

  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    await redirectByRole(session.user);
  }
})();

/* ══════════════════════════════════════
   SIGN IN
══════════════════════════════════════ */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-pw').value;
  if (!email || !pw) return toast('Please fill in all fields.');

  setLoading('btn-login', true);
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw error;
    toast('Signed in! Redirecting…', 'success');
    await redirectByRole(data.user);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Invalid login')) toast('Incorrect email or password.');
    else if (msg.includes('Email not confirmed')) toast('Please verify your email first.');
    else toast(msg || 'Login failed. Please try again.');
    setLoading('btn-login', false);
  }
}

/* ══════════════════════════════════════
   SIGN UP → sends OTP code to email
══════════════════════════════════════ */
async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pw = document.getElementById('signup-pw').value;

  if (!name || !email || !pw) return toast('Please fill in all fields.');
  if (pw.length < 8) return toast('Password must be at least 8 characters.');

  setLoading('btn-signup', true);
  try {
    const { error } = await sb.auth.signUp({
      email,
      password: pw,
      options: { data: { full_name: name, role: 'student' } }
    });

    if (error) {
      const msg = error.message || '';
      if (msg.includes('already registered')) {
        toast('Email already registered. Try signing in.'); return;
      }
      // "Database error" = profiles table missing but account created — still proceed
      if (!msg.toLowerCase().includes('database error')) throw error;
    }

    // No email verification — sign in immediately after signup
    const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({
      email, password: pw
    });
    if (signInError) {
      toast('Account created! You can now sign in.', 'success');
      setTimeout(() => switchTab('login'), 1500);
      return;
    }
    toast('Account created! Redirecting…', 'success');
    await redirectByRole(signInData.user);

  } catch (err) {
    toast(err.message || 'Sign up failed. Please try again.');
  } finally {
    setLoading('btn-signup', false);
  }
}

/* ══════════════════════════════════════
   SHOW VERIFY PANEL
══════════════════════════════════════ */
function showVerifyPanel(email) {
  // Hide tab row, show verify panel
  document.querySelector('.tab-row').style.display = 'none';
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-verify').classList.add('active');
  document.getElementById('verify-email-label').textContent = email;

  // Auto-focus first digit
  document.getElementById('d1').focus();
}

/* ══════════════════════════════════════
   OTP DIGIT INPUT — auto-advance & paste
══════════════════════════════════════ */
function initOtpInputs() {
  const digits = document.querySelectorAll('.otp-digit');

  digits.forEach((input, idx) => {
    input.addEventListener('input', () => {
      // Only allow single digit
      input.value = input.value.replace(/\D/g, '').slice(-1);
      if (input.value && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }
      checkOtpComplete();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        digits[idx - 1].focus();
      }
    });
  });

  // Handle paste — fill all 6 digits at once
  document.getElementById('otp-inputs').addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData('text').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((ch, i) => {
      if (digits[i]) digits[i].value = ch;
    });
    if (pasted.length === 6) {
      digits[5].focus();
      checkOtpComplete();
    }
  });
}

function checkOtpComplete() {
  const digits = document.querySelectorAll('.otp-digit');
  const code = [...digits].map(d => d.value).join('');
  if (code.length === 6) handleVerify(code);
}

/* ══════════════════════════════════════
   VERIFY OTP CODE
══════════════════════════════════════ */
async function handleVerify(code) {
  if (!code) {
    const digits = document.querySelectorAll('.otp-digit');
    code = [...digits].map(d => d.value).join('');
  }
  if (code.length < 6) return toast('Enter all 6 digits.');

  setLoading('btn-verify', true);
  try {
    const { data, error } = await sb.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: 'signup'
    });
    if (error) throw error;

    toast('Email verified! Redirecting…', 'success');
    await redirectByRole(data.user);

  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('expired') || msg.includes('invalid')) {
      toast('Code is wrong or expired. Request a new one.');
      // Clear digits
      document.querySelectorAll('.otp-digit').forEach(d => d.value = '');
      document.getElementById('d1').focus();
    } else {
      toast(msg || 'Verification failed.');
    }
    setLoading('btn-verify', false);
  }
}

/* ══════════════════════════════════════
   RESEND CODE
══════════════════════════════════════ */
let resendCooldown = 0;

async function handleResend() {
  if (resendCooldown > 0) return;
  if (!pendingEmail) return;

  try {
    await sb.auth.resend({ type: 'signup', email: pendingEmail });
    toast('New code sent!', 'success');

    // 60s cooldown
    resendCooldown = 60;
    const btn = document.getElementById('btn-resend');
    const tick = setInterval(() => {
      resendCooldown--;
      btn.textContent = resendCooldown > 0
        ? `Resend code (${resendCooldown}s)`
        : 'Resend code';
      if (resendCooldown <= 0) clearInterval(tick);
    }, 1000);

  } catch (err) {
    toast('Could not resend. Try again later.');
  }
}

/* ══════════════════════════════════════
   FORGOT PASSWORD
══════════════════════════════════════ */
async function handleReset(e) {
  e.preventDefault();
  const email = document.getElementById('reset-email').value.trim();
  if (!email) return toast('Please enter your email address.');

  setLoading('btn-reset', true);
  try {
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/update-password.html'
    });
    if (error) throw error;
    toast('Reset link sent! Check your inbox.', 'success');
  } catch (err) {
    toast(err.message || 'Could not send reset link.');
  } finally {
    setLoading('btn-reset', false);
  }
}

// Google login removed

/* ══════════════════════════════════════
   UI HELPERS
══════════════════════════════════════ */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active',
      (tab === 'login' && i === 0) || (tab === 'signup' && i === 1)
    );
  });
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('panel-' + tab);
  if (target) target.classList.add('active');
  document.querySelector('.tab-row').style.display = tab === 'reset' ? 'none' : 'flex';
}

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  btn.title = show ? 'Hide password' : 'Show password';
  btn.innerHTML = show
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

let toastTimer;
function toast(message, type = 'error') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 4000);
}

function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = isLoading;
  if (isLoading) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span> Please wait…`;
  } else {
    btn.innerHTML = btn.dataset.original || btn.innerHTML;
  }
}

/* ══════════════════════════════════════
   PARTICLES & RIPPLE
══════════════════════════════════════ */
function initParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left:    ${Math.random() * 100}%;
      bottom:  ${Math.random() * 30}%;
      --dur:   ${4 + Math.random() * 6}s;
      --delay: ${Math.random() * 8}s;
      width:   ${2 + Math.random() * 3}px;
      height:  ${2 + Math.random() * 3}px;
    `;
    container.appendChild(p);
  }
}

function initRipple() {
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', e => {
      const r = document.createElement('span');
      r.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.cssText = `
        width:  ${size}px; height: ${size}px;
        left:   ${e.clientX - rect.left - size / 2}px;
        top:    ${e.clientY - rect.top - size / 2}px;
      `;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 700);
    });
  });
}

initParticles();
initRipple();
initOtpInputs();
_fadeIn(400);

// ── Bypass attempt detection ──────────────────────────────
if (sessionStorage.getItem('bypass_attempt') === '1') {
  sessionStorage.removeItem('bypass_attempt');
  setTimeout(() => toast("🔒 Don't bypass the login page. Please sign in first.", 'error'), 300);
}
