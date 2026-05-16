import { CATEGORIES } from './utils';

const STORAGE_KEY = 'ledger_custom_categories';

export function getStoredCustomCategories(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function getAllCategories(): string[] {
  return Array.from(new Set([...CATEGORIES, ...getStoredCustomCategories()]));
}

export function persistCustomCategory(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = getStoredCustomCategories();
  if (existing.includes(trimmed) || CATEGORIES.includes(trimmed)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, trimmed]));
}
