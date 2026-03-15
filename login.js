/* ═══════════════════════════════════════
   iBilib Login — JavaScript
   login.js
═══════════════════════════════════════ */

const SUPABASE_URL  = 'https://yapnbwxerwppsepcdcxi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const STUDENT_URL = '/iBilib/index.html';
const TEACHER_URL = '/iBILIB%20teacher/index.html';

/* ── store email between signup → verify steps ── */
let pendingEmail = '';

/* ══════════════════════════════════════
   REDIRECT BY ROLE
══════════════════════════════════════ */
let redirecting = false;

async function redirectByRole(user) {
  if (redirecting) return;
  redirecting = true;

  const meta     = user.user_metadata || {};
  const metaRole = (meta.role || meta.user_role || '').toLowerCase();

  if (metaRole === 'teacher' || metaRole === 'private') {
    window.location.href = TEACHER_URL; return;
  }
  if (metaRole === 'student') {
    window.location.href = STUDENT_URL; return;
  }

  try {
    const result = await Promise.race([
      sb.from('profiles').select('role').eq('id', user.id).single(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    const role = (result?.data?.role || '').toLowerCase();
    window.location.href = (role === 'teacher' || role === 'private') ? TEACHER_URL : STUDENT_URL;
  } catch {
    window.location.href = STUDENT_URL;
  }
}

/* ══════════════════════════════════════
   AUTH STATE LISTENER (Google OAuth only)
══════════════════════════════════════ */
let authListenerReady = false;
sb.auth.onAuthStateChange(async (event, session) => {
  if (!authListenerReady) { authListenerReady = true; return; }
  if (event === 'SIGNED_IN' && session && !redirecting) {
    await redirectByRole(session.user);
  }
});
setTimeout(() => { authListenerReady = true; }, 100);

/* ══════════════════════════════════════
   SIGN IN
══════════════════════════════════════ */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  if (!email || !pw) return toast('Please fill in all fields.');

  setLoading('btn-login', true);
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) throw error;
    toast('Signed in! Redirecting…', 'success');
    await redirectByRole(data.user);
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('Invalid login'))        toast('Incorrect email or password.');
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
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pw    = document.getElementById('signup-pw').value;

  if (!name || !email || !pw) return toast('Please fill in all fields.');
  if (pw.length < 8)          return toast('Password must be at least 8 characters.');

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
  const code   = [...digits].map(d => d.value).join('');
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
      type:  'signup'
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

/* ══════════════════════════════════════
   GOOGLE OAUTH
══════════════════════════════════════ */
async function handleGoogle() {
  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://ibilibanhs.vercel.app/login.html' }
    });
    if (error) throw error;
  } catch (err) {
    toast(err.message || 'Google sign-in failed.');
  }
}

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
  const show  = input.type === 'password';
  input.type  = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}

let toastTimer;
function toast(message, type = 'error') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className   = `show ${type}`;
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
      const r    = document.createElement('span');
      r.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.style.cssText = `
        width:  ${size}px; height: ${size}px;
        left:   ${e.clientX - rect.left - size / 2}px;
        top:    ${e.clientY - rect.top  - size / 2}px;
      `;
      btn.appendChild(r);
      setTimeout(() => r.remove(), 700);
    });
  });
}

initParticles();
initRipple();
initOtpInputs();
