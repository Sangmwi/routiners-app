/**
 * App Hooks
 *
 * React Native 앱에서 사용하는 커스텀 훅들
 *
 * 구조:
 * - auth/: 인증 관련 (Google Sign-In, Supabase 세션)
 * - webview/: WebView 통신 관련
 * - ui/: UI 관련 (테마, 색상 등)
 */

// ============================================================================
// Auth Hooks
// ============================================================================

export { useAuth } from './use-auth';
export { useAuthHandlers } from './use-auth-handlers';

// ============================================================================
// WebView Hooks
// ============================================================================

export { useWebViewNavigation } from './use-webview-navigation';
export { useWebViewErrors } from './use-webview-errors';
export { useSessionNavigation } from './use-session-navigation';
export { useInitialUrl } from './use-initial-url';
export { useSmartBackHandler } from './use-smart-back-handler';
export { useImagePicker } from './use-image-picker';
export { useWebViewMessageDispatcher } from './use-webview-message-dispatcher';

// ============================================================================
// UI Hooks
// ============================================================================

export { useColorScheme } from './use-color-scheme';
export { useThemeColor } from './use-theme-color';
