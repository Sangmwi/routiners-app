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

export type WebToAppMessage =
  | { type: 'ROUTE_INFO'; payload: RouteInfo }
  | { type: 'LOGOUT' }
  | { type: 'REQUEST_LOGIN' }
  | { type: 'WEB_READY' }
  | { type: 'TOKEN_RECEIVED'; success: boolean }
  | { type: 'REQUEST_TOKEN_REFRESH' };

export type AppToWebMessage =
  | { type: 'NAVIGATE_TO'; path: string }
  | { type: 'NAVIGATE_HOME' }
  | { type: 'GET_ROUTE_INFO' }
  | { type: 'SET_TOKEN'; token: string | null }
  | { type: 'LOGIN_ERROR'; error: string };

