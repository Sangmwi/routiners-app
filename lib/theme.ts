import { THEME_TOKENS } from '@sauhi/shared-contracts';
import { useThemePreference } from '@/lib/theme-preference';

// ============================================================================
// WebView Theme Configuration
// ============================================================================

const { brand, semantic, layout } = THEME_TOKENS;
const backdropLight = layout.modal.backdropLight;
const backdropDark = layout.modal.backdropDark;

export const COLORS = {
  primary: brand.green[500],
  primaryLight: brand.green[400],
  primaryDark: brand.green[600],
  primaryDarker: brand.green[700],
  primaryMedium: brand.green[200],
  primarySubtle: brand.green[100],
  primaryDarkLight: brand.slate[700],
  primaryDarkMedium: brand.slate[800],
  primaryDarkSubtle: brand.slate[900],

  green50: brand.green[50],
  green100: brand.green[100],
  green200: brand.green[200],
  green300: brand.green[300],
  green400: brand.green[400],
  green500: brand.green[500],
  green600: brand.green[600],
  green700: brand.green[700],
  green800: brand.green[800],
  green900: brand.green[900],
  green950: brand.green[950],

  slate50: brand.slate[50],
  slate100: brand.slate[100],
  slate200: brand.slate[200],
  slate400: brand.slate[400],
  slate500: brand.slate[500],
  slate700: brand.slate[700],
  slate800: brand.slate[800],
  slate900: brand.slate[900],

  textMuted: semantic.dark.mutedForeground,
  textMutedDark: semantic.light.mutedForeground,
  destructive: '#ef4444',
  destructiveDark: '#dc2626',
} as const;

export const WEBVIEW_THEME = {
  light: {
    background: semantic.light.background,
    statusBar: 'dark' as const,
    text: brand.slate[900],
    textMuted: COLORS.textMutedDark,
  },
  dark: {
    background: semantic.dark.background,
    statusBar: 'light' as const,
    text: brand.slate[50],
    textMuted: COLORS.textMuted,
  },
} as const;

export type ThemeMode = keyof typeof WEBVIEW_THEME;
export type Theme = (typeof WEBVIEW_THEME)[ThemeMode];

export const COMPONENT_THEME = {
  light: {
    background: semantic.light.background,
    card: semantic.light.card,
    muted: semantic.light.muted,
    overlay: backdropLight,

    text: semantic.light.foreground,
    textSecondary: brand.green[600],
    textMuted: brand.slate[500],

    border: semantic.light.border,
    borderLight: THEME_TOKENS.edge.light.faint,

    primary: semantic.light.primary,
    primaryForeground: semantic.light.primaryForeground,

    destructive: semantic.light.destructive,
    destructiveForeground: semantic.light.destructiveForeground,

    layout,
  },
  dark: {
    background: semantic.dark.background,
    card: semantic.dark.card,
    muted: semantic.dark.muted,
    overlay: backdropDark,

    text: semantic.dark.foreground,
    textSecondary: semantic.dark.secondaryForeground,
    textMuted: semantic.dark.mutedForeground,

    border: semantic.dark.border,
    borderLight: semantic.dark.card,

    primary: semantic.dark.primary,
    primaryForeground: semantic.dark.primaryForeground,

    destructive: semantic.dark.destructive,
    destructiveForeground: semantic.dark.destructiveForeground,

    layout,
  },
} as const;

export type ComponentTheme = (typeof COMPONENT_THEME)[ThemeMode];

export function useTheme(): Theme {
  const { resolvedMode } = useThemePreference();
  return resolvedMode === 'dark' ? WEBVIEW_THEME.dark : WEBVIEW_THEME.light;
}

export function useComponentTheme(): ComponentTheme & { isDark: boolean } {
  const { resolvedMode } = useThemePreference();
  const isDark = resolvedMode === 'dark';
  return {
    ...(isDark ? COMPONENT_THEME.dark : COMPONENT_THEME.light),
    isDark,
  };
}

