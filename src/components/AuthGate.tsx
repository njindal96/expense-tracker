'use client';

import { useState, useEffect, useRef } from 'react';
import { LIGHT, DARK, type Theme } from '@/lib/theme';

interface AuthGateProps {
  onAuth: () => void;
}

export default function AuthGate({ onAuth }: AuthGateProps) {
  const [pw, setPw] = useState('');
  const [shake, setShake] = useState(false);
  const [touched, setTouched] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef('');
  const masterPw = process.env.NEXT_PUBLIC_MASTER_PASSWORD ?? '';
  const theme: Theme = isDark ? DARK : LIGHT;

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ledger_authed') === 'true') {
      onAuth();
    }
  }, [onAuth]);

  const submitTry = (next: string) => {
    setPw(next);
    setTouched(true);
    pwRef.current = next;
    if (next === masterPw) {
      setTimeout(() => {
        localStorage.setItem('ledger_authed', 'true');
        onAuth();
      }, 260);
    } else if (next.length >= masterPw.length) {
      setShake(true);
      setTimeout(() => { setShake(false); setPw(''); pwRef.current = ''; }, 440);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        const next = pwRef.current.slice(0, -1);
        setPw(next); pwRef.current = next; setTouched(true);
        return;
      }
      if (e.key.length === 1 && pwRef.current.length < masterPw.length) {
        e.preventDefault();
        submitTry(pwRef.current + e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterPw]);

  const now = new Date();
  const dateLine = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
      {/* Theme toggle */}
      <button
        onClick={() => setIsDark(v => !v)}
        style={{ position: 'fixed', top: 20, right: 20, width: 36, height: 36, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, background: theme.surface, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        )}
      </button>

      <div style={{ width: '100%', maxWidth: 460, height: 580, border: `1px solid ${theme.borderSoft}`, borderRadius: 28, overflow: 'hidden', boxShadow: `0 30px 70px ${theme.shadow}`, background: theme.bg, position: 'relative', display: 'flex', flexDirection: 'column', padding: '52px 40px 36px' }}>
        {/* Grain overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 30% 20%, rgba(180,140,90,0.08), transparent 45%), radial-gradient(circle at 70% 80%, rgba(120,90,60,0.06), transparent 50%)`, mixBlendMode: 'multiply' }} />

        {/* Top label */}
        <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, color: theme.muted, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: theme.muted, opacity: 0.45, display: 'inline-block' }} />
          Private ledger
        </div>

        {/* Center: wordmark + date */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: theme.muted, letterSpacing: '0.005em' }}>{dateLine}</div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 72, lineHeight: 0.92, letterSpacing: '-0.02em', color: theme.text }}>
            Personal
            <span style={{ display: 'block', fontStyle: 'italic', color: theme.accent }}>Expense</span>
            Tracker
          </h1>
          <div style={{ fontSize: 13.5, lineHeight: 1.4, color: theme.muted, maxWidth: 240, marginTop: 4 }}>
            A calm place for your personal finances.
          </div>
        </div>

        {/* PIN dots */}
        <div
          style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10, transition: 'transform 0.3s', transform: shake ? 'translateX(-8px)' : 'none' }}
          className={shake ? 'shake-anim' : ''}
        >
          {Array.from({ length: masterPw.length }).map((_, i) => {
            const filled = i < pw.length;
            return (
              <span key={i} style={{ width: 11, height: 11, borderRadius: 99, border: `1px solid ${filled ? theme.text : theme.borderSoft}`, background: filled ? theme.text : 'transparent', transition: 'all 0.18s', transform: filled ? 'scale(1.05)' : 'scale(1)' }} />
            );
          })}
          {/* Hidden input catches keyboard on mobile */}
          <input
            ref={inputRef}
            type="password"
            inputMode="text"
            value={pw}
            onChange={(e) => submitTry(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', inset: 0, cursor: 'default', border: 0 }}
            aria-label="Master password"
          />
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: theme.muted, marginBottom: 14, letterSpacing: '0.01em', opacity: touched && pw.length > 0 && pw.length < masterPw.length ? 0.55 : 0.95 }}>
          {touched && pw.length > 0 && pw.length < masterPw.length
            ? `${pw.length} of ${masterPw.length} characters`
            : 'Type to enter your password'}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11, color: theme.soft, letterSpacing: '0.01em' }}>
          <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
            <path d="M2 6V4a3.5 3.5 0 017 0v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            <rect x="1" y="6" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1"/>
          </svg>
          Synced via Supabase
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
        }
        .shake-anim { animation: shake 0.42s cubic-bezier(0.4,0,0.2,1); }
      `}</style>
    </div>
  );
}
