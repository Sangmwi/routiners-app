import { WebView } from 'react-native-webview';
import type { AppToWebMessage } from './types';
import type { ThemeMode } from '@sauhi/shared-contracts';

// ============================================================================
// Bridge Utilities
// ============================================================================

const EVENT_NAME = 'app-command';

/** AppToWebMessage를 실행 가능한 JavaScript 문자열로 변환 */
const toInjectable = (command: AppToWebMessage): string => {
  const payload = JSON.stringify(command);
  return `
    window.dispatchEvent(new CustomEvent('${EVENT_NAME}', {
      detail: ${payload}
    }));
    true;
  `;
};

/** WebView에 명령 전송 */
export const sendCommand = (
  webViewRef: React.RefObject<WebView | null>,
  command: AppToWebMessage
): void => {
  webViewRef.current?.injectJavaScript(toInjectable(command));
};

// ============================================================================
// Convenience Functions (선언적 API)
// ============================================================================

export const WebViewBridge = {
  // ──────────────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────────────

  /** 홈으로 이동 */
  navigateHome: (webViewRef: React.RefObject<WebView | null>) => {
    sendCommand(webViewRef, { type: 'NAVIGATE_HOME' });
  },

  /** 특정 경로로 이동 */
  navigateTo: (webViewRef: React.RefObject<WebView | null>, path: string) => {
    sendCommand(webViewRef, { type: 'NAVIGATE_TO', path });
  },

  /** 현재 경로 정보 요청 */
  requestRouteInfo: (webViewRef: React.RefObject<WebView | null>) => {
    sendCommand(webViewRef, { type: 'GET_ROUTE_INFO' });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Session
  // ──────────────────────────────────────────────────────────────────────────

  /** 세션 설정 (로그인 완료 후) */
  setSession: (
    webViewRef: React.RefObject<WebView | null>,
    accessToken: string,
    refreshToken: string
  ) => {
    sendCommand(webViewRef, {
      type: 'SET_SESSION',
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  },

  /** 세션 삭제 (로그아웃) */
  clearSession: (webViewRef: React.RefObject<WebView | null>) => {
    sendCommand(webViewRef, { type: 'CLEAR_SESSION' });
  },

  /** 로그인 에러 전달 */
  sendLoginError: (webViewRef: React.RefObject<WebView | null>, error: string) => {
    sendCommand(webViewRef, { type: 'LOGIN_ERROR', error });
  },

  /** 로그인 취소 전달 */
  sendLoginCancelled: (webViewRef: React.RefObject<WebView | null>) => {
    sendCommand(webViewRef, { type: 'LOGIN_CANCELLED' });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Image Picker
  // ──────────────────────────────────────────────────────────────────────────

  /** 이미지 피커 결과 전달 */
  sendImagePickerResult: (
    webViewRef: React.RefObject<WebView | null>,
    requestId: string,
    result: import('./types').ImagePickerResult
  ) => {
    sendCommand(webViewRef, {
      type: 'IMAGE_PICKER_RESULT',
      requestId,
      result,
    });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Keyboard
  // ──────────────────────────────────────────────────────────────────────────

  /** 키보드 표시 알림 (높이: CSS px 단위) */
  sendKeyboardShow: (webViewRef: React.RefObject<WebView | null>, height: number) => {
    sendCommand(webViewRef, { type: 'KEYBOARD_SHOW', height });
  },

  /** 키보드 숨김 알림 */
  sendKeyboardHide: (webViewRef: React.RefObject<WebView | null>) => {
    sendCommand(webViewRef, { type: 'KEYBOARD_HIDE' });
  },

  /** 웹 테마 모드 설정 */
  setThemeMode: (webViewRef: React.RefObject<WebView | null>, mode: ThemeMode) => {
    sendCommand(webViewRef, { type: 'SET_THEME_MODE', mode });
  },

  /** 네이티브 하단 safe area 값을 CSS 변수로 주입 (Android env() 부정확 보정) */
  setNativeBottom: (webViewRef: React.RefObject<WebView | null>, bottomPx: number) => {
    webViewRef.current?.injectJavaScript(
      `document.documentElement.style.setProperty('--native-bottom','${bottomPx}px');true;`
    );
  },
};
