'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import AuthGate from '@/components/AuthGate';
import Dashboard from '@/components/Dashboard';

export default function Page() {
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return <AuthGate onAuth={() => setAuthed(true)} />;
  }

  return <Dashboard />;
}
