'use client';

import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, Repeat2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types/transaction';
import CategoryDropdown from './CategoryDropdown';
import RowActionsMenu from './RowActionsMenu';

interface TransactionTableProps {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onCategoryUpdate: (id: string, category: string) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const TYPE_CONFIG = {
  debit: {
    icon: ArrowDownRight,
    textClass: 'text-red-600',
    bgClass: 'bg-red-50',
  },
  credit: {
    icon: ArrowUpRight,
    textClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
  },
  transfer: {
    icon: ArrowLeftRight,
    textClass: 'text-slate-600',
    bgClass: 'bg-slate-100',
  },
};

const STATUS_CLASSES: Record<string, string> = {
  cleared: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-600',
};

export default function TransactionTable({
  transactions,
  totalCount,
  page,
  pageSize,
  loading,
  onPageChange,
  onCategoryUpdate,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="overflow-x-auto rounded-t-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Merchant</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Bank / Method</th>
              <th className="text-right px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Category</th>
              <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + (i * j * 7) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-slate-400 text-sm">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const cfg = TYPE_CONFIG[tx.type];
                const Icon = cfg.icon;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {formatDate(tx.transaction_date)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.bgClass}`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.textClass}`} />
                        </div>
                        <span className="font-medium text-slate-900 truncate max-w-[180px]">
                          {tx.merchant || '—'}
                        </span>
                        {tx.is_recurring && (
                          <span title="Recurring"><Repeat2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-slate-700">{tx.bank_name || '—'}</span>
                        {tx.payment_method && (
                          <span className="text-xs text-slate-400">{tx.payment_method}</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-right font-semibold whitespace-nowrap ${cfg.textClass}`}>
                      {tx.type === 'debit' ? '−' : tx.type === 'credit' ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <CategoryDropdown
                        id={tx.id}
                        category={tx.category}
                        onUpdate={onCategoryUpdate}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${STATUS_CLASSES[tx.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <RowActionsMenu
                        transaction={tx}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          {totalCount === 0
            ? 'No results'
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-600 font-medium px-1">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
