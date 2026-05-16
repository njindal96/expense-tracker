'use client';

import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 1024): boolean {
  // Start false to avoid SSR/hydration mismatch; effect sets correct value on mount
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}
