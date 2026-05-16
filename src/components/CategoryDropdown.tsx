'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, Plus, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAllCategories, persistCustomCategory } from '@/lib/categories';

interface CategoryDropdownProps {
  id: string;
  category: string;
  onUpdate: (id: string, newCategory: string) => void;
}

export default function CategoryDropdown({ id, category, onUpdate }: CategoryDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load categories fresh each time the popover opens
  const openDropdown = useCallback(() => {
    setCategories(getAllCategories());
    setQuery('');
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const filtered = query.trim()
    ? categories.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : categories;

  const exactMatch = categories.some(
    (c) => c.toLowerCase() === query.trim().toLowerCase()
  );
  const canCreate = query.trim().length > 0 && !exactMatch;

  async function select(newCategory: string) {
    setOpen(false);
    setQuery('');
    if (newCategory === category) return;
    const prev = category;
    onUpdate(id, newCategory);
    const { error } = await supabase
      .from('transactions')
      .update({ category: newCategory })
      .eq('id', id);
    if (error) onUpdate(id, prev);
  }

  function createAndSelect() {
    const name = query.trim();
    if (!name) return;
    persistCustomCategory(name);
    setCategories((prev) => Array.from(new Set([...prev, name])));
    select(name);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) {
        select(filtered[0]);
      } else if (canCreate) {
        createAndSelect();
      }
    }
    if (e.key === 'Escape') setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Badge trigger */}
      <button
        onClick={openDropdown}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer max-w-[150px] truncate"
        title={category || 'Set category'}
      >
        <Tag className="w-3 h-3 shrink-0" />
        <span className="truncate">{category || 'Uncategorised'}</span>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-30 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search / create input */}
          <div className="px-3 pt-3 pb-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or create…"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition-colors"
            />
          </div>

          {/* List */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((c) => (
              <li key={c}>
                <button
                  onMouseDown={(e) => { e.preventDefault(); select(c); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                    c === category
                      ? 'bg-slate-100 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex-1 truncate">{c}</span>
                  {c === category && <Check className="w-3 h-3 shrink-0 text-slate-500" />}
                </button>
              </li>
            ))}

            {filtered.length === 0 && !canCreate && (
              <li className="px-3 py-3 text-xs text-slate-400 text-center">No categories found</li>
            )}
          </ul>

          {/* Create new */}
          {canCreate && (
            <div className="border-t border-slate-100 px-2 py-2">
              <button
                onMouseDown={(e) => { e.preventDefault(); createAndSelect(); }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Create <span className="font-semibold text-slate-900">&quot;{query.trim()}&quot;</span></span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
