'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getAllCategories, persistCustomCategory, getCatEmoji } from '@/lib/categories';
import { useTheme } from '@/lib/theme';
import type { Transaction, TransactionType, TransactionStatus } from '@/types/transaction';

interface TransactionModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

const METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Cash', 'NEFT', 'Net Banking'];
const BANKS   = ['HDFC', 'ICICI', 'Axis', 'SBI', 'Kotak', 'IDFC'];

export default function TransactionModal({ transaction, onClose, onSave, onDelete }: TransactionModalProps) {
  const theme = useTheme();
  const isEdit = !!transaction;

  const [type,      setType]      = useState<TransactionType>(transaction?.type ?? 'debit');
  const [amount,    setAmount]    = useState(transaction ? String(transaction.amount) : '');
  const [merchant,  setMerchant]  = useState(transaction?.merchant ?? '');
  const [category,  setCategory]  = useState(transaction?.category ?? '');
  const [method,    setMethod]    = useState(transaction?.payment_method ?? 'UPI');
  const [bank,      setBank]      = useState(transaction?.bank_name ?? 'HDFC');
  const [recurring, setRecurring] = useState(transaction?.is_recurring ?? false);
  const [status,    setStatus]    = useState<TransactionStatus>(transaction?.status ?? 'cleared');
  const [date,      setDate]      = useState(transaction ? transaction.transaction_date.slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [categories, setCategories] = useState<string[]>(() => getAllCategories());

  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [showDelConfirm,  setShowDelConfirm]  = useState(false);
  const [deleting,        setDeleting]        = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canSave = amount.trim() !== '' && !isNaN(Number(amount)) && Number(amount) > 0 && merchant.trim() !== '';

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const payload = {
      transaction_date: new Date(date).toISOString(),
      type, amount: parseFloat(amount), currency: 'INR',
      merchant: merchant.trim(), bank_name: bank.trim(),
      payment_method: method.trim(), category: category.trim(),
      tags: [] as string[], is_recurring: recurring, status,
    };
    if (isEdit && transaction) {
      const { data, error: err } = await supabase.from('transactions').update(payload).eq('id', transaction.id).select().single();
      setSaving(false);
      if (err) { setError(err.message); return; }
      onSave(data as Transaction);
    } else {
      const { data, error: err } = await supabase.from('transactions').insert(payload).select().single();
      setSaving(false);
      if (err) { setError(err.message); return; }
      onSave(data as Transaction);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    setDeleting(true);
    await supabase.from('transactions').delete().eq('id', transaction.id);
    setDeleting(false);
    onDelete?.(transaction.id);
    onClose();
  }

  const typeColor = type === 'debit' ? theme.debit : type === 'credit' ? theme.credit : theme.muted;
  const fieldLabel = { fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.10em', fontWeight: 500, color: theme.muted };
  const chipBtn = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 5,
    border: `1px solid ${active ? theme.text : theme.borderSoft}`,
    borderRadius: 99, padding: '6px 11px',
    background: active ? theme.text : theme.surfaceAlt,
    color: active ? theme.bg : theme.text,
    fontSize: 12, fontWeight: 500, letterSpacing: '-0.005em',
    cursor: 'pointer', transition: 'all 0.18s',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }} />

      <div
        style={{ position: 'relative', background: theme.surface, borderRadius: '24px 24px 0 0', maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.32s cubic-bezier(0.2,0.85,0.2,1)', paddingBottom: 40 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: theme.borderSoft, margin: '8px auto 4px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 6px' }}>
          <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em', color: theme.text }}>
            {isEdit ? 'Edit transaction' : 'New transaction'}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 0, borderRadius: 99, background: theme.surfaceAlt, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        {/* Form */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Recorded date strip (edit mode) */}
          {isEdit && transaction && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 500, letterSpacing: '0.005em', padding: '8px 12px', border: `1px solid ${theme.borderSoft}`, borderRadius: 10, color: theme.muted, background: theme.surfaceAlt }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.10em', fontSize: 10, opacity: 0.85 }}>Recorded</span>
              <span>{new Date(transaction.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {new Date(transaction.transaction_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {/* Type: Spent / Received / Transfer */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 4, border: `1px solid ${theme.borderSoft}`, borderRadius: 11, background: theme.surfaceAlt }}>
            {([['debit','Spent'],['credit','Received'],['transfer','Transfer']] as [TransactionType, string][]).map(([tp, label]) => (
              <button key={tp} onClick={() => setType(tp)} style={{ height: 32, border: 0, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: type === tp ? 600 : 500, letterSpacing: '-0.005em', transition: 'all 0.18s', background: type === tp ? theme.surface : 'transparent', color: type === tp ? theme.text : theme.muted, boxShadow: type === tp ? `0 1px 2px ${theme.shadowSoft}` : 'none', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Amount — big serif */}
          <div style={{ borderBottom: `1px solid ${theme.borderSoft}`, display: 'flex', alignItems: 'baseline', gap: 6, paddingBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 42, color: theme.muted }}>₹</span>
            <input
              type="number" inputMode="decimal" placeholder="0"
              value={amount} onChange={e => setAmount(e.target.value)}
              autoFocus={!isEdit}
              style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 42, letterSpacing: '-0.02em', color: typeColor, minWidth: 0 }}
            />
          </div>

          {/* Merchant */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={fieldLabel}>Merchant</div>
            <input
              value={merchant} onChange={e => setMerchant(e.target.value)}
              placeholder="e.g. Blue Tokai, Amazon"
              style={{ border: 0, outline: 0, borderBottom: `1px solid ${theme.borderSoft}`, background: 'transparent', fontFamily: 'var(--font-inter), system-ui, sans-serif', fontSize: 16, letterSpacing: '-0.005em', padding: '4px 0 8px', color: theme.text }}
            />
          </div>

          {/* Date (shown always so user can back-date) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={fieldLabel}>Date &amp; Time</div>
            <input
              type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
              style={{ border: 0, outline: 0, borderBottom: `1px solid ${theme.borderSoft}`, background: 'transparent', fontFamily: 'var(--font-inter), system-ui, sans-serif', fontSize: 15, padding: '4px 0 8px', color: theme.text }}
            />
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={fieldLabel}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={chipBtn(category === cat)}>
                  <span>{getCatEmoji(cat)}</span> {cat}
                </button>
              ))}
              {/* Quick add inline */}
              <button
                onClick={() => {
                  const name = prompt('New category name:');
                  if (name?.trim()) {
                    persistCustomCategory(name.trim());
                    setCategories(getAllCategories());
                    setCategory(name.trim());
                  }
                }}
                style={{ ...chipBtn(false), borderStyle: 'dashed' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                New
              </button>
            </div>
          </div>

          {/* Payment method chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={fieldLabel}>Payment method</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)} style={chipBtn(method === m)}>{m}</button>
              ))}
            </div>
          </div>

          {/* Bank chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={fieldLabel}>Bank</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BANKS.map(b => (
                <button key={b} onClick={() => setBank(b)} style={chipBtn(bank === b)}>{b}</button>
              ))}
              {bank && !BANKS.includes(bank) && (
                <button style={chipBtn(true)}>{bank}</button>
              )}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={fieldLabel}>Status</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['cleared','pending','failed'] as TransactionStatus[]).map(s => (
                <button key={s} onClick={() => setStatus(s)} style={{ ...chipBtn(status === s), textTransform: 'capitalize' }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Recurring toggle */}
          <button
            onClick={() => setRecurring(r => !r)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: `1px solid ${theme.borderSoft}`, borderRadius: 12, padding: '12px 14px', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13.5, fontWeight: 500, color: theme.text }}>Recurring</span>
              <span style={{ fontSize: 11.5, color: theme.muted }}>Mark as a subscription or repeat charge</span>
            </div>
            <div style={{ width: 38, height: 22, borderRadius: 99, padding: 2, background: recurring ? theme.text : theme.borderSoft, display: 'flex', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 99, background: recurring ? theme.bg : theme.surface, boxShadow: '0 1px 2px rgba(0,0,0,0.18)', transform: recurring ? 'translateX(16px)' : 'translateX(0)', transition: 'transform 0.2s cubic-bezier(0.2,0.85,0.2,1)' }} />
            </div>
          </button>

          {error && <p style={{ fontSize: 12, color: theme.debit, margin: 0 }}>{error}</p>}

          {/* Save / Delete */}
          {!showDelConfirm ? (
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              {isEdit && (
                <button
                  onClick={() => setShowDelConfirm(true)}
                  style={{ width: 50, height: 50, border: `1px solid ${theme.borderSoft}`, borderRadius: 14, background: 'transparent', color: theme.debit, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  aria-label="Delete"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                style={{ flex: 1, height: 50, border: 0, borderRadius: 14, cursor: canSave && !saving ? 'pointer' : 'default', fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em', transition: 'all 0.18s', background: canSave ? theme.text : theme.borderSoft, color: canSave ? theme.bg : theme.muted, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
              >
                {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save transaction'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, border: `1px solid ${theme.borderSoft}`, borderRadius: 14, padding: 14, marginTop: 4, background: theme.surfaceAlt, animation: 'dashIn 0.22s cubic-bezier(0.2,0.85,0.2,1)' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13.5, color: theme.text }}>Delete this transaction?</div>
                <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 2 }}>
                  <em style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 13 }}>This can&apos;t be undone.</em>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowDelConfirm(false)} style={{ flex: 1, height: 42, border: `1px solid ${theme.borderSoft}`, background: 'transparent', borderRadius: 10, fontSize: 13, fontWeight: 500, color: theme.muted, cursor: 'pointer', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: 42, border: 0, borderRadius: 10, background: theme.debit, color: '#fff', fontSize: 13, fontWeight: 500, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes dashIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
