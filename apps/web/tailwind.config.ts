import type { Config } from 'tailwindcss';
import sharedConfig from '@unkora/tailwind-config';

const config: Config = {
  ...sharedConfig,
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    ...sharedConfig.theme,
    extend: {
      ...sharedConfig.theme?.extend,
      colors: {
        ...(sharedConfig.theme?.extend?.colors as Record<string, unknown> | undefined),
        // UNKORA design system colors
        primary: {
          DEFAULT: '#047857',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f59e0b',
          foreground: '#1a1a1a',
        },
        accent: {
          DEFAULT: '#ecfdf5',
          foreground: '#047857',
        },
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#047857',
          700: '#047857',
          900: '#064e3b',
        },
      },
    },
  },
};

export default config;
