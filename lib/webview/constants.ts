import { Platform } from 'react-native';

// ============================================================================
// Platform Detection
// ============================================================================

export const IS_ANDROID = Platform.OS === 'android';
export const IS_DEV_ANDROID = __DEV__ && IS_ANDROID;

// ============================================================================
// URLs
// ============================================================================

export const FALLBACK_URL = 'https://www.google.com';

export const getInitialUrl = (): string => {
  const url = process.env.EXPO_PUBLIC_WEBVIEW_URL || FALLBACK_URL;
  return IS_DEV_ANDROID ? url.replace('localhost', '10.0.2.2') : url;
};

// ============================================================================
// Navigation
// ============================================================================

export const TAB_ROUTES = ['/', '/ai', '/community', '/profile'] as const;
export type TabRoute = (typeof TAB_ROUTES)[number];

export const isTabRoute = (path: string): path is TabRoute =>
  TAB_ROUTES.includes(path as TabRoute);

// ============================================================================
// Timing
// ============================================================================

export const DOUBLE_TAP_EXIT_DELAY = 2000;

// ============================================================================
// Browser Identity
// ============================================================================

export const CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';

