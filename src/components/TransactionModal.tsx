'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getAllCategories, persistCustomCategory } from '@/lib/categories';
import { getCatEmoji } from '@/lib/categories';
import { useTheme } from '@/lib/theme';
import type { Transaction, TransactionType, TransactionStatus } from '@/types/transaction';

interface TransactionModalProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

const EMPTY_FORM = {
  transaction_date: new Date().toISOString().slice(0, 16),
  type: 'debit' as TransactionType,
  amount: '',
  currency: 'INR',
  merchant: '',
  bank_name: '',
  payment_method: '',
  category: '',
  tags: '',
  is_recurring: false,
  status: 'cleared' as TransactionStatus,
};

export default function TransactionModal({ transaction, onClose, onSave }: TransactionModalProps) {
  const theme = useTheme();
  const isEdit = !!transaction;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Category combobox
  const [categories, setCategories] = useState<string[]>(() => getAllCategories());
  const [catQuery, setCatQuery] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const catInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (transaction) {
      setForm({
        transaction_date: transaction.transaction_date.slice(0, 16),
        type: transaction.type,
        amount: String(transaction.amount),
        currency: transaction.currency,
        merchant: transaction.merchant,
        bank_name: transaction.bank_name,
        payment_method: transaction.payment_method,
        category: transaction.category,
        tags: (transaction.tags ?? []).join(', '),
        is_recurring: transaction.is_recurring,
        status: transaction.status,
      });
    }
  }, [transaction]);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    if (catOpen) document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [catOpen]);

  const filteredCats = catQuery.trim()
    ? categories.filter(c => c.toLowerCase().includes(catQuery.toLowerCase()))
    : categories;
  const catExact = categories.some(c => c.toLowerCase() === catQuery.trim().toLowerCase());
  const canCreate = catQuery.trim().length > 0 && !catExact;

  function selectCat(name: string) {
    setForm(f => ({ ...f, category: name }));
    setCatOpen(false); setCatQuery('');
  }

  function createCat() {
    const name = catQuery.trim();
    if (!name) return;
    persistCustomCategory(name);
    setCategories(getAllCategories());
    selectCat(name);
  }

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.merchant.trim()) { setError('Merchant is required.'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) { setError('Enter a valid amount.'); return; }
    setSaving(true);
    const payload = {
      transaction_date: new Date(form.transaction_date).toISOString(),
      type: form.type, amount: parseFloat(form.amount), currency: form.currency || 'INR',
      merchant: form.merchant.trim(), bank_name: form.bank_name.trim(),
      payment_method: form.payment_method.trim(), category: form.category.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      is_recurring: form.is_recurring, status: form.status,
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

  const inputStyle = { width: '100%', padding: '9px 12px', fontSize: 14, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, background: theme.surfaceAlt, color: theme.text, outline: 'none', fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.005em' };
  const labelStyle = { display: 'block', fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: '0.10em', fontWeight: 500, color: theme.muted, marginBottom: 6 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: theme.surface, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.32s cubic-bezier(0.2,0.85,0.2,1)', paddingBottom: 40 }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: theme.borderSoft, margin: '10px auto 4px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px 8px' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em', color: theme.text }}>
            {isEdit ? 'Edit transaction' : 'New transaction'}
          </h2>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 0, borderRadius: 99, background: theme.surfaceAlt, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '8px 24px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type selector */}
          <div style={{ display: 'grid', gap: 4, padding: 4, border: `1px solid ${theme.borderSoft}`, borderRadius: 11, background: theme.surfaceAlt, gridTemplateColumns: '1fr 1fr 1fr' }}>
            {(['debit', 'credit', 'transfer'] as TransactionType[]).map(t => (
              <button key={t} type="button" onClick={() => set('type', t)} style={{ height: 32, border: 0, borderRadius: 8, background: form.type === t ? theme.surface : 'transparent', color: form.type === t ? theme.text : theme.muted, fontSize: 13, fontWeight: form.type === t ? 600 : 500, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.18s', fontFamily: 'var(--font-inter), system-ui, sans-serif', letterSpacing: '-0.005em' }}>
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div style={{ borderBottom: `1px solid ${theme.borderSoft}`, paddingBottom: 16 }}>
            <label style={labelStyle}>Amount (₹)</label>
            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 36, letterSpacing: '-0.02em', background: 'transparent', border: 0, padding: '4px 0', outline: 'none', color: form.type === 'debit' ? theme.debit : theme.credit }} />
          </div>

          {/* Merchant */}
          <div>
            <label style={labelStyle}>Merchant</label>
            <input type="text" value={form.merchant} onChange={e => set('merchant', e.target.value)} placeholder="e.g. Swiggy, Amazon" style={inputStyle} />
          </div>

          {/* Bank + Method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Bank</label>
              <input type="text" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. HDFC Bank" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Method</label>
              <input type="text" value={form.payment_method} onChange={e => set('payment_method', e.target.value)} placeholder="e.g. UPI, Card" style={inputStyle} />
            </div>
          </div>

          {/* Category combobox */}
          <div ref={catRef} style={{ position: 'relative' }}>
            <label style={labelStyle}>Category</label>
            <button type="button" onClick={() => { setCatOpen(v => !v); setTimeout(() => catInputRef.current?.focus(), 50); }} style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: form.category ? theme.text : theme.muted }}>
                {form.category && <span>{getCatEmoji(form.category)}</span>}
                <span style={{ fontSize: 14 }}>{form.category || 'Select or create a category…'}</span>
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth="1.8" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {catOpen && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4, zIndex: 70, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, boxShadow: `0 8px 24px ${theme.shadow}`, overflow: 'hidden' }}>
                <div style={{ padding: '10px 10px 8px' }}>
                  <input ref={catInputRef} type="text" value={catQuery} onChange={e => setCatQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (filteredCats.length === 1) selectCat(filteredCats[0]); else if (canCreate) createCat(); } if (e.key === 'Escape') setCatOpen(false); }}
                    placeholder="Search or create…"
                    style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: `1px solid ${theme.borderSoft}`, borderRadius: 8, background: theme.surfaceAlt, color: theme.text, outline: 'none', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                  />
                </div>
                <ul style={{ maxHeight: 180, overflowY: 'auto', padding: '4px 0', listStyle: 'none', margin: 0 }}>
                  {filteredCats.map(c => (
                    <li key={c}>
                      <button type="button" onMouseDown={e => { e.preventDefault(); selectCat(c); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', border: 0, background: c === form.category ? theme.surfaceAlt : 'transparent', color: theme.text, fontSize: 13, fontWeight: c === form.category ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                        <span style={{ fontSize: 16 }}>{getCatEmoji(c)}</span>
                        <span style={{ flex: 1 }}>{c}</span>
                        {c === form.category && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.credit} strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5 9-10"/></svg>}
                      </button>
                    </li>
                  ))}
                  {filteredCats.length === 0 && !canCreate && <li style={{ padding: '12px 14px', fontSize: 13, color: theme.muted, fontStyle: 'italic' }}>No categories found</li>}
                </ul>
                {canCreate && (
                  <div style={{ borderTop: `1px solid ${theme.borderSoft}`, padding: '8px' }}>
                    <button type="button" onMouseDown={e => { e.preventDefault(); createCat(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: 0, background: 'transparent', color: theme.text, fontSize: 13, cursor: 'pointer', borderRadius: 8, fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      Create <strong style={{ marginLeft: 3 }}>&ldquo;{catQuery.trim()}&rdquo;</strong>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as TransactionStatus)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date & Time</label>
              <input type="datetime-local" value={form.transaction_date} onChange={e => set('transaction_date', e.target.value)} style={inputStyle} required />
            </div>
          </div>

          {/* Tags + Recurring */}
          <div>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. food, weekend, work" style={inputStyle} />
          </div>

          <button type="button" onClick={() => set('is_recurring', !form.is_recurring)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: `1px solid ${theme.borderSoft}`, borderRadius: 12, padding: '12px 14px', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: theme.text, letterSpacing: '-0.005em' }}>Recurring transaction</div>
              <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 2 }}>Appears with a repeat icon in the ledger</div>
            </div>
            <div style={{ width: 38, height: 22, borderRadius: 99, padding: 2, background: form.is_recurring ? theme.text : theme.borderSoft, display: 'flex', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 18, height: 18, borderRadius: 99, background: theme.surface, boxShadow: '0 1px 2px rgba(0,0,0,0.18)', transform: form.is_recurring ? 'translateX(16px)' : 'translateX(0)', transition: 'transform 0.2s cubic-bezier(0.2,0.85,0.2,1)' }} />
            </div>
          </button>

          {error && <p style={{ fontSize: 12, color: theme.debit, margin: 0 }}>{error}</p>}
        </form>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 24px 0', marginTop: 4 }}>
          <button type="button" onClick={onClose} style={{ flex: '0 0 auto', height: 46, padding: '0 18px', border: `1px solid ${theme.borderSoft}`, borderRadius: 12, background: 'transparent', color: theme.text, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', letterSpacing: '-0.005em', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, height: 46, border: 0, borderRadius: 12, background: theme.text, color: theme.bg, fontSize: 14, fontWeight: 500, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, letterSpacing: '-0.005em', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
