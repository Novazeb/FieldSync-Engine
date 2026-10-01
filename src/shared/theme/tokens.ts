export const colors = {
  bgPrimary: '#0B0F17',
  bgSurface: '#131A26',
  bgSubtle: '#1C2433',
  borderSubtle: '#222D3D',
  borderStrong: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  syncOnline: '#10B981',
  syncPending: '#F59E0B',
  syncActive: '#38BDF8',
  syncConflict: '#F43F5E',
  badgeInboundBg: '#08332A',
  badgeInboundText: '#34D399',
  badgeOutboundBg: '#331B0A',
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
  display1: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32 },
  heading2: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body1: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  body2: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
} as const;

export const radii = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  pill: 16,
} as const;
