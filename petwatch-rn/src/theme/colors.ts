// theme/colors.ts
// Tokens derived from the Vetintel mark: teal heartbeat → blue → violet.
// `primary` is preserved so existing screens that already reference
// colors.primary keep working unchanged.

export const colors = {
  // Brand gradient (logo-accurate)
  teal: '#2DD4BF', // heartbeat line
  blue: '#3B82F6', // dog / hand
  violet: '#8B5CF6', // cat / wordmark
  deepSpace: '#0B1221', // logo backdrop / splash background

  // Primary stays blue — the dominant brand color used for buttons,
  // links, and active states throughout the rest of the app.
  primary: '#3B82F6',

  // Neutrals
  ink: '#1E293B',
  slate: '#475569',
  slateLight: '#64748B',
  mist: '#94A3B8',
  fog: '#E2E8F0',
  cloud: '#F1F5F9',
  paper: '#F8FAFC',
  white: '#FFFFFF',

  // Semantic
  success: '#16A34A',
  successBg: '#F0FDF4',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  secondary: '#8B5CF6',
  secondaryBg: '#F3E8FF',

  // Light theme
  light: {
    background: '#FFFFFF',
    surface: '#F8FAFC',
    border: '#E2E8F0',
    inputBg: '#F1F5F9',
    text: '#1E293B',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
  },

  // Dark theme
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    border: '#334155',
    inputBg: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
  },
};

export const gradients = {
  brand: ['#2DD4BF', '#3B82F6', '#8B5CF6'] as const,
  brandSubtle: ['#2DD4BF22', '#3B82F622', '#8B5CF622'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};