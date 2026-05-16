'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface AuthGateProps {
  onAuth: () => void;
}

export default function AuthGate({ onAuth }: AuthGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('ledger_authed') === 'true') {
        onAuth();
      }
      setChecked(true);
    }
  }, [onAuth]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_MASTER_PASSWORD) {
      localStorage.setItem('ledger_authed', 'true');
      onAuth();
    } else {
      setError(true);
      setPassword('');
    }
  }

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Personal Expense Tracker</h1>
            <p className="text-sm text-slate-500 mt-1">Enter your master password to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="Master password"
                autoFocus
                className={`w-full px-4 py-3 pr-10 border rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white outline-none transition-colors ${
                  error
                    ? 'border-red-300 focus:border-red-400'
                    : 'border-slate-200 focus:border-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-500">Incorrect password. Please try again.</p>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
