'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/utils';

interface CategoryDropdownProps {
  id: string;
  category: string;
  onUpdate: (id: string, newCategory: string) => void;
}

export default function CategoryDropdown({ id, category, onUpdate }: CategoryDropdownProps) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  const allOptions = Array.from(new Set([category, ...CATEGORIES]));

  useEffect(() => {
    if (editing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editing]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCategory = e.target.value;
    setEditing(false);
    const prev = category;
    onUpdate(id, newCategory);
    const { error } = await supabase
      .from('transactions')
      .update({ category: newCategory })
      .eq('id', id);
    if (error) {
      onUpdate(id, prev);
    }
  }

  if (editing) {
    return (
      <select
        ref={selectRef}
        defaultValue={category}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-700 outline-none focus:border-slate-500 cursor-pointer"
      >
        {allOptions.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer truncate max-w-[140px]"
      title={`Click to edit: ${category}`}
    >
      {category || '—'}
    </button>
  );
}
