import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-blue':   '#00d4ff',
        'neon-red':    '#ff2d55',
        'neon-purple': '#bf5af2',
        'neon-green':  '#30d158',
        'neon-gold':   '#ffd60a',
        'cyber-dark':  '#050810',
        'cyber-darker':'#020408',
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'monospace'],
        inter:    ['var(--font-inter)',    'sans-serif'],
      },
      animation: {
        'glow-blue':  'glowPulseBlue 2.5s ease-in-out infinite',
        'glow-red':   'glowPulseRed  2.5s ease-in-out infinite',
        'float':      'float 6s ease-in-out infinite',
        'fade-up':    'fadeSlideUp 0.5s ease forwards',
        'scale-in':   'scaleIn 0.4s ease forwards',
        'shimmer':    'shimmer 3s linear infinite',
      },
      keyframes: {
        glowPulseBlue: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0,212,255,0.3), 0 0 50px rgba(0,212,255,0.1)' },
          '50%':       { boxShadow: '0 0 35px rgba(0,212,255,0.7), 0 0 90px rgba(0,212,255,0.25)' },
        },
        glowPulseRed: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,45,85,0.3), 0 0 50px rgba(255,45,85,0.1)' },
          '50%':       { boxShadow: '0 0 35px rgba(255,45,85,0.7), 0 0 90px rgba(255,45,85,0.25)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid': `
          linear-gradient(rgba(0,212,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.035) 1px, transparent 1px)
        `,
      },
    },
  },
  plugins: [],
};

export default config;
