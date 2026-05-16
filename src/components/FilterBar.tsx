'use client';

import { Search, Plus } from 'lucide-react';
import type { DateFilter } from '@/types/transaction';

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (v: DateFilter) => void;
  onNewTransaction: () => void;
}

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: 'current_month', label: 'Current Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all_time', label: 'All Time' },
];

export default function FilterBar({
  search,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  onNewTransaction,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search merchant or category…"
            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 w-full sm:w-72 transition-colors"
          />
        </div>

        <select
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value as DateFilter)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-slate-400 transition-colors cursor-pointer"
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onNewTransaction}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" />
        New Transaction
      </button>
    </div>
  );
}
