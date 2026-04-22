import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Status colors - ensure these classes are always included
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-blue-500',
    'bg-gray-100',
    'bg-gray-200',
    'bg-gray-500',
    'text-green-600',
    'text-yellow-600',
    'text-red-600',
    'text-blue-600',
    'text-gray-600',
    'text-gray-800',
    // Button variants
    'bg-blue-600',
    'bg-gray-400',
    'hover:bg-blue-700',
    'hover:bg-gray-500',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
      },
    },
  },
  plugins: [],
} satisfies Config;