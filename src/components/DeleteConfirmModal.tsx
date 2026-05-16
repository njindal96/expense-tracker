'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DeleteConfirmModalProps {
  transactionId: string;
  merchantName: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export default function DeleteConfirmModal({
  transactionId,
  merchantName,
  onClose,
  onDeleted,
}: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    const { error: err } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);
    setDeleting(false);
    if (err) {
      setError(err.message);
      return;
    }
    onDeleted(transactionId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Delete Transaction</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-700">
                Are you sure you want to permanently delete the transaction from{' '}
                <span className="font-semibold text-slate-900">{merchantName || 'this merchant'}</span>?
              </p>
              <p className="text-xs text-slate-400 mt-1.5">This action cannot be undone.</p>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
