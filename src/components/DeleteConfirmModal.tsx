'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

interface DeleteConfirmModalProps {
  transactionId: string;
  merchantName: string;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export default function DeleteConfirmModal({ transactionId, merchantName, onClose, onDeleted }: DeleteConfirmModalProps) {
  const theme = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    const { error: err } = await supabase.from('transactions').delete().eq('id', transactionId);
    setDeleting(false);
    if (err) { setError(err.message); return; }
    onDeleted(transactionId);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 20, width: '100%', maxWidth: 380, padding: '24px', boxShadow: `0 20px 50px ${theme.shadow}`, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.dark ? 'rgba(216,130,96,0.15)' : 'rgba(168,72,44,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.debit} strokeWidth="1.6" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Delete transaction</div>
            <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>
              Permanently delete the transaction from{' '}
              <span style={{ color: theme.text, fontWeight: 500 }}>{merchantName || 'this merchant'}</span>?
              {' '}This cannot be undone.
            </div>
          </div>
        </div>
        {error && <p style={{ fontSize: 12, color: theme.debit, marginBottom: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, height: 42, border: `1px solid ${theme.borderSoft}`, background: 'transparent', borderRadius: 10, fontSize: 13, fontWeight: 500, color: theme.text, cursor: 'pointer', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: 42, border: 0, borderRadius: 10, background: theme.debit, color: '#fff', fontSize: 13, fontWeight: 500, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
