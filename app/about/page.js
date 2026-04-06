'use client';

export default function AboutPage() {
  // This page uses Static Site Generation (SSG) for SEO
  // Content is pre-rendered at build time

  return (
    <div className="about-page">
      <style jsx>{`
        .about-page {
          min-height: 100vh;
          background: var(--background);
          color: var(--foreground);
          padding: 0 24px;
        }
        .navbar {
          background: rgba(13, 8, 32, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 16px 24px;
          margin-bottom: 40px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
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
        .hero {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          padding: 60px 20px;
        }
        .hero h1 {
          font-family: var(--font-syne), Syne, sans-serif;
          font-size: 48px;
          font-weight: 800;
          color: #f1e9ff;
          margin-bottom: 16px;
        }
        .hero .highlight {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero p {
          color: #a78fbf;
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-top: 60px;
        }
        .feature-card {
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
        .feature-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .feature-card h3 {
          color: #f1e9ff;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .feature-card p {
          color: #a78fbf;
          font-size: 14px;
          line-height: 1.5;
        }
        .cta-section {
          max-width: 600px;
          margin: 60px auto 0;
          padding: 32px;
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(168, 85, 247, 0.1));
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 16px;
          text-align: center;
        }
        .cta-section h2 {
          font-family: var(--font-syne), Syne, sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #f1e9ff;
          margin-bottom: 12px;
        }
        .cta-section p {
          color: #a78fbf;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .btn-cta {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s;
        }
        .btn-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
        }
        footer {
          max-width: 800px;
          margin: 80px auto 40px;
          padding: 24px;
          text-align: center;
          color: #6b5a8a;
          font-size: 13px;
        }
      `}</style>

      <nav className="navbar">
        <div className="logo">
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
      </nav>

      <main className="hero">
        <h1>
          About <span className="highlight">iBilib</span>
        </h1>
        <p>
          iBilib is the official digital archive of Aringay National High School,
          designed to provide students and teachers with easy access to educational
          resources, research materials, and learning content.
        </p>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3>Research Studies</h3>
            <p>Access student research papers, scientific studies, and academic documentation from Aringay NHS.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3>Learning Materials</h3>
            <p>Find modules, guides, study resources, and educational content for various subjects.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </div>
            <h3>Writing Prompts</h3>
            <p>Explore creative writing prompts, essay topics, and language learning resources.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <h3>BILIBot AI</h3>
            <p>Get instant help from our AI assistant for finding resources and answering questions.</p>
          </div>
        </div>

        <div className="cta-section">
          <h2>Ready to Explore?</h2>
          <p>Sign in to access the full archive of educational resources.</p>
          <a href="/" className="btn-cta">Sign In to iBilib</a>
        </div>
      </main>

      <footer>
        <p>© 2025 iBilib · Aringay National High School</p>
        <p style={{ marginTop: '8px' }}>Built with care for students and teachers</p>
      </footer>
    </div>
  );
}
