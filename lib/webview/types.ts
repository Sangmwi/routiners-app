// ============================================================================
// Route Information
// ============================================================================

export type RouteInfo = {
  path: string;
  isTabRoute: boolean;
  isHome: boolean;
  canGoBack: boolean;
};

export const DEFAULT_ROUTE_INFO: RouteInfo = {
  path: '/',
  isTabRoute: true,
  isHome: true,
  canGoBack: false,
};

// ============================================================================
// WebView Bridge Messages
// ============================================================================

/** 웹 → 앱 메시지 */
export type WebToAppMessage =
  | { type: 'ROUTE_INFO'; payload: RouteInfo }
  | { type: 'LOGOUT' }
  | { type: 'REQUEST_LOGIN' }
  | { type: 'WEB_READY' }
  | { type: 'SESSION_SET'; success: boolean }
  | { type: 'REQUEST_SESSION_REFRESH' }
  | { type: 'SESSION_EXPIRED' };

/** 앱 → 웹 메시지 */
export type AppToWebMessage =
  | { type: 'NAVIGATE_TO'; path: string }
  | { type: 'NAVIGATE_HOME' }
  | { type: 'GET_ROUTE_INFO' }
  | { type: 'SET_SESSION'; access_token: string; refresh_token: string }
  | { type: 'CLEAR_SESSION' }
  | { type: 'LOGIN_ERROR'; error: string };
