import { useColorScheme } from 'react-native';

// ============================================================================
// WebView Theme Configuration
// ============================================================================

/**
 * 공통 색상 (웹 globals.css와 일치)
 */
export const COLORS = {
  // Primary (Green Brand)
  primary: '#50A76C', // green-500 (웹 메인 브랜드)
  primaryLight: '#5fc07f', // green-400 (다크모드용)
  primaryDark: '#328a4d', // green-600
  primaryDarker: '#1B6523', // green-700
  primaryMedium: '#b9eac8', // green-200
  primarySubtle: '#dbf5e2', // green-100
  primaryDarkLight: '#334155', // slate-700
  primaryDarkMedium: '#1e293b', // slate-800
  primaryDarkSubtle: '#0f172a', // slate-900

  // Green Scale
  green50: '#f0faf3',
  green100: '#dbf5e2',
  green200: '#b9eac8',
  green300: '#88d9a2',
  green400: '#5fc07f',
  green500: '#50A76C',
  green600: '#328a4d',
  green700: '#1B6523',
  green800: '#1a5421',
  green900: '#17451c',
  green950: '#0a2610',

  // Slate Scale (다크모드용)
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',

  // Semantic
  textMuted: '#94a3b8', // slate-400
  textMutedDark: '#64748b', // slate-500
  destructive: '#ef4444', // red-500
  destructiveDark: '#dc2626', // red-600
} as const;

/**
 * 웹 테마와 일치하는 네이티브 색상
 */
export const WEBVIEW_THEME = {
  light: {
    background: '#f8faf8', // 웹 라이트모드 배경
    statusBar: 'dark' as const,
    text: '#0f172a', // slate-900
    textMuted: COLORS.textMutedDark,
  },
  dark: {
    background: '#0f172a', // 웹 다크모드 배경 (slate-900)
    statusBar: 'light' as const,
    text: '#f8fafc', // slate-50
    textMuted: COLORS.textMuted,
  },
} as const;

export type ThemeMode = keyof typeof WEBVIEW_THEME;
export type Theme = (typeof WEBVIEW_THEME)[ThemeMode];

/**
 * 컴포넌트용 확장 테마 (웹 디자인 시스템과 일치)
 */
export const COMPONENT_THEME = {
  light: {
    // Backgrounds
    background: '#f8faf8',
    card: '#ffffff',
    muted: '#e8f4eb',
    overlay: 'rgba(0, 0, 0, 0.5)',

    // Text
    text: '#0a2610', // green-950
    textSecondary: '#328a4d', // green-600
    textMuted: '#64748b', // slate-500

    // Borders
    border: '#b9eac8', // green-200
    borderLight: '#dbf5e2', // green-100

    // Primary
    primary: '#50A76C',
    primaryForeground: '#ffffff',

    // Destructive
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
  },
  dark: {
    // Backgrounds
    background: '#0f172a', // slate-900
    card: '#1e293b', // slate-800
    muted: '#0f172a', // slate-900
    overlay: 'rgba(0, 0, 0, 0.7)',

    // Text
    text: '#f1f5f9', // slate-100
    textSecondary: '#e2e8f0', // slate-200
    textMuted: '#94a3b8', // slate-400

    // Borders
    border: '#334155', // slate-700
    borderLight: '#1e293b', // slate-800

    // Primary
    primary: '#5fc07f', // green-400
    primaryForeground: '#0a2610', // green-950

    // Destructive
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
  },
} as const;

export type ComponentTheme = (typeof COMPONENT_THEME)[ThemeMode];

// ============================================================================
// Hooks
// ============================================================================

/**
 * 현재 시스템 테마에 맞는 WebView 테마 반환
 */
export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return isDark ? WEBVIEW_THEME.dark : WEBVIEW_THEME.light;
}

/**
 * 현재 시스템 테마에 맞는 컴포넌트 테마 반환
 */
export function useComponentTheme(): ComponentTheme & { isDark: boolean } {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    ...(isDark ? COMPONENT_THEME.dark : COMPONENT_THEME.light),
    isDark,
  };
}
