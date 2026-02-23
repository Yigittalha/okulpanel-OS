// Tasarım Sistemi Token'ları
// Tema #0D1B2A/#FFD60A referansı ile

export const colors = {
  // Ana renkler
  primary: '#0D1B2A',
  secondary: '#FFD60A',
  
  // Nötr renkler
  white: '#FFFFFF',
  black: '#000000',
  
  // Gri tonları
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
  
  // Durum renkleri
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Arka plan renkleri
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    dark: '#0D1B2A',
    darkSecondary: '#1E293B',
  },
  
  // Metin renkleri
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#64748B',
    inverse: '#FFFFFF',
    disabled: '#94A3B8',
  },
  
  // Border renkleri
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#475569',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Özel spacing'ler
  screenPadding: 16,
  cardPadding: 16,
  buttonPadding: 12,
  inputPadding: 12,
};

export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
  
  // Özel radius'lar
  button: 8,
  card: 12,
  input: 8,
  modal: 16,
};

export const typography = {
  // Font boyutları
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font ağırlıkları
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line height'lar
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  // iOS shadow (shadowColor, shadowOffset, shadowOpacity, shadowRadius)
  ios: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
  },
  
  // Android elevation
  android: {
    sm: { elevation: 2 },
    md: { elevation: 4 },
    lg: { elevation: 8 },
    xl: { elevation: 16 },
  },
};

export const animations = {
  // Timing'ler
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  // Easing'ler
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Platform-specific değerler
export const platform = {
  ios: {
    statusBarHeight: 44,
    homeIndicatorHeight: 34,
  },
  android: {
    statusBarHeight: 24,
    navigationBarHeight: 48,
  },
};

// Accessibility değerleri
export const accessibility = {
  minTouchTarget: 44, // 44dp minimum touch target
  contrastRatio: 4.5, // WCAG AA minimum contrast ratio
  reducedMotion: 'prefers-reduced-motion',
};

// Tema objesi (mevcut tema yapısıyla uyumlu)
export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  animations,
  breakpoints,
  zIndex,
  platform,
  accessibility,
};
