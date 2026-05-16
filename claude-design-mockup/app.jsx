// app.jsx — Root. Lock screen → Dashboard. Owns transactions state.

const { useState, useEffect, useMemo, useRef } = React;

const LIGHT = {
  dark: false,
  bg:           '#FAF7F2',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F3EFE6',
  text:         '#1A1814',
  muted:        '#7A746A',
  soft:         '#B8B0A2',
  border:       '#E8E1D3',
  borderSoft:   '#EEE8DB',
  debit:        '#A8482C',
  credit:       '#3F7245',
  accentMuted:  '#967853',
  warn:         '#A07920',
  warnBg:       '#F7EFD5',
  shadowSoft:   'rgba(60, 50, 30, 0.06)',
  shadow:       'rgba(40, 30, 15, 0.10)',
};

const DARK = {
  dark: true,
  bg:           '#0E0C09',
  surface:      '#181511',
  surfaceAlt:   '#211C16',
  text:         '#F2EDE0',
  muted:        '#8E887A',
  soft:         '#5A554B',
  border:       '#2A2620',
  borderSoft:   '#221E18',
  debit:        '#D88260',
  credit:       '#8FB682',
  accentMuted:  '#C9A675',
  warn:         '#D4B86A',
  warnBg:       '#3A2F12',
  shadowSoft:   'rgba(0, 0, 0, 0.4)',
  shadow:       'rgba(0, 0, 0, 0.6)',
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "numerals": "serif",
  "density": "comfy",
  "groupByDay": true,
  "startLocked": true,
  "layoutMode": "auto"
}/*EDITMODE-END*/;

// Viewport detection — desktop layout kicks in at >= 1024 unless overridden
function useLayoutMode(override) {
  const [auto, setAuto] = useState(() => {
    if (typeof window === 'undefined') return 'mobile';
    return window.innerWidth >= 1024 ? 'desktop' : 'mobile';
  });
  useEffect(() => {
    const onR = () => setAuto(window.innerWidth >= 1024 ? 'desktop' : 'mobile');
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  if (override === 'mobile' || override === 'desktop') return override;
  return auto;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = t.theme === 'dark' ? DARK : LIGHT;
  const layout = useLayoutMode(t.layoutMode);

  // Lock state — persisted to localStorage. ?unlock=1 query param bypasses for review.
  const [locked, setLocked] = useState(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('unlock') === '1') return false;
    if (t.startLocked) return true;
    return localStorage.getItem('qb_unlocked') !== '1';
  });

  // Transactions state (seed from data.js)
  const [txns, setTxns] = useState(() => [...window.SEED_TRANSACTIONS]);
  const [categories, setCategories] = useState(() => [...window.CATEGORIES]);
  const [query, setQuery] = useState('');
  const [editingTxn, setEditingTxn] = useState(null);
  const [editingFull, setEditingFull] = useState(null); // full edit sheet
  const [showNew, setShowNew] = useState(false);
  const [activeTab, setActiveTab] = useState('ledger'); // ledger | analytics
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [toast, setToast] = useState(null);

  // Lookup helper that uses the live category state
  const catById = React.useCallback((id) => categories.find(c => c.id === id) || categories[categories.length - 1], [categories]);
  // Expose so any deeply-nested component can call it without prop drilling
  React.useEffect(() => { window._catLookup = catById; }, [catById]);

  // Keep window.catById in sync so LedgerRow / sheets see new categories
  React.useEffect(() => {
    window._LIVE_CATEGORIES = categories;
    window.catById = (id) => categories.find(c => c.id === id) || categories[categories.length - 1];
  }, [categories]);

  const addCategory = (label, emoji) => {
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || ('cat-' + Date.now());
    // De-dupe id
    let finalId = id, n = 1;
    while (categories.some(c => c.id === finalId)) { finalId = id + '-' + (++n); }
    const newCat = { id: finalId, label, emoji: emoji || '·', custom: true };
    setCategories(prev => {
      // Keep "Uncategorised" last
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), newCat, last];
    });
    return newCat;
  };

  const unlock = () => {
    localStorage.setItem('qb_unlocked', '1');
    setLocked(false);
  };

  const lockNow = () => {
    localStorage.removeItem('qb_unlocked');
    setLocked(true);
  };

  // Optimistic category update
  const updateCategory = (txnId, newCat) => {
    const old = txns.find(x => x.id === txnId);
    setTxns(prev => prev.map(x => x.id === txnId ? { ...x, category: newCat, confidence: 1.0 } : x));
    setEditingTxn(null);
    if (old && old.category !== newCat) {
      setToast({
        merchant: old.merchant,
        oldCat: old.category,
        newCat,
        txnId,
      });
      setTimeout(() => setToast(null), 3500);
    }
    // Simulated background "fire and forget" Supabase UPDATE — no-op here
  };

  const undoCategory = () => {
    if (!toast) return;
    setTxns(prev => prev.map(x => x.id === toast.txnId ? { ...x, category: toast.oldCat } : x));
    setToast(null);
  };

  const addTxn = (txn) => {
    setTxns(prev => [txn, ...prev]);
    setShowNew(false);
  };

  const updateTxn = (updated) => {
    setTxns(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
    setEditingFull(null);
  };

  const deleteTxn = (id) => {
    setTxns(prev => prev.filter(x => x.id !== id));
    setEditingFull(null);
  };

  // Count rows that need user review (low AI confidence OR pending)
  const needsReviewCount = useMemo(
    () => txns.filter(x => x.confidence < 0.85 || x.status === 'pending').length,
    [txns]
  );

  // Filter
  const filtered = useMemo(() => {
    let out = txns;
    if (needsReviewOnly) {
      out = out.filter(x => x.confidence < 0.85 || x.status === 'pending');
    }
    if (!query.trim()) return out;
    const q = query.toLowerCase().trim();
    return out.filter(x =>
      x.merchant.toLowerCase().includes(q) ||
      catById(x.category).label.toLowerCase().includes(q) ||
      x.payment_method.toLowerCase().includes(q) ||
      x.bank_name.toLowerCase().includes(q)
    );
  }, [txns, query, catById, needsReviewOnly]);

  const toggleTheme = () => setTweak('theme', t.theme === 'dark' ? 'light' : 'dark');

  // Sheet overlays — shared by both layouts
  const overlays = (
    <>
      {!locked && editingTxn && (
        <CategorySheet
          txn={editingTxn}
          categories={categories}
          onAddCategory={addCategory}
          onClose={() => setEditingTxn(null)}
          onPick={(cat) => updateCategory(editingTxn.id, cat)}
          theme={theme}
        />
      )}
      {!locked && editingFull && (
        <TransactionSheet
          mode="edit"
          existing={editingFull}
          categories={categories}
          onAddCategory={addCategory}
          onClose={() => setEditingFull(null)}
          onSave={updateTxn}
          onDelete={deleteTxn}
          theme={theme}
        />
      )}
      {!locked && showNew && (
        <TransactionSheet
          mode="new"
          categories={categories}
          onAddCategory={addCategory}
          onClose={() => setShowNew(false)}
          onSave={addTxn}
          theme={theme}
        />
      )}
      {!locked && toast && (
        <UndoToast toast={toast} onUndo={undoCategory} theme={theme} />
      )}
    </>
  );

  // ─── Mobile path: iOS frame
  if (layout === 'mobile') {
    return (
      <div className="app" data-layout="mobile" style={{ background: theme.bg, color: theme.text }}>
        <IOSDevice dark={theme.dark} width={402} height={874}>
          {locked
            ? <LockScreen onUnlock={unlock} theme={theme} />
            : (
              <>
                {activeTab === 'ledger' && (
                  <Dashboard
                    txns={filtered}
                    allTxns={txns}
                    theme={theme}
                    numerals={t.numerals}
                    density={t.density}
                    groupByDay={t.groupByDay}
                    query={query} setQuery={setQuery}
                    needsReviewOnly={needsReviewOnly}
                    setNeedsReviewOnly={setNeedsReviewOnly}
                    needsReviewCount={needsReviewCount}
                    onEditCategory={setEditingTxn}
                    onEditTxn={setEditingFull}
                    onAddNew={() => setShowNew(true)}
                    onLock={lockNow}
                    onToggleTheme={toggleTheme}
                  />
                )}
                {activeTab === 'analytics' && (
                  <AnalyticsView
                    txns={txns}
                    categories={categories}
                    theme={theme}
                    numerals={t.numerals}
                    onToggleTheme={toggleTheme}
                    onLock={lockNow}
                  />
                )}
                <TabBar
                  active={activeTab}
                  onTab={setActiveTab}
                  onAdd={() => setShowNew(true)}
                  onLock={lockNow}
                  theme={theme}
                />
              </>
            )
          }
          {overlays}
        </IOSDevice>

        <TweaksPanel>
          <TweakSection label="Layout" />
          <TweakRadio label="Device" value={t.layoutMode}
            options={['auto', 'mobile', 'desktop']}
            onChange={v => setTweak('layoutMode', v)} />

          <TweakSection label="Look & feel" />
          <TweakRadio label="Theme" value={t.theme}
            options={['light', 'dark']}
            onChange={v => setTweak('theme', v)} />
          <TweakRadio label="Numerals" value={t.numerals}
            options={['serif', 'mono']}
            onChange={v => setTweak('numerals', v)} />
          <TweakRadio label="Density" value={t.density}
            options={['compact', 'comfy']}
            onChange={v => setTweak('density', v)} />

          <TweakSection label="Behavior" />
          <TweakToggle label="Group by day" value={t.groupByDay}
            onChange={v => setTweak('groupByDay', v)} />
          <TweakToggle label="Start locked on reload" value={t.startLocked}
            onChange={v => setTweak('startLocked', v)} />
          <TweakButton label="Lock now" onClick={lockNow} />
        </TweaksPanel>
      </div>
    );
  }

  // ─── Desktop path: top nav + wide grid
  return (
    <div className="app desktop-app" data-layout="desktop" style={{ background: theme.bg, color: theme.text }}>
      {locked ? (
        <div className="desktop-lock" style={{ background: theme.bg }}>
          <div className="desktop-lock-frame" style={{ background: theme.surface, borderColor: theme.borderSoft }}>
            <LockScreen onUnlock={unlock} theme={theme} />
          </div>
        </div>
      ) : (
        <>
          <DesktopNav
            theme={theme}
            active={activeTab}
            onTab={setActiveTab}
            onAdd={() => setShowNew(true)}
            onToggleTheme={toggleTheme}
            onLock={lockNow}
            query={query} setQuery={setQuery}
          />
          <main className="desktop-main">
            {activeTab === 'ledger' && (
              <Dashboard
                txns={filtered}
                allTxns={txns}
                theme={theme}
                numerals={t.numerals}
                density={t.density}
                groupByDay={t.groupByDay}
                query={query} setQuery={setQuery}
                needsReviewOnly={needsReviewOnly}
                setNeedsReviewOnly={setNeedsReviewOnly}
                needsReviewCount={needsReviewCount}
                onEditCategory={setEditingTxn}
                onEditTxn={setEditingFull}
                onAddNew={() => setShowNew(true)}
                onLock={lockNow}
                onToggleTheme={toggleTheme}
                wide
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView
                txns={txns}
                categories={categories}
                theme={theme}
                numerals={t.numerals}
                wide
              />
            )}
          </main>
        </>
      )}
      {overlays}

      <TweaksPanel>
        <TweakSection label="Layout" />
        <TweakRadio label="Device" value={t.layoutMode}
          options={['auto', 'mobile', 'desktop']}
          onChange={v => setTweak('layoutMode', v)} />

        <TweakSection label="Look & feel" />
        <TweakRadio label="Theme" value={t.theme}
          options={['light', 'dark']}
          onChange={v => setTweak('theme', v)} />
        <TweakRadio label="Numerals" value={t.numerals}
          options={['serif', 'mono']}
          onChange={v => setTweak('numerals', v)} />
        <TweakRadio label="Density" value={t.density}
          options={['compact', 'comfy']}
          onChange={v => setTweak('density', v)} />

        <TweakSection label="Behavior" />
        <TweakToggle label="Group by day" value={t.groupByDay}
          onChange={v => setTweak('groupByDay', v)} />
        <TweakToggle label="Start locked on reload" value={t.startLocked}
          onChange={v => setTweak('startLocked', v)} />
        <TweakButton label="Lock now" onClick={lockNow} />
      </TweaksPanel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────
function Dashboard({ txns, allTxns, theme, numerals, density, groupByDay, query, setQuery, needsReviewOnly, setNeedsReviewOnly, needsReviewCount, onEditCategory, onEditTxn, onAddNew, onLock, onToggleTheme }) {
  // Group by date if asked
  const grouped = useMemo(() => {
    if (!groupByDay) return [{ key: 'all', label: null, rows: txns }];
    const map = new Map();
    txns.forEach(t => {
      const k = new Date(t.transaction_date).toDateString();
      if (!map.has(k)) map.set(k, { key: k, label: window.fmtDayHeader(t.transaction_date), rows: [], iso: t.transaction_date });
      map.get(k).rows.push(t);
    });
    return Array.from(map.values());
  }, [txns, groupByDay]);

  const now = new Date(2026, 4, 16);
  const dayLine = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="dash" style={{ background: theme.bg }}>
      {/* Sticky top header */}
      <header className="dash-head" style={{ background: theme.bg }}>
        <div className="dash-head-row">
          <div className="dash-brand" style={{ color: theme.text }}>
            <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 22, letterSpacing: '-0.005em' }}>Quiet</span>
            <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 22, letterSpacing: '-0.005em', color: theme.accentMuted }}>Books</span>
          </div>
          <div className="dash-head-actions">
            <div className="dash-day" style={{ color: theme.muted }}>{dayLine}</div>
            <button className="head-icon-btn" onClick={onToggleTheme}
              style={{ color: theme.muted, background: theme.surface, borderColor: theme.borderSoft }}
              aria-label={theme.dark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <Icon name={theme.dark ? 'sun' : 'moon'} size={14} stroke={1.5} />
            </button>
            <button className="head-icon-btn" onClick={onLock}
              style={{ color: theme.muted, background: theme.surface, borderColor: theme.borderSoft }}
              aria-label="Lock app">
              <Icon name="lock" size={14} stroke={1.4} />
            </button>
          </div>
        </div>
      </header>

      <main className="dash-main">
        <MonthHero txns={txns} theme={theme} numerals={numerals} />

        <StatStrip txns={txns} theme={theme} numerals={numerals} />

        {/* Sticky search */}
        <div className="search-sticky" style={{ background: theme.bg }}>
          <div className="search-bar" style={{ background: theme.surface, borderColor: theme.borderSoft, color: theme.text }}>
            <Icon name="search" size={15} color={theme.muted} stroke={1.5}/>
            <input
              className="search-input"
              placeholder="Search merchant, category, bank…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ color: theme.text }}
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')}
                style={{ color: theme.muted }}>
                <Icon name="close" size={13} stroke={1.6}/>
              </button>
            )}
          </div>
        </div>

        {/* Needs-review filter — visible on both mobile and desktop */}
        {needsReviewCount > 0 && (
          <div className="ledger-filters" style={{ background: theme.bg }}>
            <button
              className={'ledger-filter ' + (needsReviewOnly ? 'active' : '')}
              onClick={() => setNeedsReviewOnly(!needsReviewOnly)}
              style={
                needsReviewOnly
                  ? { background: theme.debit, color: theme.bg, borderColor: theme.debit }
                  : { background: theme.surface, color: theme.debit, borderColor: theme.borderSoft }
              }
            >
              <span className="ledger-filter-dot" style={{ background: needsReviewOnly ? theme.bg : theme.debit }}/>
              <span>Needs review</span>
              <span className="ledger-filter-count" style={{
                background: needsReviewOnly ? 'rgba(255,255,255,0.18)' : theme.debit,
                color: needsReviewOnly ? theme.bg : theme.bg,
              }}>{needsReviewCount}</span>
            </button>
            {needsReviewOnly && (
              <button
                className="ledger-filter-clear"
                onClick={() => setNeedsReviewOnly(false)}
                style={{ color: theme.muted }}
              >
                Show all ×
              </button>
            )}
          </div>
        )}

        {/* Ledger */}
        <div className="ledger">
          {txns.length === 0 ? (
            <div className="empty" style={{ color: theme.muted, borderColor: theme.borderSoft }}>
              No transactions match <em style={{ color: theme.text, fontStyle: 'italic' }}>"{query}"</em>
            </div>
          ) : grouped.map(g => (
            <section key={g.key} className="ledger-group">
              {g.label && (
                <div className="ledger-day" style={{ color: theme.muted, background: theme.bg }}>
                  <span>{g.label}</span>
                  <span style={{ flex: 1, height: 1, background: theme.borderSoft, opacity: 0.7 }} />
                  <span className="ledger-day-count">{g.rows.length}</span>
                </div>
              )}
              <div className="ledger-rows" style={{ background: theme.surface, borderColor: theme.borderSoft }}>
                {g.rows.map((txn, i) => (
                  <React.Fragment key={txn.id}>
                    {i > 0 && <div className="row-sep" style={{ background: theme.borderSoft }} />}
                    <LedgerRow
                      txn={txn}
                      theme={theme}
                      numerals={numerals}
                      density={density}
                      onCategoryClick={onEditCategory}
                      onRowClick={onEditTxn}
                    />
                  </React.Fragment>
                ))}
              </div>
            </section>
          ))}

          <div className="ledger-foot" style={{ color: theme.soft }}>
            <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block', verticalAlign: 'middle' }}/>
            <span>{allTxns.length} transactions · all synced</span>
            <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block', verticalAlign: 'middle' }}/>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DESKTOP NAV — top bar: brand + tabs + search + actions
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// DESKTOP NAV — top bar: brand + tabs + search + actions
// ─────────────────────────────────────────────────────────
function DesktopNav({ theme, active, onTab, onAdd, onToggleTheme, onLock, query, setQuery }) {
  const dayLine = new Date(2026, 4, 16).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <header className="dnav" style={{
      background: theme.dark ? 'rgba(14,12,9,0.78)' : 'rgba(250,247,242,0.78)',
      borderColor: theme.borderSoft,
    }}>
      <div className="dnav-inner">
        <div className="dnav-left">
          <div className="dnav-brand" style={{ color: theme.text }}>
            <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: 'italic', fontSize: 26, letterSpacing: '-0.005em' }}>Quiet</span>
            <span style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 26, letterSpacing: '-0.005em', color: theme.accentMuted }}>Books</span>
          </div>
          <div className="dnav-tabs" style={{ background: theme.surfaceAlt, borderColor: theme.borderSoft }}>
            {[
              { id: 'ledger',    label: 'Ledger',    icon: 'bank' },
              { id: 'analytics', label: 'Analytics', icon: 'sparkle' },
            ].map(tab => (
              <button
                key={tab.id}
                className={'dnav-tab ' + (active === tab.id ? 'dnav-tab-active' : '')}
                onClick={() => onTab(tab.id)}
                style={{
                  background: active === tab.id ? theme.surface : 'transparent',
                  color: active === tab.id ? theme.text : theme.muted,
                  boxShadow: active === tab.id ? `0 1px 2px ${theme.shadowSoft}` : 'none',
                }}
              >
                <Icon name={tab.icon} size={14} stroke={1.6}/>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="dnav-center">
          <div className="dnav-search" style={{ background: theme.surface, borderColor: theme.borderSoft, color: theme.text }}>
            <Icon name="search" size={14} color={theme.muted} stroke={1.5}/>
            <input
              className="dnav-search-input"
              placeholder="Search merchant, category, bank…"
              value={query || ''}
              onChange={e => setQuery(e.target.value)}
              style={{ color: theme.text }}
            />
            <span className="dnav-search-kbd" style={{ color: theme.soft, borderColor: theme.borderSoft }}>⌘ K</span>
          </div>
        </div>

        <div className="dnav-right">
          <button className="dnav-add"
            onClick={onAdd}
            style={{ background: theme.text, color: theme.bg, boxShadow: `0 2px 6px ${theme.shadowSoft}` }}>
            <Icon name="plus" size={14} stroke={2}/>
            New transaction
          </button>
          <span className="dnav-divider" style={{ background: theme.borderSoft }}/>
          <div className="dnav-day" style={{ color: theme.muted }}>{dayLine}</div>
          <button className="head-icon-btn" onClick={onToggleTheme}
            style={{ color: theme.muted, background: theme.surface, borderColor: theme.borderSoft }}
            aria-label={theme.dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <Icon name={theme.dark ? 'sun' : 'moon'} size={14} stroke={1.5} />
          </button>
          <button className="head-icon-btn" onClick={onLock}
            style={{ color: theme.muted, background: theme.surface, borderColor: theme.borderSoft }}
            aria-label="Lock app">
            <Icon name="lock" size={14} stroke={1.4} />
          </button>
        </div>
      </div>
    </header>
  );
}
// ─────────────────────────────────────────────────────────
// TAB BAR — bottom nav: Ledger / Add / Analytics (mobile)
// ─────────────────────────────────────────────────────────
function TabBar({ active, onTab, onAdd, onLock, theme }) {
  return (
    <nav className="tabbar" style={{
      background: theme.dark
        ? 'linear-gradient(180deg, rgba(24,21,17,0) 0%, rgba(24,21,17,0.92) 30%, rgba(24,21,17,0.98) 100%)'
        : 'linear-gradient(180deg, rgba(250,247,242,0) 0%, rgba(250,247,242,0.92) 30%, rgba(250,247,242,0.98) 100%)',
    }}>
      <div className="tabbar-inner" style={{
        background: theme.surface,
        borderColor: theme.borderSoft,
        boxShadow: `0 1px 2px ${theme.shadowSoft}, 0 8px 28px ${theme.shadow}`,
      }}>
        <button
          className={'tab ' + (active === 'ledger' ? 'tab-active' : '')}
          onClick={() => onTab('ledger')}
          style={{ color: active === 'ledger' ? theme.text : theme.muted }}
        >
          <Icon name="bank" size={18} stroke={1.5}/>
          <span>Ledger</span>
        </button>
        <button
          className="tab tab-add"
          onClick={onAdd}
          aria-label="New transaction"
          style={{ background: theme.text, color: theme.bg, boxShadow: `0 4px 14px ${theme.shadow}` }}
        >
          <Icon name="plus" size={20} stroke={2.2}/>
        </button>
        <button
          className={'tab ' + (active === 'analytics' ? 'tab-active' : '')}
          onClick={() => onTab('analytics')}
          style={{ color: active === 'analytics' ? theme.text : theme.muted }}
        >
          <Icon name="sparkle" size={18} stroke={1.5}/>
          <span>Analytics</span>
        </button>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────
// Undo toast
// ─────────────────────────────────────────────────────────
function UndoToast({ toast, onUndo, theme }) {
  const oldCat = window.catById(toast.oldCat);
  const newCat = window.catById(toast.newCat);
  return (
    <div className="toast" style={{
      background: theme.text, color: theme.bg,
      boxShadow: `0 8px 28px ${theme.shadow}`,
    }}>
      <span className="toast-msg">
        <strong>{toast.merchant}</strong> · {oldCat.emoji}→{newCat.emoji} {newCat.label}
      </span>
      <button className="toast-undo" onClick={onUndo}
        style={{ color: theme.bg }}>
        Undo
      </button>
    </div>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
