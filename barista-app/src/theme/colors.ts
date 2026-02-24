// ─── Brand Tokens ──────────────────────────────────────────────────────────────
export const Colors = {
  primary:    '#3B1F0E',   // dark espresso brown
  accent:     '#C8873A',   // caramel gold
  bg:         '#FDF6EE',   // cream
  surface:    '#FFFFFF',
  border:     '#E8D8C4',
  text:       '#1A0A00',
  textMuted:  '#7A5C42',
  success:    '#2D7A4F',
  danger:     '#C0392B',
} as const;

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
} as const;

export const Shadow = {
  card: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;
