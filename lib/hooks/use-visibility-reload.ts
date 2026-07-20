'use client';

import { useEffect } from 'react';

export function useVisibilityReload() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page regained focus - reload the page
        window.location.reload();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
