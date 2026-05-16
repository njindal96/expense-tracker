import { ArrowDownRight, ArrowUpRight, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Metrics } from '@/types/transaction';

interface MetricsBarProps {
  metrics: Metrics;
  loading: boolean;
}

export default function MetricsBar({ metrics, loading }: MetricsBarProps) {
  const cards = [
    {
      label: 'Total Outflow',
      value: formatCurrency(metrics.totalOutflow),
      icon: ArrowDownRight,
      valueClass: 'text-red-600',
      iconClass: 'text-red-500 bg-red-50',
    },
    {
      label: 'Total Inflow',
      value: formatCurrency(metrics.totalInflow),
      icon: ArrowUpRight,
      valueClass: 'text-emerald-600',
      iconClass: 'text-emerald-500 bg-emerald-50',
    },
    {
      label: 'Top Spending Category',
      value: metrics.topCategory || '—',
      icon: Tag,
      valueClass: 'text-slate-900',
      iconClass: 'text-slate-500 bg-slate-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.iconClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 mb-0.5 truncate">{card.label}</p>
              {loading ? (
                <div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
              ) : (
                <p className={`text-base font-semibold truncate ${card.valueClass}`}>{card.value}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
