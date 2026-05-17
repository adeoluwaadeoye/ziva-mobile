import { useColorScheme } from 'react-native';

const LightColors = {
  black: '#1C1C1C',
  cream: '#FAFAF8',
  white: '#FFFFFF',
  muted: '#6B6B6B',
  border: '#E8E4DF',
  success: '#22C55E',
  danger: '#EF4444',
} as const;

const DarkColors = {
  black: '#F0EDE8',
  cream: '#111110',
  white: '#1E1E1C',
  muted: '#7A7A75',
  border: '#2A2A28',
  success: '#22C55E',
  danger: '#EF4444',
} as const;

export type ColorSet = {
  black: string;
  cream: string;
  white: string;
  muted: string;
  border: string;
  success: string;
  danger: string;
};

export const Colors = LightColors;

export function useColors(): ColorSet {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
