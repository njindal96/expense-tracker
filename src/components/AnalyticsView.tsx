'use client';

import { useMemo } from 'react';
import { useTheme, catStroke, catBg, catFg } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils';
import { getCatEmoji } from '@/lib/categories';
import type { Transaction, DateFilter } from '@/types/transaction';

interface AnalyticsViewProps {
  txns: Transaction[];
  dateFilter: DateFilter;
  onDateFilter: (f: DateFilter) => void;
}

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'current_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all_time', label: 'All Time' },
];

function DonutChart({ segments, size = 180, theme }: { segments: { name: string; pct: number }[]; size?: number; theme: ReturnType<typeof useTheme> }) {
  const R = 38;
  const C = 2 * Math.PI * R;
  let angle = -90;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={R} fill="none" stroke={theme.borderSoft} strokeWidth="18" />
      {segments.map((seg, i) => {
        const dash = seg.pct * C;
        const rot = angle;
        angle += seg.pct * 360;
        if (seg.pct < 0.005) return null;
        return (
          <circle key={i} cx="50" cy="50" r={R}
            fill="none"
            stroke={catStroke(seg.name, theme.dark)}
            strokeWidth="18"
            strokeDasharray={`${dash} ${C - dash}`}
            transform={`rotate(${rot} 50 50)`}
            style={{ transition: 'stroke-dasharray 0.5s cubic-bezier(0.2,0.85,0.2,1)' }}
          />
        );
      })}
      <circle cx="50" cy="50" r="24" fill={theme.surface} />
    </svg>
  );
}

export default function AnalyticsView({ txns, dateFilter, onDateFilter }: AnalyticsViewProps) {
  const theme = useTheme();

  const { catTotals, totalDebit, totalCredit, merchantTotals, dailySpend } = useMemo(() => {
    const catTotals: Record<string, number> = {};
    const merchantTotals: Record<string, { amount: number; count: number }> = {};
    const dailySpend: Record<number, number> = {};
    let totalDebit = 0, totalCredit = 0;

    txns.forEach(t => {
      if (t.type === 'debit') {
        totalDebit += t.amount;
        catTotals[t.category] = (catTotals[t.category] ?? 0) + t.amount;
        const m = t.merchant;
        merchantTotals[m] = merchantTotals[m] ?? { amount: 0, count: 0 };
        merchantTotals[m].amount += t.amount;
        merchantTotals[m].count += 1;
        const d = new Date(t.transaction_date).getDate();
        dailySpend[d] = (dailySpend[d] ?? 0) + t.amount;
      } else if (t.type === 'credit') {
        totalCredit += t.amount;
      }
    });
    return { catTotals, totalDebit, totalCredit, merchantTotals, dailySpend };
  }, [txns]);

  const catSorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const donutSegments = catSorted.map(([name, amt]) => ({ name, pct: totalDebit > 0 ? amt / totalDebit : 0 }));

  const merchantSorted = Object.entries(merchantTotals).sort((a, b) => b[1].amount - a[1].amount).slice(0, 6);

  // Daily bars — up to 31 days
  const maxDay = Math.max(...Object.keys(dailySpend).map(Number), 1);
  const daysArr = Array.from({ length: maxDay }, (_, i) => dailySpend[i + 1] ?? 0);
  const maxSpend = Math.max(...daysArr, 1);

  const sectionLabel = { fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.10em', fontWeight: 500, color: theme.muted };
  const card = (extra?: object) => ({ border: `1px solid ${theme.borderSoft}`, borderRadius: 16, background: theme.surface, ...extra });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px 32px', alignItems: 'start' }}>
      {/* Header — spans both cols */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={sectionLabel}>Breakdown</div>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 34, fontWeight: 400, letterSpacing: '-0.01em', color: theme.text, lineHeight: 1.1 }}>
            Spending <em style={{ fontStyle: 'italic' }}>analysis</em>
          </h2>
        </div>
        {/* Period selector */}
        <div style={{ display: 'flex', gap: 4, padding: 4, border: `1px solid ${theme.borderSoft}`, borderRadius: 11, background: theme.surfaceAlt }}>
          {DATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onDateFilter(opt.value)}
              style={{
                height: 32, padding: '0 14px', border: 0, borderRadius: 8,
                background: dateFilter === opt.value ? theme.surface : 'transparent',
                color: dateFilter === opt.value ? theme.text : theme.muted,
                fontSize: 13, fontWeight: dateFilter === opt.value ? 600 : 500,
                letterSpacing: '-0.005em', cursor: 'pointer', transition: 'all 0.18s',
                boxShadow: dateFilter === opt.value ? `0 1px 2px ${theme.shadowSoft}` : 'none',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* LEFT COL: donut + summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Donut chart */}
        <div style={{ ...card(), padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <DonutChart segments={donutSegments} size={160} theme={theme} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={sectionLabel}>Total outflow</div>
            <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 26, color: theme.debit, letterSpacing: '-0.01em' }}>{formatCurrency(totalDebit)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: theme.muted, marginTop: 4 }}>
              <span style={{ width: 2, height: 2, borderRadius: 99, background: theme.soft, display: 'inline-block' }} />
              <span>Inflow: {formatCurrency(totalCredit)}</span>
            </div>
          </div>
        </div>

        {/* Daily spend bars */}
        <div style={{ ...card(), padding: '16px 14px 12px' }}>
          <div style={{ ...sectionLabel, marginBottom: 12 }}>Daily spend</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
            {daysArr.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                <div style={{ width: '100%', height: `${Math.max(2, (v / maxSpend) * 100)}%`, background: theme.debit, borderRadius: '2px 2px 0 0', opacity: v > 0 ? 0.75 : 0.15, transition: 'height 0.4s' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', color: theme.soft, marginTop: 6 }}>
            <span>Day 1</span>
            <span>Day {maxDay}</span>
          </div>
        </div>
      </div>

      {/* RIGHT COL: category list + merchants */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Category breakdown */}
        <div style={card()}>
          <div style={{ padding: '14px 16px 8px', ...sectionLabel }}>By category</div>
          {catSorted.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: theme.muted, fontStyle: 'italic', fontFamily: 'var(--font-serif), Georgia, serif' }}>No debit transactions</div>
          ) : catSorted.map(([name, amt], i) => {
            const pct = totalDebit > 0 ? (amt / totalDebit) * 100 : 0;
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 16px', borderTop: i === 0 ? `1px solid ${theme.borderSoft}` : undefined }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: catBg(name, theme.dark), color: catFg(name, theme.dark), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {getCatEmoji(name)}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 14, color: theme.text, letterSpacing: '-0.01em', flexShrink: 0 }}>{formatCurrency(amt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, background: theme.borderSoft, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: catStroke(name, theme.dark), transition: 'width 0.5s cubic-bezier(0.2,0.85,0.2,1)' }} />
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: 10.5, color: theme.muted, width: 36, textAlign: 'right', flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top merchants */}
        {merchantSorted.length > 0 && (
          <div style={{ ...card(), overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 8px', ...sectionLabel }}>Top merchants</div>
            {merchantSorted.map(([name, data], i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: `1px solid ${theme.borderSoft}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: theme.surfaceAlt, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0, letterSpacing: '-0.01em' }}>
                  {name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '·'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 11.5, color: theme.muted }}>{data.count} transaction{data.count !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 14, color: theme.debit, letterSpacing: '-0.01em', flexShrink: 0 }}>{formatCurrency(data.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Foot */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500, color: theme.soft, padding: '8px 0' }}>
        <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block' }} />
        {txns.length} transactions analysed
        <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block' }} />
      </div>
    </div>
  );
}
