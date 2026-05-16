'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Transaction } from '@/types/transaction';

interface RowActionsMenuProps {
  transaction: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function RowActionsMenu({ transaction, onEdit, onDelete }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEdit(transaction); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(transaction.id); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
