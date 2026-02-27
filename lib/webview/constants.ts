import { Platform } from 'react-native';
import {
  DEFAULT_ROUTE_INFO,
  LOGIN_ROUTE_INFO,
  TAB_ROUTES,
  type TabRoute,
} from '@sangmwi/shared-contracts';

export { DEFAULT_ROUTE_INFO, LOGIN_ROUTE_INFO, TAB_ROUTES, type TabRoute };

export const IS_ANDROID = Platform.OS === 'android';
export const IS_DEV_ANDROID = __DEV__ && IS_ANDROID;

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

export const isTabRoute = (path: string): path is TabRoute =>
  TAB_ROUTES.includes(path as TabRoute);

export const DOUBLE_TAP_EXIT_DELAY = 2000;

export const CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';