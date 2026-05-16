'use client';

import { useTheme } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/lib/useIsMobile';
import type { Transaction, DateFilter } from '@/types/transaction';

interface MonthHeroProps {
  txns: Transaction[];
  dateFilter: DateFilter;
}

function heroLabel(dateFilter: DateFilter): string {
  const now = new Date();
  if (dateFilter === 'current_month') {
    return now.toLocaleDateString('en-IN', { month: 'long' }) + ', so far';
  }
  if (dateFilter === 'last_month') {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return lm.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  return 'All time';
}

export default function MonthHero({ txns, dateFilter }: MonthHeroProps) {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const outflow = txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const inflow = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const net = inflow - outflow;
  const ratio = inflow > 0 ? Math.min(1, outflow / inflow) : outflow > 0 ? 1 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500, color: theme.muted }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: theme.credit, display: 'inline-block' }} />
        {heroLabel(dateFilter)}
      </div>

      {/* Net amount */}
      <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: isMobile ? 44 : 52, lineHeight: 1.05, letterSpacing: '-0.02em', color: net >= 0 ? theme.credit : theme.text, fontStyle: 'italic' }}>
        {net >= 0 ? '+' : ''}{formatCurrency(net)}
      </div>
      <div style={{ fontSize: 13, fontStyle: 'italic', fontFamily: 'var(--font-serif), Georgia, serif', color: theme.muted, marginTop: -4 }}>
        net cash flow
      </div>

      {/* Bar */}
      <div style={{ height: 3, borderRadius: 99, background: theme.borderSoft, overflow: 'hidden', margin: '6px 0 8px' }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${ratio * 100}%`, background: `linear-gradient(90deg, ${theme.debit}66, ${theme.debit})`, transition: 'width 0.6s cubic-bezier(0.2,0.8,0.2,1)' }} />
      </div>

      {/* Foot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, color: theme.muted }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M17 7L7 17"/><path d="M16 17H7V8"/></svg>
            Outflow
          </div>
          <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 18, color: theme.debit, letterSpacing: '-0.01em' }}>{formatCurrency(outflow)}</div>
        </div>
        <div style={{ width: 1, height: 28, background: theme.borderSoft }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, color: theme.muted }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>
            Inflow
          </div>
          <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 18, color: theme.credit, letterSpacing: '-0.01em' }}>{formatCurrency(inflow)}</div>
        </div>
      </div>
    </div>
  );
}
