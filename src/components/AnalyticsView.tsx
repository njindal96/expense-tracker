'use client';

import { useState, useMemo } from 'react';
import { useTheme, hueForCat, catBg, catFg } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils';
import { getCatEmoji } from '@/lib/categories';
import type { Transaction, DateFilter } from '@/types/transaction';

interface AnalyticsViewProps {
  txns: Transaction[];
  dateFilter: DateFilter;
  onDateFilter: (f: DateFilter) => void;
}

type Period = 'month' | '7d' | 'all';

// ─── Interactive donut ────────────────────────────────────
function DonutChart({ byCat, total, selectedId, hoverId, onHover, onClick, theme }: {
  byCat: { id: string; total: number; count: number }[];
  total: number;
  selectedId: string | null;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const size = 156;
  const baseStroke = 22;
  const hoverBoost = 5;
  const r = (size - baseStroke - hoverBoost * 2) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;

  let acc = 0;
  const segments = byCat.map(seg => {
    const pct = total ? seg.total / total : 0;
    const len = pct * circ;
    const offset = -acc;
    acc += len;
    const hue = hueForCat(seg.id);
    const color = theme.dark ? `oklch(0.62 0.13 ${hue})` : `oklch(0.56 0.14 ${hue})`;
    return { ...seg, len, offset, color, pct };
  });

  const activeId = hoverId ?? selectedId;
  const activeSeg = activeId ? segments.find(s => s.id === activeId) : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={theme.borderSoft} strokeWidth={baseStroke} />
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {segments.map(s => {
          const isActive = activeId === s.id;
          const isDimmed = !!activeId && !isActive;
          const sw = isActive ? baseStroke + hoverBoost : baseStroke;
          return (
            <circle key={s.id} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={sw}
              strokeDasharray={`${Math.max(s.len - 1.5, 0)} ${circ}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
              style={{ transition: 'stroke-width 0.18s, opacity 0.18s', opacity: isDimmed ? 0.32 : 1, cursor: 'pointer' }}
              onMouseEnter={() => onHover(s.id)}
              onMouseLeave={() => onHover(null)}
              onClick={e => { e.stopPropagation(); onClick(s.id); }}
            />
          );
        })}
      </g>
      {/* Center label */}
      {!activeSeg ? (
        <>
          <text x={cx} y={cy - 4} textAnchor="middle" style={{ font: '500 9px sans-serif', letterSpacing: '0.10em', textTransform: 'uppercase' }} fill={theme.muted}>{byCat.length}</text>
          <text x={cx} y={cy + 11} textAnchor="middle" style={{ font: `italic 14px var(--font-serif), Georgia, serif` }} fill={theme.text}>categories</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 12} textAnchor="middle" style={{ font: '20px sans-serif' }}>{getCatEmoji(activeSeg.id)}</text>
          <text x={cx} y={cy + 6} textAnchor="middle" style={{ font: '500 10px sans-serif' }} fill={theme.text}>{activeSeg.id}</text>
          <text x={cx} y={cy + 22} textAnchor="middle" style={{ font: '500 10.5px monospace' }} fill={theme.muted}>
            {(activeSeg.pct * 100).toFixed(activeSeg.pct < 0.1 ? 1 : 0)}% · {formatCurrency(activeSeg.total).replace('₹', '₹')}
          </text>
        </>
      )}
    </svg>
  );
}

// ─── Daily bars ───────────────────────────────────────────
function DailyBars({ values, theme, period }: { values: number[]; theme: ReturnType<typeof useTheme>; period: Period }) {
  const max = Math.max(...values, 1);
  const height = 80;
  const now = new Date();
  const startDate = period === '7d'
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    : period === 'month'
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const lastDate = new Date(startDate);
  lastDate.setDate(lastDate.getDate() + values.length - 1);
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height }}>
        {values.map((v, i) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          return (
            <div key={i} title={`${fmt(date)} · ${formatCurrency(v)}`}
              style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
              <div style={{ width: '100%', height: Math.max(2, (v / max) * height), background: v > 0 ? theme.debit : theme.borderSoft, borderRadius: '2px 2px 0 0', opacity: v > 0 ? 0.85 : 1, transition: 'height 0.4s' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', color: theme.soft }}>
        <span>{fmt(startDate)}</span><span>{fmt(lastDate)}</span>
      </div>
    </div>
  );
}

export default function AnalyticsView({ txns, dateFilter, onDateFilter }: AnalyticsViewProps) {
  const theme = useTheme();
  const [period, setPeriod] = useState<Period>('month');
  const [account, setAccount] = useState('all');
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    return txns.filter(t => {
      if (t.type !== 'debit') return false;
      const d = new Date(t.transaction_date);
      if (period === '7d') {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 7);
        if (d < cutoff) return false;
      } else if (period === 'month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 30);
        if (d < cutoff) return false;
      }
      if (account !== 'all' && t.bank_name !== account) return false;
      if (catFilter && t.category !== catFilter) return false;
      return true;
    });
  }, [txns, period, account, catFilter, now]);

  const total = filtered.reduce((s, t) => s + t.amount, 0);

  const byCat = useMemo(() => {
    const m = new Map<string, { id: string; total: number; count: number }>();
    filtered.forEach(t => {
      if (!m.has(t.category)) m.set(t.category, { id: t.category, total: 0, count: 0 });
      const cur = m.get(t.category)!;
      cur.total += t.amount; cur.count += 1;
    });
    return Array.from(m.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const topMerchants = useMemo(() => {
    const m = new Map<string, { name: string; total: number; count: number; lastCat: string }>();
    filtered.forEach(t => {
      if (!m.has(t.merchant)) m.set(t.merchant, { name: t.merchant, total: 0, count: 0, lastCat: t.category });
      const cur = m.get(t.merchant)!;
      cur.total += t.amount; cur.count += 1;
    });
    return Array.from(m.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [filtered]);

  const banks = useMemo(() => {
    const s = new Set(txns.map(t => t.bank_name).filter(Boolean));
    return ['all', ...Array.from(s)];
  }, [txns]);

  const series = useMemo(() => {
    const days = period === '7d' ? 7 : period === 'month' ? now.getDate() : 30;
    const startDay = period === '7d'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      : period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const arr = new Array(days).fill(0);
    filtered.forEach(t => {
      const d = new Date(t.transaction_date);
      const idx = Math.floor((d.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
      if (idx >= 0 && idx < days) arr[idx] += t.amount;
    });
    return arr;
  }, [filtered, period, now]);

  const avgPerDay = series.length ? total / series.length : 0;
  const periodLabel = period === 'month'
    ? now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : period === '7d' ? 'Last 7 days' : 'Last 30 days';

  const sectionLabel = { fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.10em', fontWeight: 500, color: theme.muted };
  const chipStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center',
    border: `1px solid ${active ? theme.text : theme.borderSoft}`,
    borderRadius: 99, padding: '7px 12px',
    background: active ? theme.text : theme.surfaceAlt,
    color: active ? theme.bg : theme.text,
    fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.005em',
    cursor: 'pointer', transition: 'all 0.18s',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, animation: 'dashIn 0.5s cubic-bezier(0.2,0.85,0.2,1)' }}>
      {/* Header */}
      <div>
        <div style={sectionLabel}>Analytics</div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 34, fontWeight: 400, letterSpacing: '-0.01em', color: theme.text, lineHeight: 1.1 }}>
          Where the rupees<br />
          <em style={{ fontStyle: 'italic', color: theme.accent }}>actually went.</em>
        </h2>
      </div>

      {/* Period selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 4, border: `1px solid ${theme.borderSoft}`, borderRadius: 11, background: theme.surfaceAlt, maxWidth: 320 }}>
        {([['month', 'This month'], ['7d', '7 days'], ['all', '30 days']] as [Period, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{ height: 32, border: 0, borderRadius: 8, background: period === k ? theme.surface : 'transparent', color: period === k ? theme.text : theme.muted, fontSize: 13, fontWeight: period === k ? 600 : 500, letterSpacing: '-0.005em', cursor: 'pointer', transition: 'all 0.18s', boxShadow: period === k ? `0 1px 2px ${theme.shadowSoft}` : 'none', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Desktop 2-col: donut + category list */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px 32px', alignItems: 'start' }}>
        {/* Left: donut + summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Donut card */}
          <div style={{ border: `1px solid ${theme.borderSoft}`, borderRadius: 16, background: theme.surface, padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <DonutChart byCat={byCat} total={total} selectedId={catFilter} hoverId={hoverId} onHover={setHoverId} onClick={id => setCatFilter(prev => prev === id ? null : id)} theme={theme} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={sectionLabel}>{catFilter ? (catFilter + ' outflow') : 'Total outflow'}</div>
              <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 28, fontStyle: 'italic', color: theme.text, letterSpacing: '-0.01em' }}>{formatCurrency(total)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: theme.muted, marginTop: 2 }}>
                <span>{periodLabel}</span>
                <span style={{ width: 2, height: 2, borderRadius: 99, background: theme.soft, display: 'inline-block' }} />
                <span>{filtered.length} txns</span>
                {catFilter && (
                  <>
                    <span style={{ width: 2, height: 2, borderRadius: 99, background: theme.soft, display: 'inline-block' }} />
                    <button onClick={() => setCatFilter(null)} style={{ border: 0, background: 'transparent', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, color: theme.muted, cursor: 'pointer', padding: 0 }}>clear ×</button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${theme.borderSoft}` }}>
                <span style={{ ...sectionLabel }}>avg / day</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: theme.text }}>{formatCurrency(avgPerDay)}</span>
              </div>
            </div>
          </div>

          {/* Daily bars */}
          <div style={{ border: `1px solid ${theme.borderSoft}`, borderRadius: 14, background: theme.surface, padding: '16px 14px 12px' }}>
            <div style={{ ...sectionLabel, marginBottom: 12 }}>Daily spend</div>
            <DailyBars values={series} theme={theme} period={period} />
          </div>
        </div>

        {/* Right: by account + category list + top merchants */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Account filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={sectionLabel}>By account</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {banks.map(b => (
                <button key={b} onClick={() => setAccount(b)} style={chipStyle(account === b)}>
                  {b === 'all' ? 'All accounts' : b}
                </button>
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={sectionLabel}>By category</div>
              {catFilter && (
                <button onClick={() => setCatFilter(null)} style={{ border: 0, background: 'transparent', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, color: theme.muted, cursor: 'pointer' }}>Clear filter ×</button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {byCat.length === 0 ? (
                <div style={{ border: `1px dashed ${theme.borderSoft}`, borderRadius: 12, padding: '28px 16px', textAlign: 'center', fontSize: 12.5, color: theme.muted, fontStyle: 'italic', fontFamily: 'var(--font-serif), Georgia, serif' }}>No spending in this period.</div>
              ) : byCat.map(c => {
                const pct = total ? c.total / total : 0;
                const hue = hueForCat(c.id);
                const barColor = theme.dark ? `oklch(0.6 0.13 ${hue})` : `oklch(0.55 0.13 ${hue})`;
                const isActive = catFilter === c.id;
                return (
                  <button key={c.id} onClick={() => setCatFilter(prev => prev === c.id ? null : c.id)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, border: `1px solid ${isActive ? theme.border : 'transparent'}`, borderRadius: 14, padding: '10px 12px', background: isActive ? theme.surfaceAlt : 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.12s', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: catBg(c.id, theme.dark), color: catFg(c.id, theme.dark), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{getCatEmoji(c.id)}</div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.id}</span>
                        <span style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 14, color: theme.text, letterSpacing: '-0.01em', flexShrink: 0 }}>{formatCurrency(c.total)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 99, background: theme.borderSoft, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 99, background: barColor, transition: 'width 0.5s' }} />
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: theme.muted, width: 36, textAlign: 'right', flexShrink: 0 }}>{(pct * 100).toFixed(pct < 0.1 ? 1 : 0)}%</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 10.5, color: theme.soft }}>{c.count} {c.count === 1 ? 'transaction' : 'transactions'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top merchants */}
          {topMerchants.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={sectionLabel}>Top merchants</div>
              <div style={{ border: `1px solid ${theme.borderSoft}`, borderRadius: 14, background: theme.surface, overflow: 'hidden' }}>
                {topMerchants.map((m, i) => (
                  <div key={m.name}>
                    {i > 0 && <div style={{ height: 1, background: theme.borderSoft, marginLeft: 52 }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: catBg(m.lastCat, theme.dark), color: catFg(m.lastCat, theme.dark), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{getCatEmoji(m.lastCat)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        <div style={{ fontSize: 11.5, color: theme.muted }}>{m.count} {m.count === 1 ? 'charge' : 'charges'} · {m.lastCat}</div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 14, color: theme.debit, flexShrink: 0 }}>{formatCurrency(m.total)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Foot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500, color: theme.soft, padding: '8px 0' }}>
        <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block' }} />
        Computed live · {txns.length} transactions analysed
        <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block' }} />
      </div>

      <style>{`@keyframes dashIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
