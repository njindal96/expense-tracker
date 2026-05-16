'use client';

import { useTheme } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import type { Transaction } from '@/types/transaction';
import LedgerRow from './LedgerRow';

export interface GroupedDay {
  key: string;
  label: string;
  rows: Transaction[];
}

interface LedgerViewProps {
  grouped: GroupedDay[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (p: number) => void;
  needsReviewOnly: boolean;
  needsReviewCount: number;
  onToggleNeedsReview: () => void;
  onCategoryUpdate: (id: string, oldCat: string, newCat: string) => void;
  onEdit: (txn: Transaction) => void;
  onDelete: (id: string) => void;
}

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function groupByDate(txns: Transaction[]): GroupedDay[] {
  const map = new Map<string, GroupedDay>();
  txns.forEach(tx => {
    const date = new Date(tx.transaction_date);
    const key = date.toDateString();
    if (!map.has(key)) {
      map.set(key, { key, label: formatDayHeader(tx.transaction_date), rows: [] });
    }
    map.get(key)!.rows.push(tx);
  });
  return Array.from(map.values());
}

export default function LedgerView({
  grouped,
  totalCount,
  page,
  pageSize,
  loading,
  onPageChange,
  needsReviewOnly,
  needsReviewCount,
  onToggleNeedsReview,
  onCategoryUpdate,
  onEdit,
  onDelete,
}: LedgerViewProps) {
  const theme = useTheme();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const allRows = grouped.flatMap(g => g.rows);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter chip */}
      {needsReviewCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onToggleNeedsReview}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              border: `1px solid ${needsReviewOnly ? theme.debit : theme.borderSoft}`,
              borderRadius: 99, padding: '7px 7px 7px 12px',
              background: needsReviewOnly ? theme.debit : theme.surface,
              color: needsReviewOnly ? theme.bg : theme.debit,
              fontSize: 12, fontWeight: 500, letterSpacing: '-0.005em',
              cursor: 'pointer', transition: 'all 0.18s',
              fontFamily: 'var(--font-inter), system-ui, sans-serif',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 99, background: needsReviewOnly ? theme.bg : theme.debit, animation: 'dotPulse 1.6s ease-in-out infinite', flexShrink: 0 }} />
            Needs review
            <span style={{ minWidth: 20, height: 20, borderRadius: 99, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px', fontSize: 10.5, fontWeight: 600, fontFamily: 'monospace', background: needsReviewOnly ? 'rgba(255,255,255,0.18)' : theme.debit, color: theme.bg }}>
              {needsReviewCount}
            </span>
          </button>
          {needsReviewOnly && (
            <button onClick={onToggleNeedsReview} style={{ border: 0, background: 'transparent', fontSize: 11.5, color: theme.muted, cursor: 'pointer', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
              Show all ×
            </button>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2].map(i => (
            <div key={i}>
              <div style={{ height: 12, width: 80, borderRadius: 4, background: theme.borderSoft, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
              <div style={{ border: `1px solid ${theme.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
                {[1, 2, 3].map(j => (
                  <div key={j} style={{ padding: '14px 16px', display: 'flex', gap: 12, borderBottom: j < 3 ? `1px solid ${theme.borderSoft}` : undefined }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: theme.borderSoft, animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ height: 12, width: '60%', borderRadius: 4, background: theme.borderSoft, animation: 'pulse 1.5s infinite' }} />
                      <div style={{ height: 10, width: '40%', borderRadius: 4, background: theme.borderSoft, animation: 'pulse 1.5s infinite' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && allRows.length === 0 && (
        <div style={{ border: `1px dashed ${theme.borderSoft}`, borderRadius: 14, padding: '32px 16px', textAlign: 'center', fontSize: 13, color: theme.muted, fontStyle: 'italic', fontFamily: 'var(--font-serif), Georgia, serif' }}>
          No transactions found
        </div>
      )}

      {/* Grouped day sections */}
      {!loading && grouped.map(group => (
        <section key={group.key}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500, color: theme.muted, padding: '6px 2px', marginBottom: 6 }}>
            <span>{group.label}</span>
            <span style={{ flex: 1, height: 1, background: theme.borderSoft, opacity: 0.7 }} />
            <span style={{ fontFamily: 'monospace', fontSize: 9.5, opacity: 0.7 }}>{group.rows.length}</span>
          </div>
          <div style={{ border: `1px solid ${theme.borderSoft}`, borderRadius: 14, overflow: 'hidden', background: theme.surface }}>
            {group.rows.map((txn, i) => (
              <div key={txn.id}>
                {i > 0 && <div style={{ height: 1, background: theme.borderSoft, marginLeft: 70 }} />}
                <LedgerRow
                  txn={txn}
                  isFirst={i === 0}
                  isLast={i === group.rows.length - 1}
                  onCategoryUpdate={onCategoryUpdate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Footer: count + pagination */}
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500, color: theme.soft }}>
            <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block' }} />
            <span>{totalCount} transactions</span>
            <span style={{ width: 24, height: 1, background: theme.borderSoft, display: 'inline-block' }} />
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                style={{ width: 30, height: 30, border: `1px solid ${theme.borderSoft}`, borderRadius: 8, background: theme.surface, color: theme.muted, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span style={{ fontSize: 12, color: theme.muted, fontFamily: 'monospace' }}>{page} / {totalPages}</span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                style={{ width: 30, height: 30, border: `1px solid ${theme.borderSoft}`, borderRadius: 8, background: theme.surface, color: theme.muted, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes dotPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.55; transform:scale(0.85); } }
      `}</style>
    </div>
  );
}

export { formatDate };
