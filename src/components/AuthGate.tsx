'use client';

import { useState, useEffect } from 'react';
import { LIGHT, DARK, type Theme } from '@/lib/theme';
import { useIsMobile } from '@/lib/useIsMobile';

interface AuthGateProps {
  onAuth: () => void;
}

const PIN_LENGTH = 4;

// 3×4 numpad layout — empty string = invisible spacer
const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const;

function NumKey({ label, onClick, theme }: { label: string; onClick: () => void; theme: Theme }) {
  const isBack = label === '⌫';
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onClick(); }}
      onPointerLeave={() => setPressed(false)}
      style={{
        height: 72, width: '100%', borderRadius: 99,
        border: isBack ? 'none' : `1px solid ${theme.borderSoft}`,
        background: isBack
          ? 'transparent'
          : pressed
            ? theme.surfaceAlt
            : theme.surface,
        color: theme.text,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: pressed ? 'scale(0.94)' : 'scale(1)',
        transition: 'transform 0.08s, background 0.1s',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
        fontFamily: isBack ? 'var(--font-inter), system-ui, sans-serif' : 'var(--font-serif), Georgia, serif',
        fontSize: isBack ? 14 : 28,
        fontWeight: 300,
        letterSpacing: '-0.01em',
      }}
      aria-label={isBack ? 'Backspace' : label}
    >
      {isBack ? (
        <svg width="22" height="18" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/>
          <line x1="18" y1="9" x2="12" y2="15"/>
          <line x1="12" y1="9" x2="18" y2="15"/>
        </svg>
      ) : label}
    </button>
  );
}

export default function AuthGate({ onAuth }: AuthGateProps) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const isMobile = useIsMobile();

  const correctPin = (process.env.NEXT_PUBLIC_MASTER_PASSWORD ?? '').slice(0, PIN_LENGTH);
  const theme: Theme = isDark ? DARK : LIGHT;

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ledger_authed') === 'true') {
      onAuth();
    }
  }, [onAuth]);

  // Also allow physical keyboard input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        setPin(p => p.slice(0, -1));
      } else if (/^\d$/.test(e.key) && pin.length < PIN_LENGTH) {
        pressDigit(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function pressDigit(d: string) {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + d;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      if (next === correctPin) {
        setTimeout(() => {
          localStorage.setItem('ledger_authed', 'true');
          onAuth();
        }, 200);
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(''); }, 460);
      }
    }
  }

  function pressBackspace() {
    setPin(p => p.slice(0, -1));
  }

  const now = new Date();
  const dateLine = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── shared inner content ────────────────────────────────
  const inner = (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', padding: isMobile ? '52px 24px 32px' : '44px 40px 36px' }}>
      {/* Grain */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 30% 20%, rgba(180,140,90,0.08), transparent 45%), radial-gradient(circle at 70% 80%, rgba(120,90,60,0.06), transparent 50%)`, mixBlendMode: 'multiply' }} />

      {/* Top label */}
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, color: theme.muted, display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: theme.muted, opacity: 0.45, display: 'inline-block' }} />
        Private ledger
      </div>

      {/* Wordmark area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, position: 'relative' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: theme.muted }}>{dateLine}</div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif), Georgia, serif', fontSize: isMobile ? 62 : 68, lineHeight: 0.92, letterSpacing: '-0.02em', color: theme.text }}>
          Quiet<span style={{ fontStyle: 'italic', color: theme.accent }}>Books</span>
        </h1>
        <div style={{ fontSize: 13, lineHeight: 1.4, color: theme.muted, maxWidth: 240, marginTop: 2 }}>
          A calm place for the month&apos;s numbers.
        </div>
      </div>

      {/* PIN dots */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 24, position: 'relative' }}>
        <div
          style={{ display: 'flex', gap: 14, justifyContent: 'center' }}
          className={shake ? 'pin-shake' : ''}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => {
            const filled = i < pin.length;
            return (
              <span key={i} style={{
                width: 12, height: 12, borderRadius: 99,
                border: `1.5px solid ${filled ? theme.text : theme.borderSoft}`,
                background: filled ? theme.text : 'transparent',
                transition: 'all 0.15s cubic-bezier(0.2,0.85,0.2,1)',
                transform: filled ? 'scale(1.1)' : 'scale(1)',
                display: 'inline-block',
              }} />
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: theme.muted, letterSpacing: '0.01em' }}>
          {shake ? 'Incorrect PIN' : pin.length === 0 ? 'Enter your PIN' : ' '}
        </div>
      </div>

      {/* Numpad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 10 : 8, position: 'relative' }}>
        {KEYS.map((key, i) => {
          if (key === '') return <div key={i} />;
          return (
            <NumKey
              key={i}
              label={key}
              theme={theme}
              onClick={() => key === '⌫' ? pressBackspace() : pressDigit(key)}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11, color: theme.soft, letterSpacing: '0.01em', marginTop: 20, position: 'relative' }}>
        <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
          <path d="M2 6V4a3.5 3.5 0 017 0v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <rect x="1" y="6" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1"/>
        </svg>
        Synced via Supabase
      </div>
    </div>
  );

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 40, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      {/* Theme toggle */}
      <button
        onClick={() => setIsDark(v => !v)}
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 10, width: 36, height: 36, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, background: theme.surface, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        aria-label="Toggle theme"
      >
        {isDark
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        }
      </button>

      {/* Card / full-screen */}
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : 420,
        border: isMobile ? 'none' : `1px solid ${theme.borderSoft}`,
        borderRadius: isMobile ? 0 : 28,
        overflow: 'hidden',
        boxShadow: isMobile ? 'none' : `0 30px 70px ${theme.shadow}`,
        background: theme.bg,
        minHeight: isMobile ? '100vh' : 'auto',
      }}>
        {inner}
      </div>

      <style>{`
        @keyframes pinShake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          60%      { transform: translateX(-6px); }
          80%      { transform: translateX(6px); }
        }
        .pin-shake { animation: pinShake 0.46s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </div>
  );
}
