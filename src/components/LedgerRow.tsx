'use client';

import { useTheme, catBg, catFg } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils';
import { getCatEmoji } from '@/lib/categories';
import type { Transaction } from '@/types/transaction';

interface LedgerRowProps {
  txn: Transaction;
  onCategoryClick: (txn: Transaction) => void;
  onRowClick: (txn: Transaction) => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function LedgerRow({ txn, onCategoryClick, onRowClick, isFirst, isLast }: LedgerRowProps) {
  const theme = useTheme();

  const isCredit = txn.type === 'credit';
  const isPending = txn.status === 'pending';
  const amtColor = isCredit ? theme.credit : theme.text;

  const tintBg = isPending
    ? (theme.dark ? 'rgba(216,130,96,0.08)' : 'rgba(168,72,44,0.04)')
    : 'transparent';

  const timeStr = new Date(txn.transaction_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const radius = isFirst && isLast ? 14
    : isFirst ? '14px 14px 0 0'
    : isLast  ? '0 0 14px 14px'
    : 0;

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: tintBg, position: 'relative', borderRadius: radius, cursor: 'pointer', transition: 'background 0.15s' }}
      onClick={e => {
        if ((e.target as HTMLElement).closest('[data-cat-trigger]')) return;
        onRowClick(txn);
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = theme.dark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = tintBg; }}
    >
      {isPending && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, background: theme.debit, opacity: 0.7, borderRadius: isFirst ? '14px 0 0 0' : isLast ? '0 0 0 14px' : 0 }} />}

      {/* Category emoji glyph — click → CategorySheet */}
      <button
        data-cat-trigger
        onClick={e => { e.stopPropagation(); onCategoryClick(txn); }}
        style={{ width: 42, height: 42, borderRadius: 12, background: catBg(txn.category, theme.dark), color: catFg(txn.category, theme.dark), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: 0, cursor: 'pointer', flexShrink: 0, transition: 'transform 0.12s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        aria-label="Change category"
      >
        {getCatEmoji(txn.category)}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Top: merchant + amount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: '-0.005em', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {txn.merchant || '—'}
            </span>
            {txn.is_recurring && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={theme.soft} strokeWidth="1.6" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            )}
            {isPending && (
              <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 4, fontWeight: 600, background: theme.warnBg, color: theme.warn, flexShrink: 0 }}>pending</span>
            )}
          </div>
          <span style={{ fontSize: 15, fontWeight: 500, color: amtColor, letterSpacing: '-0.005em', whiteSpace: 'nowrap', fontFamily: 'var(--font-serif), Georgia, serif', fontStyle: isCredit ? 'italic' : 'normal' }}>
            {isCredit ? '+' : ''}{formatCurrency(txn.amount)}
          </span>
        </div>

        {/* Bottom: category label (clickable) + meta */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(40px, max-content) minmax(0, 1fr)', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            data-cat-trigger
            onClick={e => { e.stopPropagation(); onCategoryClick(txn); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', cursor: 'pointer', padding: '2px 0', color: isPending ? theme.debit : theme.text, fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.category || 'Uncategorised'}</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M6 9l6 6 6-6"/></svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: theme.muted, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', minWidth: 0, justifyContent: 'flex-end' }}>
            <span style={{ flexShrink: 0 }}>{timeStr}</span>
            {txn.payment_method && <><span style={{ width: 2, height: 2, borderRadius: 99, background: theme.soft, display: 'inline-block', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.payment_method}</span></>}
            {txn.bank_name && <><span style={{ width: 2, height: 2, borderRadius: 99, background: theme.soft, display: 'inline-block', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.bank_name}</span></>}
          </div>
        </div>

        {/* "Looks unsure" hint for pending */}
        {isPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, marginTop: 2, fontWeight: 400, fontStyle: 'italic', fontFamily: 'var(--font-serif), Georgia, serif', letterSpacing: '0.01em', color: theme.debit }}>
            <span style={{ width: 4, height: 4, borderRadius: 99, background: theme.debit, display: 'inline-block' }} />
            <em>Pending — tap to confirm</em>
          </div>
        )}
      </div>
    </div>
  );
}
