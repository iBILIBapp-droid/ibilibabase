'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import AuthBar from '@/components/AuthBar';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default function TeacherPage() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.replace('/');
        return;
      }
      // Check role - only allow teachers
      supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
        const role = data?.role || session.user.user_metadata?.role || 'student';
        if (role !== 'teacher') {
          document.body.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#1a0820;color:#f1e9ff;font-family:sans-serif;text-align:center;padding:2rem">
              <div style="font-size:48px;margin-bottom:1rem">🔒</div>
              <h1 style="font-size:24px;margin-bottom:0.5rem">Access Denied</h1>
              <p style="color:#a78fbf;margin-bottom:1.5rem">This page is for teachers only.</p>
              <button onclick="window.location.replace('/')" style="padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#a855f7);border:none;border-radius:50px;color:#fff;font-weight:600;cursor:pointer">Go to Login</button>
            </div>
          `;
          return;
        }
      });
      setLoading(false);
    });

    const storedTheme = localStorage.getItem('ibiblib-theme') || 'dark';
    setTheme(storedTheme);
    if (storedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('ibiblib-theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0d0820'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '3px solid rgba(168,85,247,.2)',
            borderTopColor: '#a855f7',
            animation: 'spin .7s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 800, color: '#f1e9ff' }}>
            i<span style={{ color: '#a855f7' }}>Bilib</span>
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-page">
      <style jsx>{`
        .teacher-page {
          min-height: 100vh;
          background: var(--background);
          color: var(--foreground);
        }
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(13, 8, 32, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          gap: 24px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-family: var(--font-syne), Syne, sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #f1e9ff;
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-tabs {
          display: flex;
          gap: 8px;
        }
        .nav-tab {
          padding: 8px 16px;
          border-radius: 8px;
          color: #a78fbf;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          border: none;
          font-family: var(--font-dm-sans), DM Sans, sans-serif;
        }
        .nav-tab:hover,
        .nav-tab.active {
          background: rgba(251, 191, 36, 0.15);
          color: #f1e9ff;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .action-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #a78fbf;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f1e9ff;
        }
        main {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 24px;
        }
        .stat-card {
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
        .stat-card h3 {
          color: #a78fbf;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .upload-zone {
          grid-column: 1 / -1;
          padding: 48px;
          background: rgba(255, 255, 255, 0.02);
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .upload-zone:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(251, 191, 36, 0.3);
        }
        .upload-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .nav-tabs { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
        .mobile-menu-dropdown {
          display: flex;
          flex-direction: column;
          background: rgba(13, 8, 32, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px;
          gap: 4px;
        }
        .mob-link {
          color: #f1e9ff;
          font-size: 15px;
          font-weight: 500;
          padding: 12px 16px;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          transition: background 0.2s;
        }
        .mob-link:hover, .mob-link.active {
          background: rgba(251, 191, 36, 0.15);
        }
        .mob-auth-wrap {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 16px;
          margin-top: 8px;
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span>iBilib Teacher</span>
          </div>

          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Files
            </button>
            <button
              className={`nav-tab ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              Manage Content
            </button>
          </div>

          <div className="nav-right">
            <button className="action-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            <AuthBar portalType="teacher" />
            <button className="action-btn mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="mobile-menu-dropdown">
            <span className={`mob-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>
              Dashboard
            </span>
            <span className={`mob-link ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => { setActiveTab('upload'); setMobileMenuOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Upload Files
            </span>
            <span className={`mob-link ${activeTab === 'manage' ? 'active' : ''}`} onClick={() => { setActiveTab('manage'); setMobileMenuOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Manage Content
            </span>
            <div className="mob-auth-wrap">
              <AuthBar portalType="teacher" isMobileMenu={true} />
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {activeTab === 'dashboard' && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '32px', fontWeight: 700, color: '#f1e9ff', marginBottom: '8px' }}>
                Welcome Back!
              </h1>
              <p style={{ color: '#a78fbf', fontSize: '16px' }}>
                Manage your teaching resources and student materials
              </p>
            </div>

            <div className="dashboard-grid">
              <div className="stat-card">
                <h3>Total Resources</h3>
                <div className="stat-value">24</div>
              </div>
              <div className="stat-card">
                <h3>Research Files</h3>
                <div className="stat-value">12</div>
              </div>
              <div className="stat-card">
                <h3>Learning Materials</h3>
                <div className="stat-value">8</div>
              </div>
              <div className="stat-card">
                <h3>Writing Prompts</h3>
                <div className="stat-value">4</div>
              </div>

              <div className="upload-zone" onClick={() => setActiveTab('upload')}>
                <div className="upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h2 style={{ color: '#f1e9ff', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                  Upload New Files
                </h2>
                <p style={{ color: '#a78fbf', fontSize: '14px' }}>
                  Click here or drag and drop files to upload
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'upload' && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '32px', fontWeight: 700, color: '#f1e9ff', marginBottom: '8px' }}>
                Upload Files
              </h1>
              <p style={{ color: '#a78fbf', fontSize: '16px' }}>
                Add new resources to the digital archive
              </p>
            </div>

            <div className="dashboard-grid">
              <div className="upload-zone">
                <div className="upload-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h2 style={{ color: '#f1e9ff', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                  Drop files here
                </h2>
                <p style={{ color: '#a78fbf', fontSize: '14px', marginBottom: '16px' }}>
                  or click to browse
                </p>
                <p style={{ color: '#6b5a8a', fontSize: '12px' }}>
                  PDF, DOC, DOCX, PPT, PPTX, TXT · Max 10 files
                </p>
              </div>
            </div>
          </>
        )}

        {activeTab === 'manage' && (
          <>
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{ fontFamily: 'var(--font-syne), Syne, sans-serif', fontSize: '32px', fontWeight: 700, color: '#f1e9ff', marginBottom: '8px' }}>
                Manage Content
              </h1>
              <p style={{ color: '#a78fbf', fontSize: '16px' }}>
                View and organize your uploaded resources
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <p style={{ color: '#a78fbf', textAlign: 'center', padding: '40px' }}>
                Content management features coming soon...
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
