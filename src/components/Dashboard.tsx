'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LIGHT, DARK, ThemeContext, useTheme, type Theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { getDateRange } from '@/lib/utils';
import type { Transaction, DateFilter } from '@/types/transaction';
import MonthHero from './MonthHero';
import StatStrip from './StatStrip';
import LedgerView, { groupByDate } from './LedgerView';
import AnalyticsView from './AnalyticsView';
import TransactionModal from './TransactionModal';
import CategorySheet from './CategorySheet';
import UndoToast, { type ToastData } from './UndoToast';

const PAGE_SIZE = 50;

// ─── Desktop nav ───────────────────────────────────────────
function DesktopNav({ activeTab, onTab, onAdd, onToggleTheme, onLock, search, onSearch, dateFilter, onDateFilter }: {
  activeTab: 'ledger' | 'analytics';
  onTab: (t: 'ledger' | 'analytics') => void;
  onAdd: () => void;
  onToggleTheme: () => void;
  onLock: () => void;
  search: string;
  onSearch: (v: string) => void;
  dateFilter: DateFilter;
  onDateFilter: (v: DateFilter) => void;
}) {
  const theme = useTheme();
  const now = new Date();
  const dayLine = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: `1px solid ${theme.borderSoft}`,
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      background: theme.dark ? 'rgba(14,12,9,0.80)' : 'rgba(250,247,242,0.80)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(auto,340px) minmax(200px,1fr) auto', alignItems: 'center', gap: 16, height: 64, padding: '0 28px', maxWidth: 1440, margin: '0 auto' }}>
        {/* Left: brand + tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {/* Wordmark matching lock screen */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, lineHeight: 1, flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 22, fontStyle: 'italic', letterSpacing: '-0.005em', color: theme.text }}>Quiet</span>
            <span style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 22, letterSpacing: '-0.005em', color: theme.accent }}>Books</span>
          </div>
          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 2, padding: 3, border: `1px solid ${theme.borderSoft}`, borderRadius: 99, background: theme.surfaceAlt }}>
            {(['ledger', 'analytics'] as const).map(tab => (
              <button key={tab} onClick={() => onTab(tab)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                border: 0, padding: '6px 12px', borderRadius: 99,
                background: activeTab === tab ? theme.surface : 'transparent',
                color: activeTab === tab ? theme.text : theme.muted,
                fontSize: 12.5, fontWeight: activeTab === tab ? 600 : 500,
                letterSpacing: '-0.005em', cursor: 'pointer', transition: 'all 0.18s',
                boxShadow: activeTab === tab ? `0 1px 2px ${theme.shadowSoft}` : 'none',
                fontFamily: 'var(--font-inter), system-ui, sans-serif',
              }}>
                {tab === 'ledger' ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 10L12 4l9 6"/><path d="M5 10v9M19 10v9M9 10v9M15 10v9"/><path d="M3 21h18"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>
                )}
                <span style={{ textTransform: 'capitalize' }}>{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: search + date filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 38, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, padding: '0 10px', background: theme.surface, minWidth: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="6"/><path d="m20 20-3.5-3.5"/></svg>
            <input value={search} onChange={e => onSearch(e.target.value)}
              placeholder="Search merchant, category, bank…"
              style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', fontSize: 13, letterSpacing: '-0.005em', color: theme.text, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
            />
            <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '3px 6px', border: `1px solid ${theme.borderSoft}`, borderRadius: 5, color: theme.soft, flexShrink: 0 }}>⌘ K</span>
          </div>
          <select value={dateFilter} onChange={e => onDateFilter(e.target.value as DateFilter)}
            style={{ height: 38, padding: '0 10px', border: `1px solid ${theme.borderSoft}`, borderRadius: 10, background: theme.surface, color: theme.muted, fontSize: 12.5, outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-inter), system-ui, sans-serif', flexShrink: 0 }}>
            <option value="current_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="all_time">All Time</option>
          </select>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 0, height: 38, padding: '0 14px', borderRadius: 99, background: theme.text, color: theme.bg, fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.005em', cursor: 'pointer', boxShadow: `0 2px 6px ${theme.shadowSoft}`, fontFamily: 'var(--font-inter), system-ui, sans-serif', transition: 'transform 0.12s' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            New transaction
          </button>
          <span style={{ width: 1, height: 22, background: theme.borderSoft }} />
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.muted, whiteSpace: 'nowrap' }}>{dayLine}</div>
          <button onClick={onToggleTheme} style={{ width: 36, height: 36, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, background: theme.surface, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {theme.dark
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
          <button onClick={onLock} style={{ width: 36, height: 36, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, background: theme.surface, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Main Dashboard ────────────────────────────────────────
export default function Dashboard() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ledger_theme') === 'dark' ? DARK : LIGHT;
    }
    return LIGHT;
  });
  const [activeTab, setActiveTab] = useState<'ledger' | 'analytics'>('ledger');

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTxns, setAllTxns] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('current_month');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);

  // Overlays
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [catSheetTxn, setCatSheetTxn] = useState<Transaction | null>(null);
  const [undoToast, setUndoToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggleTheme() {
    setTheme(t => {
      const next = t.dark ? LIGHT : DARK;
      localStorage.setItem('ledger_theme', next.dark ? 'dark' : 'light');
      return next;
    });
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 300);
  }

  function handleDateFilter(v: DateFilter) { setDateFilter(v); setPage(1); }

  // Paginated fetch
  const fetchTransactions = useCallback(async () => {
    setLoadingTable(true);
    const offset = (page - 1) * PAGE_SIZE;
    const range = getDateRange(dateFilter);
    let q = supabase.from('transactions').select('*', { count: 'exact' })
      .order('transaction_date', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (debouncedSearch.trim()) q = q.or(`merchant.ilike.%${debouncedSearch.trim()}%,category.ilike.%${debouncedSearch.trim()}%`);
    if (range) q = q.gte('transaction_date', range.from).lte('transaction_date', range.to);
    const { data, count, error } = await q;
    setLoadingTable(false);
    if (!error) { setTransactions((data as Transaction[]) ?? []); setTotalCount(count ?? 0); }
  }, [page, debouncedSearch, dateFilter]);

  // Unpaginated fetch (hero / stats / analytics)
  const fetchAll = useCallback(async () => {
    setLoadingAll(true);
    const range = getDateRange(dateFilter);
    let q = supabase.from('transactions').select('*').order('transaction_date', { ascending: false });
    if (debouncedSearch.trim()) q = q.or(`merchant.ilike.%${debouncedSearch.trim()}%,category.ilike.%${debouncedSearch.trim()}%`);
    if (range) q = q.gte('transaction_date', range.from).lte('transaction_date', range.to);
    const { data, error } = await q;
    setLoadingAll(false);
    if (!error) setAllTxns((data as Transaction[]) ?? []);
  }, [debouncedSearch, dateFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Category update with undo toast
  async function handleCategoryUpdate(id: string, oldCat: string, newCat: string) {
    if (oldCat === newCat) return;
    const merchant = transactions.find(t => t.id === id)?.merchant ?? allTxns.find(t => t.id === id)?.merchant ?? '';
    const patch = (arr: Transaction[]) => arr.map(t => t.id === id ? { ...t, category: newCat } : t);
    setTransactions(patch); setAllTxns(patch);
    // Close category sheet and update the row being edited if open
    setCatSheetTxn(null);
    if (editingTxn?.id === id) setEditingTxn(prev => prev ? { ...prev, category: newCat } : null);

    if (toastTimer.current) clearTimeout(toastTimer.current);
    setUndoToast({ txnId: id, merchant, oldCategory: oldCat, newCategory: newCat });
    toastTimer.current = setTimeout(() => setUndoToast(null), 3500);

    const { error } = await supabase.from('transactions').update({ category: newCat }).eq('id', id);
    if (error) {
      const revert = (arr: Transaction[]) => arr.map(t => t.id === id ? { ...t, category: oldCat } : t);
      setTransactions(revert); setAllTxns(revert);
    }
  }

  function handleUndoCategory() {
    if (!undoToast) return;
    const { txnId, oldCategory } = undoToast;
    const revert = (arr: Transaction[]) => arr.map(t => t.id === txnId ? { ...t, category: oldCategory } : t);
    setTransactions(revert); setAllTxns(revert);
    supabase.from('transactions').update({ category: oldCategory }).eq('id', txnId);
    setUndoToast(null);
  }

  function handleSaved(saved: Transaction) {
    setIsAddOpen(false);
    setEditingTxn(null);
    if (editingTxn) {
      const patch = (arr: Transaction[]) => arr.map(t => t.id === saved.id ? saved : t);
      setTransactions(patch); setAllTxns(patch);
    } else {
      setTransactions(prev => [saved, ...prev.slice(0, PAGE_SIZE - 1)]);
      setAllTxns(prev => [saved, ...prev]);
      setTotalCount(c => c + 1);
    }
  }

  function handleDeleted(id: string) {
    const remove = (arr: Transaction[]) => arr.filter(t => t.id !== id);
    setTransactions(remove); setAllTxns(remove);
    setTotalCount(c => Math.max(0, c - 1));
    setEditingTxn(null); setIsAddOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem('ledger_authed');
    window.location.reload();
  }

  const displayTransactions = needsReviewOnly ? transactions.filter(t => t.status === 'pending') : transactions;
  const needsReviewCount = transactions.filter(t => t.status === 'pending').length;
  const grouped = groupByDate(displayTransactions);

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        <DesktopNav
          activeTab={activeTab} onTab={setActiveTab}
          onAdd={() => setIsAddOpen(true)}
          onToggleTheme={toggleTheme}
          onLock={handleLogout}
          search={search} onSearch={handleSearchChange}
          dateFilter={dateFilter} onDateFilter={handleDateFilter}
        />

        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px 80px' }}>
          {activeTab === 'ledger' && (
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '16px 36px', alignItems: 'start' }}>
              {/* Left sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>
                <MonthHero txns={loadingAll ? [] : allTxns} dateFilter={dateFilter} />
                {!loadingAll && <StatStrip txns={allTxns} />}
              </div>
              {/* Right: ledger */}
              <LedgerView
                grouped={grouped}
                totalCount={totalCount}
                page={page}
                pageSize={PAGE_SIZE}
                loading={loadingTable}
                onPageChange={setPage}
                needsReviewOnly={needsReviewOnly}
                needsReviewCount={needsReviewCount}
                onToggleNeedsReview={() => setNeedsReviewOnly(v => !v)}
                onCategoryClick={txn => setCatSheetTxn(txn)}
                onRowClick={txn => setEditingTxn(txn)}
              />
            </div>
          )}
          {activeTab === 'analytics' && (
            <AnalyticsView txns={loadingAll ? [] : allTxns} dateFilter={dateFilter} onDateFilter={handleDateFilter} />
          )}
        </main>

        {/* Overlays */}
        {(isAddOpen || editingTxn) && (
          <TransactionModal
            transaction={editingTxn}
            onClose={() => { setIsAddOpen(false); setEditingTxn(null); }}
            onSave={handleSaved}
            onDelete={handleDeleted}
          />
        )}

        {catSheetTxn && (
          <CategorySheet
            txn={catSheetTxn}
            onClose={() => setCatSheetTxn(null)}
            onPick={newCat => handleCategoryUpdate(catSheetTxn.id, catSheetTxn.category, newCat)}
          />
        )}

        {undoToast && <UndoToast toast={undoToast} onUndo={handleUndoCategory} />}
      </div>
    </ThemeContext.Provider>
  );
}
