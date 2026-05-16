// analytics.jsx — Analytics view with filters, donut chart, category bars, top merchants

function AnalyticsView({ txns, categories, theme, numerals, onToggleTheme, onLock }) {
  const [period, setPeriod] = React.useState('month'); // month | 7d | all
  const [account, setAccount] = React.useState('all');
  const [catFilter, setCatFilter] = React.useState('all');

  // Time pin: project "now" is May 16, 2026
  const NOW = React.useMemo(() => new Date(2026, 4, 16, 23, 59, 59), []);

  const filtered = React.useMemo(() => {
    return txns.filter(t => {
      if (t.type !== 'debit') return false; // analytics = spending
      const d = new Date(t.transaction_date);
      if (period === '7d') {
        const cutoff = new Date(NOW); cutoff.setDate(cutoff.getDate() - 7);
        if (d < cutoff) return false;
      } else if (period === 'month') {
        if (d.getMonth() !== NOW.getMonth() || d.getFullYear() !== NOW.getFullYear()) return false;
      }
      if (account !== 'all' && t.bank_name !== account) return false;
      if (catFilter !== 'all' && t.category !== catFilter) return false;
      return true;
    });
  }, [txns, period, account, catFilter, NOW]);

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  // Per-category aggregates (using the FULL set so all cats appear; bars reflect filter)
  const byCat = React.useMemo(() => {
    const m = new Map();
    filtered.forEach(t => {
      const k = t.category;
      if (!m.has(k)) m.set(k, { id: k, total: 0, count: 0 });
      const cur = m.get(k);
      cur.total += t.amount; cur.count += 1;
    });
    const arr = Array.from(m.values()).sort((a, b) => b.total - a.total);
    return arr;
  }, [filtered]);

  const topMerchants = React.useMemo(() => {
    const m = new Map();
    filtered.forEach(t => {
      if (!m.has(t.merchant)) m.set(t.merchant, { name: t.merchant, total: 0, count: 0, lastCat: t.category });
      const cur = m.get(t.merchant);
      cur.total += t.amount; cur.count += 1;
    });
    return Array.from(m.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [filtered]);

  // Banks present in data — derived for chip set
  const banks = React.useMemo(() => {
    const s = new Set(txns.map(t => t.bank_name));
    return ['all', ...Array.from(s)];
  }, [txns]);

  // Daily series for the active period
  const series = React.useMemo(() => {
    const days = period === '7d' ? 7 : period === 'month' ? NOW.getDate() : 30;
    const startDay = period === '7d'
      ? new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 6)
      : period === 'month'
      ? new Date(NOW.getFullYear(), NOW.getMonth(), 1)
      : new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 29);
    const arr = new Array(days).fill(0);
    filtered.forEach(t => {
      const d = new Date(t.transaction_date);
      const idx = Math.floor((d - startDay) / (1000 * 60 * 60 * 24));
      if (idx >= 0 && idx < days) arr[idx] += t.amount;
    });
    return arr;
  }, [filtered, period, NOW]);

  const periodLabel = period === 'month' ? 'May 2026' : period === '7d' ? 'Last 7 days' : 'Last 30 days';
  const avgPerDay = series.length ? total / series.length : 0;

  return (
    <div className="analytics">
      {/* Header */}
      <header className="anly-head">
        <div className="anly-head-row">
          <div>
            <div className="anly-eyebrow" style={{ color: theme.muted }}>Analytics</div>
            <h2 className="anly-title" style={{ color: theme.text }}>
              Where the rupees<br/>
              <em style={{ color: theme.accentMuted }}>actually went.</em>
            </h2>
          </div>
          {(onToggleTheme || onLock) && (
            <div className="anly-head-actions">
              {onToggleTheme && (
                <button className="head-icon-btn" onClick={onToggleTheme}
                  style={{ color: theme.muted, background: theme.surface, borderColor: theme.borderSoft }}
                  aria-label={theme.dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                  <Icon name={theme.dark ? 'sun' : 'moon'} size={14} stroke={1.5} />
                </button>
              )}
              {onLock && (
                <button className="head-icon-btn" onClick={onLock}
                  style={{ color: theme.muted, background: theme.surface, borderColor: theme.borderSoft }}
                  aria-label="Lock app">
                  <Icon name="lock" size={14} stroke={1.4} />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Period selector */}
      <div className="seg seg-anly" style={{ background: theme.surfaceAlt, borderColor: theme.borderSoft }}>
        {[['month', 'This month'], ['7d', '7 days'], ['all', '30 days']].map(([k, label]) => (
          <button
            key={k}
            className={'seg-btn ' + (period === k ? 'active' : '')}
            onClick={() => setPeriod(k)}
            style={{
              background: period === k ? theme.surface : 'transparent',
              color: period === k ? theme.text : theme.muted,
              boxShadow: period === k ? `0 1px 2px ${theme.shadowSoft}` : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Donut + total */}
      <div className="anly-donut-wrap" style={{ background: theme.surface, borderColor: theme.borderSoft }}>
        <DonutChart
          byCat={byCat}
          theme={theme}
          total={total}
          selectedId={catFilter !== 'all' ? catFilter : null}
          onSegmentClick={(id) => setCatFilter(prev => prev === id ? 'all' : id)}
          numerals={numerals}
        />
        <div className="anly-donut-side">
          <div className="anly-total-label" style={{ color: theme.muted }}>
            {catFilter !== 'all' ? `${window.catById(catFilter).label} outflow` : 'Total outflow'}
          </div>
          <Money value={total} size={32} numerals={numerals} italic color={theme.text}/>
          <div className="anly-total-sub" style={{ color: theme.muted }}>
            <span>{periodLabel}</span>
            <span className="anly-dot" style={{ background: theme.soft }}/>
            <span>{filtered.length} txns</span>
            {catFilter !== 'all' && (
              <>
                <span className="anly-dot" style={{ background: theme.soft }}/>
                <button
                  onClick={() => setCatFilter('all')}
                  className="anly-clear"
                  style={{ color: theme.muted, padding: 0 }}>
                  clear ×
                </button>
              </>
            )}
          </div>
          <div className="anly-avg">
            <span className="anly-avg-label" style={{ color: theme.muted }}>avg / day</span>
            <Money value={avgPerDay} size={13} numerals="mono" color={theme.text}/>
          </div>
        </div>
      </div>

      {/* Account filter */}
      <div className="anly-section">
        <div className="anly-section-h" style={{ color: theme.muted }}>By account</div>
        <div className="anly-chips">
          {banks.map(b => (
            <button
              key={b}
              onClick={() => setAccount(b)}
              className="anly-chip"
              style={{
                background: account === b ? theme.text : theme.surfaceAlt,
                color: account === b ? theme.bg : theme.text,
                borderColor: account === b ? theme.text : theme.borderSoft,
              }}
            >
              {b === 'all' ? 'All accounts' : b}
            </button>
          ))}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="anly-section">
        <div className="anly-section-h-row">
          <div className="anly-section-h" style={{ color: theme.muted }}>By category</div>
          {catFilter !== 'all' && (
            <button className="anly-clear"
              onClick={() => setCatFilter('all')}
              style={{ color: theme.muted }}>
              Clear filter ×
            </button>
          )}
        </div>
        <div className="anly-cat-list">
          {byCat.length === 0 && (
            <div className="anly-empty" style={{ color: theme.muted, borderColor: theme.borderSoft }}>
              No spending in this period.
            </div>
          )}
          {byCat.map(c => {
            const cat = window.catById(c.id);
            const pct = total ? (c.total / total) : 0;
            const hue = window.hueForCat(c.id);
            const barColor = theme.dark
              ? `oklch(0.6 0.13 ${hue})`
              : `oklch(0.55 0.13 ${hue})`;
            const isActive = catFilter === c.id;
            return (
              <button
                key={c.id}
                className={'anly-cat-row ' + (isActive ? 'active' : '')}
                onClick={() => setCatFilter(isActive ? 'all' : c.id)}
                style={{ borderColor: theme.borderSoft, background: isActive ? theme.surfaceAlt : 'transparent' }}
              >
                <CategoryGlyph catId={c.id} emoji={cat.emoji} size={34} theme={theme}/>
                <div className="anly-cat-mid">
                  <div className="anly-cat-top">
                    <span className="anly-cat-label" style={{ color: theme.text }}>{cat.label}</span>
                    <Money value={c.total} size={13} numerals={numerals} weight={500} color={theme.text}/>
                  </div>
                  <div className="anly-cat-bottom">
                    <div className="anly-cat-bar" style={{ background: theme.borderSoft }}>
                      <div className="anly-cat-bar-fill" style={{
                        width: `${pct * 100}%`,
                        background: barColor,
                      }}/>
                    </div>
                    <span className="anly-cat-pct" style={{ color: theme.muted }}>
                      {(pct * 100).toFixed(pct < 0.1 ? 1 : 0)}%
                    </span>
                  </div>
                  <div className="anly-cat-count" style={{ color: theme.soft }}>{c.count} {c.count === 1 ? 'transaction' : 'transactions'}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top merchants */}
      {topMerchants.length > 0 && (
        <div className="anly-section">
          <div className="anly-section-h" style={{ color: theme.muted }}>Top merchants</div>
          <div className="anly-merch-list" style={{ background: theme.surface, borderColor: theme.borderSoft }}>
            {topMerchants.map((m, i) => {
              const cat = window.catById(m.lastCat);
              return (
                <React.Fragment key={m.name}>
                  {i > 0 && <div className="row-sep" style={{ background: theme.borderSoft, marginLeft: 52 }}/>}
                  <div className="anly-merch">
                    <CategoryGlyph catId={m.lastCat} emoji={cat.emoji} size={32} theme={theme}/>
                    <div className="anly-merch-mid">
                      <span className="anly-merch-name" style={{ color: theme.text }}>{m.name}</span>
                      <span className="anly-merch-meta" style={{ color: theme.muted }}>
                        {m.count} {m.count === 1 ? 'charge' : 'charges'} · {cat.label}
                      </span>
                    </div>
                    <Money value={m.total} size={14} numerals={numerals} weight={500} color={theme.text}/>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily spend bar chart */}
      <div className="anly-section">
        <div className="anly-section-h" style={{ color: theme.muted }}>Daily spend</div>
        <div className="anly-daily" style={{ background: theme.surface, borderColor: theme.borderSoft }}>
          <DailyBars values={series} theme={theme} period={period} NOW={NOW}/>
        </div>
      </div>

      <div className="anly-foot" style={{ color: theme.soft }}>
        <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block', verticalAlign: 'middle' }}/>
        <span>Computed live · no servers harmed</span>
        <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block', verticalAlign: 'middle' }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DONUT CHART — interactive SVG arcs
// ─────────────────────────────────────────────────────────
function DonutChart({ byCat, theme, total, selectedId, onSegmentClick, numerals }) {
  const [hoverId, setHoverId] = React.useState(null);
  const size = 156;
  const baseStroke = 22;
  const hoverBoost = 5;
  const r = (size - baseStroke - hoverBoost * 2) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  // Pre-compute segments
  let acc = 0;
  const segments = byCat.map(seg => {
    const pct = total ? seg.total / total : 0;
    const len = pct * c;
    const offset = -acc;
    acc += len;
    const hue = window.hueForCat(seg.id);
    const color = theme.dark
      ? `oklch(0.62 0.13 ${hue})`
      : `oklch(0.56 0.14 ${hue})`;
    return { id: seg.id, len, offset, color, pct, total: seg.total, count: seg.count };
  });

  const activeId = hoverId || selectedId || null;
  const activeSeg = activeId ? segments.find(s => s.id === activeId) : null;
  const activeCat = activeId ? window.catById(activeId) : null;

  return (
    <div className="anly-donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={theme.borderSoft} strokeWidth={baseStroke}/>
        {/* segments */}
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {segments.map((s) => {
            const isActive = activeId === s.id;
            const isDimmed = activeId && !isActive;
            const stroke = isActive ? baseStroke + hoverBoost : baseStroke;
            return (
              <circle
                key={s.id}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(s.len - 1.5, 0)} ${c}`}
                strokeDashoffset={s.offset}
                strokeLinecap="butt"
                style={{
                  transition: 'stroke-width 0.18s ease, opacity 0.18s ease',
                  opacity: isDimmed ? 0.32 : 1,
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoverId(s.id)}
                onMouseLeave={() => setHoverId(null)}
                onClick={(e) => { e.stopPropagation(); onSegmentClick && onSegmentClick(s.id); }}
              />
            );
          })}
        </g>

        {/* Center label — adapts to active segment */}
        {!activeSeg ? (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle"
              style={{ font: '500 9px "Geist", system-ui, sans-serif', letterSpacing: '0.10em', textTransform: 'uppercase' }}
              fill={theme.muted}>
              {byCat.length}
            </text>
            <text x={cx} y={cy + 11} textAnchor="middle"
              style={{ font: 'italic 14px "Instrument Serif", Georgia, serif' }}
              fill={theme.text}>
              categories
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 12} textAnchor="middle"
              style={{ font: '20px sans-serif' }}>
              {activeCat.emoji}
            </text>
            <text x={cx} y={cy + 6} textAnchor="middle"
              style={{ font: '500 10px "Geist", system-ui, sans-serif' }}
              fill={theme.text}>
              {activeCat.label}
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle"
              style={{ font: '500 10.5px "Geist Mono", monospace' }}
              fill={theme.muted}>
              {(activeSeg.pct * 100).toFixed(activeSeg.pct < 0.1 ? 1 : 0)}% · {window.fmtINR(activeSeg.total, { compact: true })}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DAILY BARS
// ─────────────────────────────────────────────────────────
function DailyBars({ values, theme, period, NOW }) {
  const max = Math.max(...values, 1);
  const height = 80;
  const startDay = period === '7d'
    ? new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 6)
    : period === 'month'
    ? new Date(NOW.getFullYear(), NOW.getMonth(), 1)
    : new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 29);

  // Mark first / last date
  const firstLbl = startDay.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const lastDate = new Date(startDay); lastDate.setDate(lastDate.getDate() + values.length - 1);
  const lastLbl = lastDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="anly-daily-inner">
      <div className="anly-daily-bars" style={{ height }}>
        {values.map((v, i) => {
          const h = (v / max) * height;
          const date = new Date(startDay); date.setDate(date.getDate() + i);
          return (
            <div key={i} className="anly-daily-bar-wrap" title={`${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${window.fmtINR(v)}`}>
              <div className="anly-daily-bar" style={{
                height: Math.max(2, h),
                background: v > 0 ? theme.debit : theme.borderSoft,
                opacity: v > 0 ? 0.85 : 1,
              }}/>
            </div>
          );
        })}
      </div>
      <div className="anly-daily-axis" style={{ color: theme.soft }}>
        <span>{firstLbl}</span>
        <span>{lastLbl}</span>
      </div>
    </div>
  );
}

Object.assign(window, { AnalyticsView, DonutChart, DailyBars });
