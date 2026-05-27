'use client';

import { useCallback } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

declare global {
  interface Window { grecaptcha?: any; }
}

export function useRecaptcha() {
  const execute = useCallback(async (action: string): Promise<string | null> => {
    if (!SITE_KEY) return null;

    // Load script if not present
    if (!window.grecaptcha) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    return new Promise((resolve) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(SITE_KEY, { action }).then(resolve).catch(() => resolve(null));
      });
    });
  }, []);

  return { execute };
}
