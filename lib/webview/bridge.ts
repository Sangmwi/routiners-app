import { WebView } from 'react-native-webview';

// ============================================================================
// App → Web Command Types
// ============================================================================

export type AppCommand =
  | { type: 'NAVIGATE_HOME' }
  | { type: 'NAVIGATE_TO'; path: string }
  | { type: 'GET_ROUTE_INFO' };

// ============================================================================
// Bridge Utilities
// ============================================================================

const EVENT_NAME = 'app-command';

/** AppCommand를 실행 가능한 JavaScript 문자열로 변환 */
const toInjectable = (command: AppCommand): string => {
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
  command: AppCommand
): void => {
  webViewRef.current?.injectJavaScript(toInjectable(command));
};

// ============================================================================
// Convenience Functions (선언적 API)
// ============================================================================

export const WebViewBridge = {
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
};

