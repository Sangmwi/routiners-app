import type { WebView } from 'react-native-webview';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { WebViewBridge } from '@/lib/webview';

interface UseKeyboardBridgeOptions {
  webViewRef: React.RefObject<WebView | null>;
  isReady: boolean;
}

/**
 * 키보드 높이를 감지하여 웹에 전달하는 훅
 *
 * react-native-keyboard-controller의 useKeyboardHandler 사용:
 * - WindowInsetsCompat.Type.ime()로 키보드 높이 감지 (edge-to-edge 호환)
 * - KeyboardProvider가 기본 레이아웃 변경을 차단하므로 화면이 밀리지 않음
 * - onEnd 콜백으로 최종 키보드 높이를 웹에 전달
 */
export function useKeyboardBridge({ webViewRef, isReady }: UseKeyboardBridgeOptions) {
  useKeyboardHandler({
    onEnd: (e) => {
      if (!isReady) return;

      if (e.height > 0) {
        WebViewBridge.sendKeyboardShow(webViewRef, e.height);
      } else {
        WebViewBridge.sendKeyboardHide(webViewRef);
      }
    },
  });
}
