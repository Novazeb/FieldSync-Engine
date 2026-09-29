export const colors = {
  bgPrimary: '#09090B',
  bgSurface: '#18181B',
  bgSubtle: '#27272A',
  borderSubtle: '#27272A',
  borderStrong: '#3F3F46',
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  syncOnline: '#10B981',
  syncPending: '#F59E0B',
  syncActive: '#38BDF8',
  syncConflict: '#F43F5E',
  badgeInboundBg: '#064E3B',
  badgeInboundText: '#34D399',
  badgeOutboundBg: '#451A03',
  badgeOutboundText: '#FB923C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  display1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  heading2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  body1: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  body2: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
} as const;

export const radii = {
  sm: 4,
  md: 8,
  pill: 18,
} as const;
