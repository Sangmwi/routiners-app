/**
 * WebView Bridge Types
 *
 * ⚠️ SOURCE OF TRUTH
 * 이 파일 수정 시 앱의 lib/webview/types.ts에도 동일하게 반영하세요.
 */

// ============================================================================
// Route Information
// ============================================================================

export type RouteInfo = {
  path: string;
  isTabRoute: boolean;
  isHome: boolean;
  canGoBack: boolean;
};

// ============================================================================
// WebView Bridge Messages
// ============================================================================

// ============================================================================
// Image Picker Types
// ============================================================================

export type ImagePickerSource = 'camera' | 'gallery' | 'both';

export type ImagePickerResult = {
  /** 성공 여부 */
  success: boolean;
  /** 이미지 base64 데이터 (data:image/jpeg;base64,... 형식) */
  base64?: string;
  /** 이미지 URI (네이티브 경로) */
  uri?: string;
  /** MIME 타입 */
  mimeType?: string;
  /** 파일명 */
  fileName?: string;
  /** 파일 크기 (bytes) */
  fileSize?: number;
  /** 이미지 너비 */
  width?: number;
  /** 이미지 높이 */
  height?: number;
  /** 취소 여부 */
  cancelled?: boolean;
  /** 에러 메시지 */
  error?: string;
};

/** 앱 → 웹 메시지 (CustomEvent로 수신) */
export type AppToWebMessage =
  | { type: 'NAVIGATE_HOME' }
  | { type: 'NAVIGATE_TO'; path: string }
  | { type: 'GET_ROUTE_INFO' }
  | { type: 'SET_SESSION'; access_token: string; refresh_token: string }
  | { type: 'CLEAR_SESSION' }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGIN_CANCELLED' }
  | { type: 'IMAGE_PICKER_RESULT'; requestId: string; result: ImagePickerResult }
  | { type: 'KEYBOARD_SHOW'; height: number }
  | { type: 'KEYBOARD_HIDE' };

/** 웹 → 앱 메시지 (postMessage로 전송) */
export type WebToAppMessage =
  | { type: 'ROUTE_INFO'; payload: RouteInfo }
  | { type: 'LOGOUT' }
  | { type: 'REQUEST_LOGIN' }
  | { type: 'WEB_READY' }
  | { type: 'SESSION_SET'; success: boolean }
  | { type: 'REQUEST_SESSION_REFRESH' }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'REQUEST_IMAGE_PICKER'; requestId: string; source: ImagePickerSource }
  | { type: 'PAGE_RENDERED' }
  | { type: 'OVERLAY_STATE'; payload: { hasOverlay: boolean } };
