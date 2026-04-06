'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import AuthBar from '@/components/AuthBar';
import {
  SB_URL_ORG1, SB_KEY_ORG1,
  SB_URL_ORG2, SB_KEY_ORG2,
  SB_URL_ORG3, SB_KEY_ORG3,
  listPath, crawlAll, formatSize
} from '@/lib/supabase';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default function StudentPage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentPath, setCurrentPath] = useState('');
  const [currentFiles, setCurrentFiles] = useState([]);
  const [currentRootScope, setCurrentRootScope] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [bilibotOpen, setBilibotOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize and check auth
  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.replace('/');
        return;
      }
      // Check role
      supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
        const role = data?.role || session.user.user_metadata?.role || 'student';
        if (role === 'teacher') {
          window.location.replace('/teacher');
          return;
        }
        if (role === 'private') {
          window.location.replace('/');
          return;
        }
      });
      setLoading(false);
    });

    // Load stored theme
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

  const showPage = (page) => {
    setCurrentPage(page);
    if (page === 'home') {
      setCurrentPath('');
      setCurrentRootScope('');
      setCurrentFiles([]);
      setSearchQuery('');
    }
  };

  const loadCategory = useCallback(async (root, title) => {
    setCurrentRootScope(root);
    setLoading(true);

    try {
      const [org1Files, org2Files, org3Files] = await Promise.all([
        crawlAll(root, [], SB_URL_ORG1, SB_KEY_ORG1),
        crawlAll(root, [], SB_URL_ORG2, SB_KEY_ORG2),
        crawlAll(root, [], SB_URL_ORG3, SB_KEY_ORG3),
      ]);

      const allDocs = [...org1Files, ...org2Files, ...org3Files];
      const folderMap = new Map();
      const rootDocs = [];

      allDocs.forEach(f => {
        const dirPath = f.fullPath.substring(0, f.fullPath.lastIndexOf('/'));
        if (dirPath === root || dirPath === root + '/') {
          rootDocs.push(f);
          return;
        }

        const key = dirPath + '::' + f.orgUrl;
        if (!folderMap.has(key)) {
          folderMap.set(key, {
            name: dirPath.replace(/\//g, ' › ').replace(root + ' ', ''),
            fullPath: dirPath,
            orgUrl: f.orgUrl,
            orgKey: f.orgKey
          });
        }
      });

      setCurrentPage('category');
      setCurrentFiles([...Array.from(folderMap.values()), ...rootDocs]);
    } catch (e) {
      console.error('Error loading category:', e);
    }
    setLoading(false);
  }, []);

  const navigateToFolder = useCallback(async (path, title) => {
    setCurrentPath(path);
    setCurrentRootScope(path.split('/')[0]);
    setLoading(true);

    try {
      const items = await listPath(path, SB_URL_ORG3, SB_KEY_ORG3);
      const files = items
        .filter(i => i.id && i.name !== '.emptyFolderPlaceholder' && i.name.match(/\.(pdf|doc|docx)$/i))
        .map(f => ({
          name: f.name,
          fullPath: `${path}/${f.name}`,
          size: f.metadata?.size,
          orgUrl: SB_URL_ORG3,
          orgKey: SB_KEY_ORG3
        }));

      setCurrentFiles(files);
      setCurrentPage('browser');
    } catch (e) {
      console.error('Error navigating:', e);
    }
    setLoading(false);
  }, []);

  const handleSearch = useCallback((value) => {
    setSearchQuery(value);
    // Implement search logic here
  }, []);

  const openViewer = (url) => {
    window.open(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`, '_blank');
  };

  const directDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url + (url.includes('?') ? '&' : '?') + 'download=';
    link.setAttribute('download', filename);
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && currentPage === 'home' && currentPath === '') {
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
    <div className="student-page">
      <style jsx>{`
        .student-page {
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
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-links {
          display: flex;
          gap: 8px;
        }
        .nav-link {
          padding: 8px 16px;
          border-radius: 8px;
          color: #a78fbf;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-link:hover,
        .nav-link.active {
          background: rgba(168, 85, 247, 0.15);
          color: #f1e9ff;
        }
        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          min-width: 200px;
        }
        .search-input {
          background: transparent;
          border: none;
          outline: none;
          color: #f1e9ff;
          font-size: 14px;
          width: 100%;
        }
        .search-input::placeholder {
          color: #6b5a8a;
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
        .hero {
          text-align: center;
          padding: 60px 20px;
          position: relative;
        }
        .hero h1 {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 16px;
          color: #f1e9ff;
        }
        .amber-highlight {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero p {
          color: #a78fbf;
          font-size: 18px;
          max-width: 600px;
          margin: 0 auto 32px;
        }
        .hero-cta {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-cta-primary {
          padding: 14px 28px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s;
        }
        .btn-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
        }
        .btn-cta-ghost {
          padding: 14px 28px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #f1e9ff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cta-ghost:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        .cards-section {
          padding: 40px 0;
        }
        .section-label {
          text-align: center;
          color: #a78fbf;
          font-size: 14px;
          margin-bottom: 24px;
        }
        .category-stack {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        .liquid-card {
          position: relative;
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .liquid-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(168, 85, 247, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }
        .card-icon-wrap {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card-inner h3 {
          color: #f1e9ff;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .card-inner p {
          color: #a78fbf;
          font-size: 13px;
        }
        .hidden {
          display: none !important;
        }
        .bilibot-fab {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.5);
          transition: all 0.3s;
          z-index: 1000;
        }
        .bilibot-fab:hover {
          transform: scale(1.1);
        }
        .bilibot-panel {
          position: fixed;
          bottom: 90px;
          right: 20px;
          width: 380px;
          max-height: 500px;
          background: rgba(30, 20, 50, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 1000;
        }
        .bilibot-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .bilibot-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bilibot-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          overflow: hidden;
        }
        .bilibot-name {
          color: #f1e9ff;
          font-weight: 600;
          font-size: 14px;
        }
        .bilibot-status {
          color: #a78fbf;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .bilibot-dot {
          width: 6px;
          height: 6px;
          background: #34d399;
          border-radius: 50%;
        }
        .bilibot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bilibot-msg {
          display: flex;
          gap: 10px;
        }
        .bilibot-msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .bilibot-bubble {
          background: rgba(255, 255, 255, 0.05);
          padding: 10px 14px;
          border-radius: 12px;
          color: #f1e9ff;
          font-size: 14px;
          max-width: 80%;
        }
        .bilibot-input-row {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .bilibot-input {
          flex: 1;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #f1e9ff;
          font-size: 14px;
          outline: none;
        }
        .bilibot-input:focus {
          border-color: #a855f7;
        }
        .bilibot-send {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hero h1 { font-size: 32px; }
          .bilibot-panel {
            width: calc(100vw - 40px);
            right: 20px;
            left: 20px;
            bottom: 90px;
          }
          .search-wrap { display: none !important; }
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
        .mob-link:hover {
          background: rgba(255, 255, 255, 0.08);
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
          <div className="logo" onClick={() => showPage('home')}>
            <div className="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span>iBilib</span>
          </div>

          <div className="nav-links">
            <span
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => showPage('home')}
            >
              Home
            </span>
            <span className="nav-link" onClick={() => loadCategory('research', 'Research Studies')}>
              Research
            </span>
            <span className="nav-link" onClick={() => loadCategory('materials', 'Learning Materials')}>
              Materials
            </span>
            <span className="nav-link" onClick={() => loadCategory('prompts', 'Writing Prompts')}>
              Prompts
            </span>
          </div>

          <div className="nav-right">
            <div className="search-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
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
            <AuthBar portalType="student" />
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
            <span className="mob-link" onClick={() => { showPage('home'); setMobileMenuOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              Home
            </span>
            <span className="mob-link" onClick={() => { loadCategory('research', 'Research Studies'); setMobileMenuOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Research Studies
            </span>
            <span className="mob-link" onClick={() => { loadCategory('materials', 'Learning Materials'); setMobileMenuOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              Learning Materials
            </span>
            <span className="mob-link" onClick={() => { loadCategory('prompts', 'Writing Prompts'); setMobileMenuOpen(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
              Writing Prompts
            </span>
            <div className="mob-auth-wrap">
              <AuthBar portalType="student" isMobileMenu={true} />
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {/* Home Page */}
        {currentPage === 'home' && (
          <section className="hero">
            <h1>
              Access Your <span className="amber-highlight">Learning</span> Resources
            </h1>
            <p>
              Explore the Aringay NHS digital archive — research studies, learning materials, and writing prompts, all in one place.
            </p>
            <div className="hero-cta">
              <button className="btn-cta-primary" onClick={() => loadCategory('research', 'Research Studies')}>
                Browse Archive
              </button>
              <button className="btn-cta-ghost" onClick={() => loadCategory('materials', 'Learning Materials')}>
                View Materials
              </button>
            </div>

            <div className="cards-section">
              <div className="section-label">Browse by Category</div>
              <div className="category-stack">
                <div className="liquid-card" onClick={() => loadCategory('research', 'Research Studies')}>
                  <div className="card-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <div className="card-inner">
                    <h3>Research Studies</h3>
                    <p>Student research archives and scientific papers</p>
                  </div>
                </div>
                <div className="liquid-card" onClick={() => loadCategory('materials', 'Learning Materials')}>
                  <div className="card-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <div className="card-inner">
                    <h3>Learning Materials</h3>
                    <p>Modules, guides, and study resources</p>
                  </div>
                </div>
                <div className="liquid-card" onClick={() => loadCategory('prompts', 'Writing Prompts')}>
                  <div className="card-icon-wrap">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" />
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                      <path d="M2 2l7.586 7.586" />
                      <circle cx="11" cy="11" r="2" />
                    </svg>
                  </div>
                  <div className="card-inner">
                    <h3>Writing Prompts</h3>
                    <p>Task repository and creative writing tasks</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Category/Browser Pages */}
        {(currentPage === 'category' || currentPage === 'browser') && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <button
                onClick={() => showPage('home')}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#a78fbf',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
              <h2 style={{ color: '#f1e9ff', fontSize: '24px', fontWeight: 700 }}>
                {currentPage === 'category' ? 'Folders' : 'Files'}
              </h2>
            </div>

            <div className="category-stack">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="liquid-card" style={{ opacity: 0.5 }}>
                    <div className="card-icon-wrap" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    <div className="card-inner">
                      <div style={{ height: '16px', width: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '8px' }} />
                      <div style={{ height: '12px', width: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                    </div>
                  </div>
                ))
              ) : (
                currentFiles.map((file, i) => (
                  <div
                    key={i}
                    className="liquid-card"
                    onClick={() => file.fullPath ? navigateToFolder(file.fullPath, file.name) : openViewer(`${file.orgUrl}/storage/v1/object/public/archives/${file.fullPath}`)}
                  >
                    <div className="card-icon-wrap">
                      {file.fullPath ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                    </div>
                    <div className="card-inner">
                      <h3>{file.name.replace(/_/g, ' ')}</h3>
                      <p>{file.fullPath ? 'Document Folder' : formatSize(file.size)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* BILIBot FAB */}
      <button
        className="bilibot-fab"
        onClick={() => setBilibotOpen(!bilibotOpen)}
        aria-label="Open BILIBot"
      >
        <img
          src="/ibilib/image/BILIBot.png"
          alt="BILIBot"
          style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%' }}
        />
      </button>

      {/* BILIBot Panel */}
      {bilibotOpen && (
        <div className="bilibot-panel">
          <div className="bilibot-header">
            <div className="bilibot-header-left">
              <div className="bilibot-avatar">
                <img src="/ibilib/image/BILIBot.png" alt="BILIBot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              </div>
              <div>
                <div className="bilibot-name">BILIBot</div>
                <div className="bilibot-status">
                  <span className="bilibot-dot" />
                  Online
                </div>
              </div>
            </div>
            <button
              onClick={() => setBilibotOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#a78fbf', cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="bilibot-messages">
            <div className="bilibot-msg">
              <div className="bilibot-msg-avatar">
                <img src="/ibilib/image/BILIBot.png" alt="BILIBot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
              </div>
              <div className="bilibot-bubble">
                Hi! I&apos;m <strong>BILIBot</strong> — your AI assistant for iBilib. Ask me anything about research, learning materials, writing prompts, or anything you need help with.
              </div>
            </div>
          </div>

          <div className="bilibot-input-row">
            <input
              type="text"
              className="bilibot-input"
              placeholder="Ask BILIBot anything..."
              disabled
            />
            <button className="bilibot-send" disabled>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
