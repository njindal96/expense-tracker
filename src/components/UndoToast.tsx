'use client';

import { useTheme } from '@/lib/theme';
import { getCatEmoji } from '@/lib/categories';

export interface ToastData {
  txnId: string;
  merchant: string;
  oldCategory: string;
  newCategory: string;
}

interface UndoToastProps {
  toast: ToastData;
  onUndo: () => void;
}

export default function UndoToast({ toast, onUndo }: UndoToastProps) {
  const theme = useTheme();
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 80,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 14,
      background: theme.text, color: theme.bg,
      boxShadow: `0 8px 28px ${theme.shadow}`,
      maxWidth: 400,
      animation: 'toastIn 0.32s cubic-bezier(0.2,0.85,0.2,1)',
      fontFamily: 'var(--font-inter), system-ui, sans-serif',
    }}>
      <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 15 }}>{toast.merchant}</span>
        {' · '}{getCatEmoji(toast.oldCategory)}→{getCatEmoji(toast.newCategory)} {toast.newCategory}
      </span>
      <button
        onClick={onUndo}
        style={{ border: 0, background: 'transparent', color: theme.bg, fontWeight: 600, fontSize: 11.5, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, textDecoration: 'underline', textUnderlineOffset: 3, flexShrink: 0 }}
      >
        Undo
      </button>
      <style>{`
        @keyframes toastIn {
          from { transform: translateY(120%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
