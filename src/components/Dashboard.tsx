'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getDateRange } from '@/lib/utils';
import type { Transaction, DateFilter, Metrics } from '@/types/transaction';
import MetricsBar from './MetricsBar';
import FilterBar from './FilterBar';
import TransactionTable from './TransactionTable';
import TransactionModal from './TransactionModal';
import DeleteConfirmModal from './DeleteConfirmModal';

const PAGE_SIZE = 50;

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('current_month');
  const [metrics, setMetrics] = useState<Metrics>({ totalOutflow: 0, totalInflow: 0, topCategory: '' });
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<{ id: string; merchant: string } | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }

  function handleDateFilterChange(value: DateFilter) {
    setDateFilter(value);
    setPage(1);
  }

  const fetchTransactions = useCallback(async () => {
    setLoadingTable(true);
    const offset = (page - 1) * PAGE_SIZE;
    const range = getDateRange(dateFilter);

    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('transaction_date', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (debouncedSearch.trim()) {
      query = query.or(
        `merchant.ilike.%${debouncedSearch.trim()}%,category.ilike.%${debouncedSearch.trim()}%`
      );
    }
    if (range) {
      query = query.gte('transaction_date', range.from).lte('transaction_date', range.to);
    }

    const { data, count, error } = await query;
    setLoadingTable(false);
    if (!error) {
      setTransactions((data as Transaction[]) ?? []);
      setTotalCount(count ?? 0);
    }
  }, [page, debouncedSearch, dateFilter]);

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    const range = getDateRange(dateFilter);

    let query = supabase.from('transactions').select('type, amount, category');
    if (debouncedSearch.trim()) {
      query = query.or(
        `merchant.ilike.%${debouncedSearch.trim()}%,category.ilike.%${debouncedSearch.trim()}%`
      );
    }
    if (range) {
      query = query.gte('transaction_date', range.from).lte('transaction_date', range.to);
    }

    const { data, error } = await query;
    setLoadingMetrics(false);
    if (error || !data) return;

    let totalOutflow = 0;
    let totalInflow = 0;
    const categoryTotals: Record<string, number> = {};

    for (const row of data as { type: string; amount: number; category: string }[]) {
      if (row.type === 'debit') {
        totalOutflow += row.amount;
        if (row.category) {
          categoryTotals[row.category] = (categoryTotals[row.category] ?? 0) + row.amount;
        }
      } else if (row.type === 'credit') {
        totalInflow += row.amount;
      }
    }

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    setMetrics({ totalOutflow, totalInflow, topCategory });
  }, [debouncedSearch, dateFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  function handleCategoryUpdate(id: string, category: string) {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, category } : tx))
    );
  }

  function handleSaved(saved: Transaction) {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
    if (editingTransaction) {
      setTransactions((prev) => prev.map((tx) => (tx.id === saved.id ? saved : tx)));
    } else {
      setTransactions((prev) => [saved, ...prev.slice(0, PAGE_SIZE - 1)]);
      setTotalCount((c) => c + 1);
    }
    fetchMetrics();
  }

  function handleDeleted(id: string) {
    setDeletingTransaction(null);
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));
    fetchMetrics();
  }

  function handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ledger_authed');
      window.location.reload();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="7" width="20" height="14" rx="2.5" stroke="white" strokeWidth="2"/>
                <path d="M7 7V5a5 5 0 0 1 10 0v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="14" r="2" fill="white"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-900 tracking-tight">Personal Expense Tracker</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your complete financial ledger</p>
        </div>

        <MetricsBar metrics={metrics} loading={loadingMetrics} />

        <FilterBar
          search={search}
          onSearchChange={handleSearchChange}
          dateFilter={dateFilter}
          onDateFilterChange={handleDateFilterChange}
          onNewTransaction={() => setIsAddModalOpen(true)}
        />

        <TransactionTable
          transactions={transactions}
          totalCount={totalCount}
          page={page}
          pageSize={PAGE_SIZE}
          loading={loadingTable}
          onPageChange={setPage}
          onCategoryUpdate={handleCategoryUpdate}
          onEdit={(tx) => setEditingTransaction(tx)}
          onDelete={(id) => {
            const tx = transactions.find((t) => t.id === id);
            setDeletingTransaction({ id, merchant: tx?.merchant ?? '' });
          }}
        />
      </main>

      {/* Modals */}
      {(isAddModalOpen || editingTransaction) && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={() => { setIsAddModalOpen(false); setEditingTransaction(null); }}
          onSave={handleSaved}
        />
      )}

      {deletingTransaction && (
        <DeleteConfirmModal
          transactionId={deletingTransaction.id}
          merchantName={deletingTransaction.merchant}
          onClose={() => setDeletingTransaction(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
