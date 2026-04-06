'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default function AuthBar({ portalType = 'student', isMobileMenu = false }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        router.push('/');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '8px', padding: '6px 13px' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      id="_auth-bar"
      className={isMobileMenu ? "mobile-menu-auth" : ""}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative'
      }}
    >
      {/* User Pill / Profile Details */}
      {isMobileMenu ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'grid', placeItems: 'center',
              fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: '#f1e9ff', fontSize: '15px' }}>{fullName}</div>
              <div style={{ fontSize: '13px', color: '#a78fbf' }}>
                {portalType === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px',
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: '10px', color: '#fca5a5', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              justifyContent: 'center'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      ) : (
        <>
          <div
            id="_user-pill"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 13px 6px 7px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.13)',
              borderRadius: '50px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
              color: '#f1e9ff',
              fontSize: '13px',
              fontWeight: 500,
              maxWidth: '180px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.25)';
            }}
          >
            <div
              id="_avatar"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span>{fullName}</span>
          </div>

          {/* Dropdown Menu */}
          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                id="_user-dropdown"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'rgba(30, 20, 50, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '10px',
                  minWidth: '200px',
                  zIndex: 9999,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  animation: 'dropdownSlide 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transformOrigin: 'top right',
                }}
              >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, color: '#f1e9ff', fontSize: '14px' }}>{fullName}</div>
                  <div style={{ fontSize: '12px', color: '#a78fbf' }}>
                    {portalType === 'teacher' ? 'Teacher Portal' : 'Student Portal'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    background: 'rgba(248,113,113,0.08)',
                    border: '1px solid rgba(248,113,113,0.15)',
                    borderRadius: '10px',
                    color: '#fca5a5',
                    fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(248,113,113,0.2)';
                    e.target.style.borderColor = 'rgba(248,113,113,0.35)';
                    e.target.style.transform = 'translateX(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(248,113,113,0.08)';
                    e.target.style.borderColor = 'rgba(248,113,113,0.15)';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            </>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @media (max-width: 768px) {
          #_auth-bar:not(.mobile-menu-auth) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
