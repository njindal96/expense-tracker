'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Plus, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAllCategories, persistCustomCategory } from '@/lib/categories';
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
  const isEdit = !!transaction;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Category combobox state
  const [categories, setCategories] = useState<string[]>(() => getAllCategories());
  const [catQuery, setCatQuery] = useState('');
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const catInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    if (catOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [catOpen]);

  const filteredCats = catQuery.trim()
    ? categories.filter((c) => c.toLowerCase().includes(catQuery.toLowerCase()))
    : categories;
  const catExactMatch = categories.some((c) => c.toLowerCase() === catQuery.trim().toLowerCase());
  const canCreateCat = catQuery.trim().length > 0 && !catExactMatch;

  function selectCategory(name: string) {
    set('category', name);
    setCatOpen(false);
    setCatQuery('');
  }

  function createCategory() {
    const name = catQuery.trim();
    if (!name) return;
    persistCustomCategory(name);
    setCategories(getAllCategories());
    selectCategory(name);
  }

  function catKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCats.length === 1) selectCategory(filteredCats[0]);
      else if (canCreateCat) createCategory();
    }
    if (e.key === 'Escape') setCatOpen(false);
  }

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

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.merchant.trim()) { setError('Merchant is required.'); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError('Enter a valid amount.'); return;
    }

    setSaving(true);
    const payload = {
      transaction_date: new Date(form.transaction_date).toISOString(),
      type: form.type,
      amount: parseFloat(form.amount),
      currency: form.currency || 'INR',
      merchant: form.merchant.trim(),
      bank_name: form.bank_name.trim(),
      payment_method: form.payment_method.trim(),
      category: form.category.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      is_recurring: form.is_recurring,
      status: form.status,
    };

    if (isEdit && transaction) {
      const { data, error: err } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', transaction.id)
        .select()
        .single();
      setSaving(false);
      if (err) { setError(err.message); return; }
      onSave(data as Transaction);
    } else {
      const { data, error: err } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();
      setSaving(false);
      if (err) { setError(err.message); return; }
      onSave(data as Transaction);
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 outline-none focus:border-slate-400 transition-colors placeholder-slate-400';
  const labelCls = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date & Time</label>
              <input
                type="datetime-local"
                value={form.transaction_date}
                onChange={(e) => set('transaction_date', e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as TransactionType)}
                className={inputCls + ' cursor-pointer'}
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <input
                type="text"
                maxLength={3}
                value={form.currency}
                onChange={(e) => set('currency', e.target.value.toUpperCase())}
                placeholder="INR"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Merchant</label>
            <input
              type="text"
              value={form.merchant}
              onChange={(e) => set('merchant', e.target.value)}
              placeholder="e.g. Swiggy, Amazon"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Bank Name</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={(e) => set('bank_name', e.target.value)}
                placeholder="e.g. HDFC Bank"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Payment Method</label>
              <input
                type="text"
                value={form.payment_method}
                onChange={(e) => set('payment_method', e.target.value)}
                placeholder="e.g. UPI, Card"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div ref={catRef} className="relative">
              <label className={labelCls}>Category</label>
              <button
                type="button"
                onClick={() => { setCatOpen((v) => !v); setTimeout(() => catInputRef.current?.focus(), 50); }}
                className={inputCls + ' text-left flex items-center justify-between cursor-pointer'}
              >
                <span className={form.category ? 'text-slate-900' : 'text-slate-400'}>
                  {form.category || 'Select or create…'}
                </span>
                <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>
              {catOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  <div className="px-2.5 pt-2.5 pb-2">
                    <input
                      ref={catInputRef}
                      type="text"
                      value={catQuery}
                      onChange={(e) => setCatQuery(e.target.value)}
                      onKeyDown={catKeyDown}
                      placeholder="Search or create…"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400"
                    />
                  </div>
                  <ul className="max-h-44 overflow-y-auto py-1">
                    {filteredCats.map((c) => (
                      <li key={c}>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectCategory(c); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${c === form.category ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                        >
                          <span className="flex-1 truncate">{c}</span>
                          {c === form.category && <Check className="w-3 h-3 shrink-0 text-slate-500" />}
                        </button>
                      </li>
                    ))}
                    {filteredCats.length === 0 && !canCreateCat && (
                      <li className="px-3 py-3 text-xs text-slate-400 text-center">No categories found</li>
                    )}
                  </ul>
                  {canCreateCat && (
                    <div className="border-t border-slate-100 px-2 py-2">
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); createCategory(); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Create <span className="font-semibold text-slate-900">&quot;{catQuery.trim()}&quot;</span></span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as TransactionStatus)}
                className={inputCls + ' cursor-pointer'}
              >
                <option value="cleared">Cleared</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="e.g. food, weekend, work"
              className={inputCls}
            />
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="is_recurring"
              checked={form.is_recurring}
              onChange={(e) => set('is_recurring', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 accent-slate-900 cursor-pointer"
            />
            <label htmlFor="is_recurring" className="text-sm text-slate-700 cursor-pointer">
              Recurring transaction
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
