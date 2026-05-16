// lock-screen.jsx — Minimalist password gate. Persists unlock to localStorage.

const MASTER_PASSWORD = 'Nj@150596'; // mirrors the PRD's env var

function LockScreen({ onUnlock, theme }) {
  const [pw, setPw] = React.useState('');
  const [shake, setShake] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const inputRef = React.useRef(null);
  const pwRef = React.useRef('');

  // Keep a ref in sync so the keydown handler reads the latest value
  React.useEffect(() => { pwRef.current = pw; }, [pw]);

  const submitTry = (next) => {
    setPw(next);
    setTouched(true);
    pwRef.current = next;
    if (next === MASTER_PASSWORD) {
      setTimeout(() => onUnlock(), 250);
    } else if (next.length >= MASTER_PASSWORD.length) {
      setShake(true);
      setTimeout(() => { setShake(false); setPw(''); pwRef.current = ''; }, 420);
    }
  };

  React.useEffect(() => {
    // Focus the hidden input on mount so mobile keyboards pop
    const t = setTimeout(() => inputRef.current?.focus(), 350);

    // Catch keystrokes anywhere — clicking isn't strictly required
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        const next = pwRef.current.slice(0, -1);
        setPw(next);
        pwRef.current = next;
        setTouched(true);
        return;
      }
      if (e.key.length === 1 && pwRef.current.length < MASTER_PASSWORD.length) {
        e.preventDefault();
        const next = pwRef.current + e.key;
        submitTry(next);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, []);

  const onChange = (e) => {
    const v = e.target.value;
    submitTry(v);
  };

  const now = new Date(2026, 4, 16, 9, 41);
  const dateLine = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="ls-root" style={{ background: theme.bg, color: theme.text }}>
      {/* Decorative grain */}
      <div className="ls-grain" />

      {/* Tiny top label */}
      <div className="ls-top" style={{ color: theme.muted }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: theme.muted, display: 'inline-block', marginRight: 8, opacity: 0.45 }} />
        Private ledger
      </div>

      {/* Centerpiece */}
      <div className="ls-center">
        <div className="ls-date" style={{ color: theme.muted }}>{dateLine}</div>
        <h1 className="ls-wordmark" style={{ color: theme.text }}>
          Quiet<span className="ls-it" style={{ color: theme.accentMuted }}>Books</span>
        </h1>
        <div className="ls-tagline" style={{ color: theme.muted }}>
          A calm place for the month's numbers.
        </div>
      </div>

      {/* PIN dots */}
      <div className={'ls-pin ' + (shake ? 'shake' : '')}>
        {Array.from({ length: MASTER_PASSWORD.length }).map((_, i) => {
          const filled = i < pw.length;
          return (
            <span
              key={i}
              className={'ls-dot ' + (filled ? 'filled' : '')}
              style={{
                background: filled ? theme.text : 'transparent',
                borderColor: filled ? theme.text : theme.borderSoft,
              }}
            />
          );
        })}
        <input
          ref={inputRef}
          type="password"
          inputMode="text"
          value={pw}
          onChange={onChange}
          autoComplete="off"
          spellCheck={false}
          className="ls-input-hidden"
          aria-label="Master password"
        />
      </div>

      <div className="ls-hint" style={{ color: theme.muted, opacity: touched ? 0.55 : 0.95 }}>
        {touched && pw.length > 0 && pw.length < MASTER_PASSWORD.length
          ? `${pw.length} of ${MASTER_PASSWORD.length}`
          : 'Type to enter your password'}
      </div>

      <button
        className="ls-demo"
        onClick={() => submitTry(MASTER_PASSWORD)}
        style={{ color: theme.accentMuted, borderColor: theme.borderSoft }}
      >
        Use demo password →
      </button>

      <button
        className="ls-overlay-tap"
        onClick={() => inputRef.current?.focus()}
        aria-label="Focus password"
      />

      <div className="ls-foot" style={{ color: theme.soft }}>
        <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
          <path d="M2 6V4a3.5 3.5 0 017 0v2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          <rect x="1" y="6" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1"/>
        </svg>
        End-to-end encrypted · synced via Supabase
      </div>
    </div>
  );
}

window.LockScreen = LockScreen;
