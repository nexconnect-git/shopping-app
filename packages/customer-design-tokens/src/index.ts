export const customerColors = {
  primary: '#6C2BFF',
  primary2: '#8B5CFF',
  primarySoft: '#F5F2FF',
  ink: '#111827',
  muted: '#6B7280',
  faint: '#9CA3AF',
  line: '#F3F4F6',
  background: '#ffffff',
  surface: '#ffffff',
  green: '#22C55E',
  greenSoft: 'rgba(34, 197, 94, 0.12)',
  red: '#EF4444',
  redSoft: 'rgba(239, 68, 68, 0.10)',
  orange: '#F47714',
  orangeSoft: '#FFF5E9',
  blue: '#225CFF',
  blueSoft: '#EEF4FF',
  white: '#ffffff',
} as const;

export const customerTypography = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  h1: { fontSize: 28, lineHeight: 32, fontWeight: '900' },
  h2: { fontSize: 23, lineHeight: 29, fontWeight: '900' },
  h3: { fontSize: 16, lineHeight: 21, fontWeight: '800' },
  body: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  small: { fontSize: 11, lineHeight: 15, fontWeight: '400' },
  strong: { fontSize: 13, lineHeight: 19, fontWeight: '800' },
} as const;

export const customerSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const customerRadii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const customerShadows = {
  card: '0 12px 28px rgba(16, 24, 40, 0.07)',
  hover: '0 22px 60px rgba(16, 24, 40, 0.12)',
  native: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
} as const;

export const customerZIndex = {
  base: 0,
  dropdown: 20,
  sticky: 40,
  overlay: 80,
  modal: 100,
  toast: 120,
} as const;

export const customerComponentSizes = {
  button: { sm: 40, md: 46, lg: 48 },
  input: { md: 48 },
  icon: { sm: 16, md: 20, lg: 24 },
  badge: { radius: 8, paddingX: 8, paddingY: 5 },
} as const;

export const customerStatusColors = {
  active: customerColors.primary,
  success: customerColors.green,
  danger: customerColors.red,
  warning: customerColors.orange,
  info: customerColors.blue,
  muted: customerColors.muted,
} as const;

export const customerDesignTokens = {
  colors: customerColors,
  typography: customerTypography,
  spacing: customerSpacing,
  radii: customerRadii,
  shadows: customerShadows,
  zIndex: customerZIndex,
  componentSizes: customerComponentSizes,
  statusColors: customerStatusColors,
} as const;

export type CustomerDesignTokens = typeof customerDesignTokens;
