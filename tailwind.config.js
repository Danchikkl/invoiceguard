/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0D0D0D',
        paper: '#FAFAF8',
        mist: '#F0EFE9',
        slate: '#6B7280',
        lead: '#374151',
        accent: '#1A56DB',
        'accent-light': '#EEF2FF',
        success: '#059669',
        'success-light': '#ECFDF5',
        warning: '#D97706',
        'warning-light': '#FFFBEB',
        danger: '#DC2626',
        'danger-light': '#FEF2F2',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
