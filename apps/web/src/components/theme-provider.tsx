'use client';

import { useEffect } from 'react';
import api from '@/lib/api';

interface ThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  isActive: boolean;
}

export function ThemeProvider() {
  useEffect(() => {
    api
      .get('/design/themes')
      .then(r => {
        const themes: ThemeConfig[] = r.data.data ?? [];
        const active = themes.find(t => t.isActive);
        if (!active) return;

        const root = document.documentElement;

        if (active.primaryColor) {
          root.style.setProperty('--brand-color', active.primaryColor);
          root.style.setProperty('--primary-hex', active.primaryColor);
        }

        if (active.accentColor) {
          root.style.setProperty('--accent-color', active.accentColor);
        }

        if (active.borderRadius) {
          root.style.setProperty('--radius', active.borderRadius);
        }

        if (active.fontFamily) {
          root.style.setProperty('--font-sans', active.fontFamily);
          // Apply font family to body as well
          document.body.style.fontFamily = `${active.fontFamily}, ui-sans-serif, system-ui, sans-serif`;
        }
      })
      .catch(() => {
        // Silently fail — fall back to CSS defaults
      });
  }, []);

  return null;
}
