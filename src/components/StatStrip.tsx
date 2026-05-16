'use client';

import { useTheme, catBg, catFg } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils';
import { getCatEmoji } from '@/lib/categories';
import type { Transaction } from '@/types/transaction';

interface StatStripProps {
  txns: Transaction[];
}

function Sparkline({ values, color, width = 140, height = 32 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length < 2) return <div style={{ height }} />;
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min || 1;
  const n = values.length;
  const stepX = width / (n - 1);
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y];
  });
  const path = pts.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(' ');
  const area = path + ` L${width} ${height} L0 ${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <path d={area} fill={color} fillOpacity="0.10" />
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}

export default function StatStrip({ txns }: StatStripProps) {
  const theme = useTheme();

  // Top category
  const byCat: Record<string, number> = {};
  let totalDebit = 0;
  txns.filter(t => t.type === 'debit').forEach(t => {
    byCat[t.category] = (byCat[t.category] ?? 0) + t.amount;
    totalDebit += t.amount;
  });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const [topCatName, topCatAmt] = sorted[0] ?? ['—', 0];
  const topPct = totalDebit > 0 ? Math.round((topCatAmt / totalDebit) * 100) : 0;

  // Daily spend (last 15 days)
  const dayMap: Record<number, number> = {};
  txns.filter(t => t.type === 'debit').forEach(t => {
    const d = new Date(t.transaction_date).getDate();
    dayMap[d] = (dayMap[d] ?? 0) + t.amount;
  });
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: Math.min(daysInMonth, 20) }, (_, i) => dayMap[i + 1] ?? 0);
  const startDay = Math.max(1, now.getDate() - 14);
  const sparkValues = Array.from({ length: now.getDate() - startDay + 1 }, (_, i) => dayMap[startDay + i] ?? 0);

  const cardStyle = (extra?: object) => ({
    border: `1px solid ${theme.borderSoft}`,
    borderRadius: 14,
    padding: '12px 14px',
    background: theme.surface,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    minHeight: 88,
    ...extra,
  });

  const labelStyle = { fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.10em', fontWeight: 500, color: theme.muted };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {/* Top category */}
      <div style={cardStyle()}>
        <div style={labelStyle}>Top category</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: catBg(topCatName, theme.dark), color: catFg(topCatName, theme.dark), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {getCatEmoji(topCatName)}
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
              {topCatName}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-serif), Georgia, serif', color: theme.text }}>{formatCurrency(topCatAmt)}</div>
            <div style={{ fontSize: 11, color: theme.muted }}>{topPct}% of outflow</div>
          </div>
        </div>
      </div>

      {/* Daily spend sparkline */}
      <div style={cardStyle()}>
        <div style={labelStyle}>Daily spend</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'space-between' }}>
          <Sparkline values={sparkValues.length > 1 ? sparkValues : days} color={theme.debit} width={132} height={34} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'monospace', color: theme.soft }}>
            <span>Day {startDay}</span>
            <span>Day {now.getDate()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
