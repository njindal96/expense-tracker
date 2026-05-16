import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { DateFilter } from '@/types/transaction';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function getDateRange(filter: DateFilter): { from: string; to: string } | null {
  const now = new Date();
  if (filter === 'current_month') {
    return {
      from: startOfMonth(now).toISOString(),
      to: endOfMonth(now).toISOString(),
    };
  }
  if (filter === 'last_month') {
    const lastMonth = subMonths(now, 1);
    return {
      from: startOfMonth(lastMonth).toISOString(),
      to: endOfMonth(lastMonth).toISOString(),
    };
  }
  return null;
}

export const CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health & Medical',
  'Utilities',
  'Rent & Housing',
  'Travel',
  'Education',
  'Salary',
  'Freelance',
  'Investment',
  'Transfer',
  'Subscriptions',
  'Insurance',
  'Other',
];
