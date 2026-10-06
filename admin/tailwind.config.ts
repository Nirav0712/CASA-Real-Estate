import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        casa: {
          canvas: 'var(--casa-bg-canvas)',
          surface: 'var(--casa-bg-surface)',
          subtle: 'var(--casa-bg-subtle)',
          muted: 'var(--casa-bg-muted)',
          overlay: 'var(--casa-bg-overlay)',
          border: 'var(--casa-border-light)',
          'border-medium': 'var(--casa-border-medium)',
          'border-focus': 'var(--casa-border-focus)',
          brand: {
            DEFAULT: 'var(--casa-brand)',
            hover: 'var(--casa-brand-hover)',
            subtle: 'var(--casa-brand-subtle)',
            accent: 'var(--casa-brand-accent)',
            'accent-subtle': 'var(--casa-brand-accent-subtle)',
          },
          text: {
            primary: 'var(--casa-text-primary)',
            secondary: 'var(--casa-text-secondary)',
            muted: 'var(--casa-text-muted)',
            inverted: 'var(--casa-text-inverted)',
          },
          status: {
            success: 'var(--casa-status-success)',
            'success-bg': 'var(--casa-status-success-bg)',
            warning: 'var(--casa-status-warning)',
            'warning-bg': 'var(--casa-status-warning-bg)',
            danger: 'var(--casa-status-danger)',
            'danger-bg': 'var(--casa-status-danger-bg)',
            info: 'var(--casa-status-info)',
            'info-bg': 'var(--casa-status-info-bg)',
          },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        subtle: 'var(--casa-shadow-subtle)',
        medium: 'var(--casa-shadow-medium)',
        elevated: 'var(--casa-shadow-elevated)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        urdu: ['var(--font-urdu)', 'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
