'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    const sb = createClient(supabaseUrl, supabaseAnonKey);
    setSupabase(sb);

    // Check for existing session
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session.user.user_metadata?.role || 'student';
        if (role === 'teacher') {
          router.push('/teacher');
        } else {
          router.push('/student');
        }
      }
    });
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pw').value;

    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push('/student');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-pw').value;

    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setActiveTab('verify');
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    if (!supabase) return;

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      alert(error.message);
    } else {
      alert('Password reset link sent to your email');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0d0820 0%, #1a0f3a 100%);
          padding: 2rem;
        }
        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 2rem;
        }
        .logo-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-text {
          font-family: var(--font-syne), 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f1e9ff;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .card-title {
          font-family: var(--font-syne), 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f1e9ff;
          margin-bottom: 0.5rem;
        }
        .card-title span {
          background: linear-gradient(135deg, #a855f7, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .card-sub {
          color: #a78fbf;
          font-size: 14px;
          margin-bottom: 1.5rem;
        }
        .tab-row {
          display: flex;
          gap: 8px;
          margin-bottom: 1.5rem;
        }
        .tab-btn {
          flex: 1;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #a78fbf;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-color: transparent;
          color: #fff;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-group label {
          display: block;
          color: #d4c4e8;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon-svg {
          position: absolute;
          left: 14px;
          color: #8b7aa8;
          pointer-events: none;
        }
        .input-wrap input {
          width: 100%;
          padding: 12px 14px 12px 44px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #f1e9ff;
          font-size: 14px;
          transition: all 0.2s;
        }
        .input-wrap input:focus {
          border-color: #a855f7;
          background: rgba(255, 255, 255, 0.08);
        }
        .input-wrap input::placeholder {
          color: #6b5a8a;
        }
        .toggle-pw {
          position: absolute;
          right: 12px;
          background: transparent;
          color: #8b7aa8;
          padding: 4px;
          border-radius: 4px;
        }
        .toggle-pw:hover {
          color: #a855f7;
        }
        .forgot-link {
          color: #a855f7;
          font-size: 13px;
          cursor: pointer;
        }
        .forgot-link:hover {
          text-decoration: underline;
        }
        .btn-primary {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: var(--font-dm-sans), 'DM Sans', sans-serif;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s;
          margin-top: 0.5rem;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .card-footer {
          text-align: center;
          color: #8b7aa8;
          font-size: 13px;
          margin-top: 1.5rem;
        }
        .card-footer a {
          color: #a855f7;
          cursor: pointer;
        }
        .card-footer a:hover {
          text-decoration: underline;
        }
        .form-panel {
          display: none;
        }
        .form-panel.active {
          display: block;
        }
        .forgot-link {
          cursor: pointer;
        }
      `}</style>

      <div>
        <div className="logo-wrap">
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="logo-text">iBilib</span>
        </div>

        <div className="glass-card">
          <h1 className="card-title">Welcome <span>Back</span></h1>
          <p className="card-sub">Sign in to access the Aringay NHS digital archive</p>

          <div className="tab-row">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Create Account
            </button>
          </div>

          {/* Login Panel */}
          <div className={`form-panel ${activeTab === 'login' ? 'active' : ''}`}>
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon-svg">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input type="email" id="login-email" placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="login-pw">Password</label>
              <div className="input-wrap">
                <span className="input-icon-svg">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input type="password" id="login-pw" placeholder="••••••••" autoComplete="current-password" />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="forgot-link" onClick={() => setActiveTab('reset')}>Forgot password?</span>
            </div>
            <button className="btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="card-footer">
              Don&apos;t have an account? <a onClick={() => setActiveTab('signup')}>Sign up free</a>
            </div>
          </div>

          {/* Signup Panel */}
          <div className={`form-panel ${activeTab === 'signup' ? 'active' : ''}`}>
            <div className="form-group">
              <label htmlFor="signup-name">Full Name</label>
              <div className="input-wrap">
                <span className="input-icon-svg">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input type="text" id="signup-name" placeholder="Juan dela Cruz" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon-svg">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input type="email" id="signup-email" placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="signup-pw">Password</label>
              <div className="input-wrap">
                <span className="input-icon-svg">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input type="password" id="signup-pw" placeholder="At least 8 characters" autoComplete="new-password" />
              </div>
            </div>
            <button className="btn-primary" onClick={handleSignup} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <div className="card-footer">
              Already have an account? <a onClick={() => setActiveTab('login')}>Sign in</a>
            </div>
          </div>

          {/* Reset Password Panel */}
          <div className={`form-panel ${activeTab === 'reset' ? 'active' : ''}`}>
            <p style={{ color: '#a78fbf', fontSize: '14px', marginBottom: '1.5rem' }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <div className="form-group">
              <label htmlFor="reset-email">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon-svg">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input type="email" id="reset-email" placeholder="you@example.com" />
              </div>
            </div>
            <button className="btn-primary" onClick={handleReset} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <div className="card-footer">
              <a onClick={() => setActiveTab('login')}>← Back to Sign In</a>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#6b5a8a', fontSize: '13px', marginTop: '2rem' }}>
          © 2025 Aringay National High School · iBilib Digital Archive
        </p>
      </div>
    </div>
  );
}
