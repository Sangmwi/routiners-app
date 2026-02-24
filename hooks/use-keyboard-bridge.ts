import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import type { WebView } from 'react-native-webview';
import { WebViewBridge } from '@/lib/webview';

interface UseKeyboardBridgeOptions {
  webViewRef: React.RefObject<WebView | null>;
  isReady: boolean;
}

/**
 * iOS 키보드 이벤트를 감지하여 웹에 높이를 전달하는 훅
 *
 * Android는 softwareKeyboardLayoutMode: "resize"가 뷰포트를 직접 줄이므로
 * 이 훅은 iOS에서만 동작합니다.
 */
export function useKeyboardBridge({ webViewRef, isReady }: UseKeyboardBridgeOptions) {
  useEffect(() => {
    if (Platform.OS !== 'ios' || !isReady) return;

    const showSub = Keyboard.addListener('keyboardWillShow', (e) => {
      WebViewBridge.sendKeyboardShow(webViewRef, e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      WebViewBridge.sendKeyboardHide(webViewRef);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [webViewRef, isReady]);
}
