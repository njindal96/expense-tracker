'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme, catBg, catFg } from '@/lib/theme';
import { getAllCategories, persistCustomCategory, getCatEmoji } from '@/lib/categories';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/types/transaction';

const EMOJI_PICKER = ['🍜','🛒','🚕','🛍️','🎬','💡','🩺','🏠','💼','📈','✈️','🎁','🐶','📚','⚽','🎵','🌿','🔧','✂️','☕','💸','🎓','👶','·'];

interface CategorySheetProps {
  txn: Transaction;
  onClose: () => void;
  onPick: (category: string) => void;
}

function MerchantGlyph({ name, size = 44, theme }: { name: string; size?: number; theme: ReturnType<typeof useTheme> }) {
  const initials = name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '·';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  const hue = (h % 60) + 20;
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, flexShrink: 0,
      background: theme.dark ? `oklch(0.22 0.025 ${hue})` : `oklch(0.94 0.03 ${hue})`,
      color: theme.dark ? `oklch(0.78 0.06 ${hue})` : `oklch(0.36 0.08 ${hue})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 600, letterSpacing: '-0.01em',
    }}>{initials}</div>
  );
}

export default function CategorySheet({ txn, onClose, onPick }: CategorySheetProps) {
  const theme = useTheme();
  const [categories, setCategories] = useState<string[]>(() => getAllCategories());
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('·');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 60);
  }, [adding]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function saveNew() {
    const trimmed = label.trim();
    if (!trimmed) return;
    persistCustomCategory(trimmed);
    setCategories(getAllCategories());
    setAdding(false);
    setLabel('');
    setEmoji('·');
    onPick(trimmed);
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }} />

      {/* Sheet */}
      <div
        style={{ position: 'relative', background: theme.surface, borderRadius: '24px 24px 0 0', maxHeight: '86%', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.32s cubic-bezier(0.2,0.85,0.2,1)', paddingBottom: 40 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: theme.borderSoft, margin: '8px auto 4px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 6px' }}>
          <div style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: 24, fontWeight: 400, letterSpacing: '-0.01em', color: theme.text }}>
            {adding ? 'New category' : 'Recategorize'}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 0, borderRadius: 99, background: theme.surfaceAlt, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Merchant info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MerchantGlyph name={txn.merchant} size={44} theme={theme} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: theme.text, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}>{txn.merchant}</span>
              <span style={{ color: theme.muted, fontSize: 12 }}>
                {formatCurrency(txn.amount)} · {new Date(txn.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {!adding ? (
            <>
              {/* Category grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {categories.map(cat => {
                  const isActive = cat === txn.category;
                  return (
                    <button
                      key={cat}
                      onClick={() => onPick(cat)}
                      style={{
                        position: 'relative', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 4,
                        padding: '12px 8px', minHeight: 78,
                        border: `1px solid ${isActive ? theme.text : theme.borderSoft}`,
                        borderRadius: 12, cursor: 'pointer', transition: 'all 0.12s',
                        background: isActive ? theme.text : theme.surfaceAlt,
                        color: isActive ? theme.bg : theme.text,
                        fontFamily: 'var(--font-inter), system-ui, sans-serif',
                      }}
                    >
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{getCatEmoji(cat)}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: '-0.005em', lineHeight: 1.15, textAlign: 'center' }}>{cat}</span>
                      {isActive && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ position: 'absolute', top: 8, right: 8 }}><path d="M5 12l5 5 9-10"/></svg>
                      )}
                    </button>
                  );
                })}
                {/* Add new tile */}
                <button
                  onClick={() => setAdding(true)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px 8px', minHeight: 78,
                    border: `1px dashed ${theme.borderSoft}`, borderRadius: 12,
                    background: 'transparent', color: theme.muted, cursor: 'pointer',
                    fontFamily: 'var(--font-inter), system-ui, sans-serif', transition: 'opacity 0.15s',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                  <span style={{ fontSize: 11.5, fontWeight: 500 }}>Add new</span>
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: 11.5, fontStyle: 'italic', fontFamily: 'var(--font-serif), Georgia, serif', color: theme.muted, padding: '4px 0 8px' }}>
                We&apos;ll remember this for similar merchants.
              </div>
            </>
          ) : (
            /* Add new category form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: `1px solid ${theme.borderSoft}`, borderRadius: 14, background: theme.surfaceAlt }}>
                <span style={{ fontSize: 28, lineHeight: 1, width: 32, textAlign: 'center' }}>{emoji}</span>
                <input
                  ref={inputRef}
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveNew(); }}
                  placeholder="Category name (e.g. Travel, Pets, Gifts…)"
                  maxLength={24}
                  style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--font-inter), system-ui, sans-serif', fontSize: 16, fontWeight: 500, letterSpacing: '-0.005em', color: theme.text }}
                />
              </div>

              <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 500, color: theme.muted }}>Pick a glyph</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                {EMOJI_PICKER.map(e => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    style={{
                      aspectRatio: '1', border: `1px solid ${emoji === e ? theme.text : theme.borderSoft}`,
                      borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, lineHeight: 1, cursor: 'pointer', transition: 'all 0.12s',
                      background: emoji === e ? theme.text : 'transparent',
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => { setAdding(false); setLabel(''); setEmoji('·'); }}
                  style={{ flexShrink: 0, height: 46, padding: '0 18px', border: `1px solid ${theme.borderSoft}`, borderRadius: 12, background: 'transparent', color: theme.muted, fontSize: 13.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
                >
                  Back
                </button>
                <button
                  onClick={saveNew}
                  disabled={!label.trim()}
                  style={{ flex: 1, height: 46, border: 0, borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: label.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-inter), system-ui, sans-serif', background: label.trim() ? theme.text : theme.borderSoft, color: label.trim() ? theme.bg : theme.muted, transition: 'all 0.18s' }}
                >
                  Add &amp; apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
