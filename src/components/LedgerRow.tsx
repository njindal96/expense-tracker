'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme, catBg, catFg } from '@/lib/theme';
import { formatCurrency } from '@/lib/utils';
import { getAllCategories, persistCustomCategory } from '@/lib/categories';
import { getCatEmoji } from '@/lib/categories';
import type { Transaction } from '@/types/transaction';

interface LedgerRowProps {
  txn: Transaction;
  onCategoryUpdate: (id: string, oldCat: string, newCat: string) => void;
  onEdit: (txn: Transaction) => void;
  onDelete: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function CategoryPopover({ txn, onPick, onClose }: { txn: Transaction; onPick: (cat: string) => void; onClose: () => void }) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [cats, setCats] = useState(() => getAllCategories());
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [onClose]);

  const filtered = query.trim() ? cats.filter(c => c.toLowerCase().includes(query.toLowerCase())) : cats;
  const exactMatch = cats.some(c => c.toLowerCase() === query.trim().toLowerCase());
  const canCreate = query.trim().length > 0 && !exactMatch;

  function createAndPick() {
    const name = query.trim();
    if (!name) return;
    persistCustomCategory(name);
    setCats(getAllCategories());
    onPick(name);
  }

  function keyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) onPick(filtered[0]);
      else if (canCreate) createAndPick();
    }
    if (e.key === 'Escape') onClose();
  }

  return (
    <div ref={ref} style={{ position: 'absolute', left: 0, top: '100%', marginTop: 6, zIndex: 50, width: 220, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, boxShadow: `0 8px 24px ${theme.shadow}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 10px 8px' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={keyDown}
          placeholder="Search or create…"
          style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: `1px solid ${theme.borderSoft}`, borderRadius: 8, background: theme.surfaceAlt, color: theme.text, outline: 'none', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
        />
      </div>
      <ul style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0', listStyle: 'none', margin: 0 }}>
        {filtered.map(c => (
          <li key={c}>
            <button
              onMouseDown={e => { e.preventDefault(); onPick(c); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 0, background: c === txn.category ? theme.surfaceAlt : 'transparent', color: theme.text, fontSize: 12.5, fontWeight: c === txn.category ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
            >
              <span>{getCatEmoji(c)}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c}</span>
              {c === txn.category && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12l5 5 9-10"/></svg>}
            </button>
          </li>
        ))}
        {filtered.length === 0 && !canCreate && (
          <li style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: theme.muted }}>No categories found</li>
        )}
      </ul>
      {canCreate && (
        <div style={{ borderTop: `1px solid ${theme.borderSoft}`, padding: '6px 8px' }}>
          <button
            onMouseDown={e => { e.preventDefault(); createAndPick(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 0, background: 'transparent', color: theme.text, fontSize: 12, cursor: 'pointer', borderRadius: 8, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Create <strong style={{ marginLeft: 2 }}>&ldquo;{query.trim()}&rdquo;</strong>
          </button>
        </div>
      )}
    </div>
  );
}

export default function LedgerRow({ txn, onCategoryUpdate, onEdit, onDelete, isFirst, isLast }: LedgerRowProps) {
  const theme = useTheme();
  const [catOpen, setCatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCredit = txn.type === 'credit';
  const isPending = txn.status === 'pending';
  const amtColor = isCredit ? theme.credit : theme.text;

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [menuOpen]);

  const timeStr = new Date(txn.transaction_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const rowBg = isPending
    ? (theme.dark ? 'rgba(216,130,96,0.08)' : 'rgba(168,72,44,0.04)')
    : 'transparent';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: rowBg, position: 'relative', borderRadius: isFirst && isLast ? 14 : isFirst ? '14px 14px 0 0' : isLast ? '0 0 14px 14px' : 0, cursor: 'default' }}>
      {isPending && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, background: theme.debit, opacity: 0.7, borderRadius: isFirst ? '14px 0 0 0' : isLast ? '0 0 0 14px' : 0 }} />}

      {/* Category emoji glyph */}
      <button
        onClick={() => setCatOpen(v => !v)}
        style={{ width: 42, height: 42, borderRadius: 12, background: catBg(txn.category, theme.dark), color: catFg(txn.category, theme.dark), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: 0, cursor: 'pointer', flexShrink: 0, transition: 'transform 0.12s', position: 'relative' }}
        title="Change category"
      >
        {getCatEmoji(txn.category)}
        {catOpen && (
          <CategoryPopover
            txn={txn}
            onPick={newCat => { setCatOpen(false); if (newCat !== txn.category) onCategoryUpdate(txn.id, txn.category, newCat); }}
            onClose={() => setCatOpen(false)}
          />
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Top row: merchant + amount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: '-0.005em', color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {txn.merchant || '—'}
            </span>
            {txn.is_recurring && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={theme.soft} strokeWidth="1.6" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            )}
            {isPending && (
              <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 4, fontWeight: 600, background: theme.warnBg, color: theme.warn }}>pending</span>
            )}
          </div>
          <span style={{ fontSize: 15, fontWeight: 500, color: amtColor, letterSpacing: '-0.005em', whiteSpace: 'nowrap', fontFamily: 'var(--font-serif), Georgia, serif', fontStyle: isCredit ? 'italic' : 'normal' }}>
            {isCredit ? '+' : ''}{formatCurrency(txn.amount)}
          </span>
        </div>

        {/* Bottom row: category + meta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={() => setCatOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', cursor: 'pointer', padding: '2px 0', color: isPending ? theme.debit : theme.text, fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.005em', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.category || 'Uncategorised'}</span>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: theme.muted, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', minWidth: 0, flex: 1, justifyContent: 'flex-end' }}>
            <span style={{ flexShrink: 0 }}>{timeStr}</span>
            {txn.bank_name && <><span style={{ width: 2, height: 2, borderRadius: 99, background: theme.soft, display: 'inline-block', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.bank_name}</span></>}
            {txn.payment_method && <><span style={{ width: 2, height: 2, borderRadius: 99, background: theme.soft, display: 'inline-block', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.payment_method}</span></>}
          </div>

          {/* Three-dot menu */}
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              style={{ width: 28, height: 28, border: 0, background: 'transparent', color: theme.muted, cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 40, width: 130, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, boxShadow: `0 6px 20px ${theme.shadow}`, overflow: 'hidden' }}>
                <button onMouseDown={() => { setMenuOpen(false); onEdit(txn); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: 0, background: 'transparent', color: theme.text, fontSize: 12.5, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button onMouseDown={() => { setMenuOpen(false); onDelete(txn.id); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: 0, background: 'transparent', color: theme.debit, fontSize: 12.5, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
