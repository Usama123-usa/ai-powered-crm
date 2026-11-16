/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        serif: ['"Cinzel"', 'serif'],
        mono:  ['"Space Grotesk"', 'monospace'],
        // legacy aliases kept for existing pages
        display:  ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        editorial: ['"Cinzel"', 'serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
          300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6',
          600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A',
        },
        brand: {
          50:  '#FBF9F5', 100: '#F5F0E6', 200: '#EADFC9',
          300: '#DAC6A0', 400: '#C7A870', 500: '#B89350',
          600: '#9C7838', 700: '#7B5D27', 800: '#5C441E', 900: '#3D2D14',
        },
        gold: { DEFAULT: '#B89350', light: '#C7A870', dark: '#9C7838', muted: 'rgba(184,147,80,0.12)' },
        surface: {
          card:   '#FFFFFF',
          subtle: '#FAFBFD',
          border: '#E8ECF2',
          hover:  '#F1F5F9',
        },
        midnight: { 950: '#0B111D', 900: '#0F172A', 800: '#1E293B', 700: '#334155' },
        // Keep legacy names so existing pages don't break
        sidebar: { DEFAULT: '#0B1530', secondary: '#14213D', hover: '#1a2a4a' },
        deep:    '#17264A',
        app:     '#F8FAFC',
        success: '#16A34A',
        warning: '#D97706',
        danger:  '#DC2626',
        border:       '#E8ECF2',
        'text-primary':   '#0F172A',
        'text-secondary': '#64748B',
        'text-muted':     '#94A3B8',
      },
      boxShadow: {
        'card':        '0 1px 2px 0 rgba(15,23,42,0.04), 0 8px 24px -4px rgba(15,23,42,0.06)',
        'card-hover':  '0 12px 32px -4px rgba(15,23,42,0.09), 0 2px 6px -1px rgba(15,23,42,0.03)',
        'card-lifted': '0 20px 48px -8px rgba(15,23,42,0.12)',
        'modal':       '0 24px 64px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)',
        'dropdown':    '0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        'gold':        '0 4px 14px -2px rgba(184,147,80,0.35)',
        'primary':     '0 4px 16px rgba(37,99,235,0.25)',
      },
      borderRadius: {
        sm: '6px', DEFAULT: '8px', md: '10px',
        lg: '12px', xl: '14px', '2xl': '18px', '3xl': '24px',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        'slide-in':  'slideIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':  'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      backgroundImage: {
        'gold-gradient':    'linear-gradient(135deg, #C7A870 0%, #B89350 50%, #9C7838 100%)',
        'primary-gradient': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFD 100%)',
      },
    },
  },
  plugins: [],
}
