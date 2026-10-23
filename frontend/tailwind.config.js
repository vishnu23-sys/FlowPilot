const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

const CATEGORY_TOKENS = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'health', 'education', 'travel', 'investments', 'others']

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        panel: token('panel'),
        raised: token('raised'),
        line: token('line'),
        'line-strong': token('line-strong'),
        fg: token('fg'),
        muted: token('muted'),
        faint: token('faint'),
        accent: token('accent'),
        'on-accent': token('on-accent'),
        danger: token('danger'),
        warning: token('warning'),
        success: token('success'),
        ...Object.fromEntries(CATEGORY_TOKENS.map((c) => [`cat-${c}`, token(`cat-${c}`)])),
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
      },
      borderRadius: {
        control: '7px',
        panel: '12px',
      },
      boxShadow: {
        pop: '0 12px 32px -8px rgb(0 0 0 / var(--shadow-strength)), 0 2px 6px rgb(0 0 0 / calc(var(--shadow-strength) / 2))',
        sheet: '-24px 0 48px -12px rgb(0 0 0 / var(--shadow-strength))',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(.2,.9,.3,1)',
      },
      keyframes: {
        shimmer: { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}
