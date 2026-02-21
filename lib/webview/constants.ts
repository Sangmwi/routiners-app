import { Platform } from 'react-native';
import type { RouteInfo } from './types';

// ============================================================================
// Route Constants
// ============================================================================

export const DEFAULT_ROUTE_INFO: RouteInfo = {
  path: '/',
  isTabRoute: true,
  isHome: true,
  canGoBack: false,
};

export const LOGIN_ROUTE_INFO: RouteInfo = {
  path: '/login',
  isTabRoute: false,
  isHome: false,
  canGoBack: false,
};

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

export const getLoginUrl = (): string => {
  const baseUrl = getInitialUrl();
  return `${baseUrl}/login`;
};

export const getAppInitUrl = (): string => {
  const baseUrl = getInitialUrl();
  return `${baseUrl}/app-init`;
};

// ============================================================================
// Navigation
// ============================================================================

export const TAB_ROUTES = ['/', '/routine', '/stats', '/community', '/profile'] as const;
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
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

