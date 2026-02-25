import { useCallback, useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  IS_ANDROID,
  DOUBLE_TAP_EXIT_DELAY,
  WebViewBridge,
  type RouteInfo,
} from '@/lib/webview';

// ============================================================================
// Types
// ============================================================================

type SmartBackHandlerConfig = {
  webViewRef: React.RefObject<WebView | null>;
  routeInfo: RouteInfo;
  hasOverlay: boolean;
};

// ============================================================================
// Hook Implementation
// ============================================================================

export const useSmartBackHandler = ({
  webViewRef,
  routeInfo,
  hasOverlay,
}: SmartBackHandlerConfig) => {
  const lastBackPressRef = useRef(0);
  const overlayBackCooldownRef = useRef(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation Actions
  // ─────────────────────────────────────────────────────────────────────────

  const navigateToHome = useCallback(() => {
    WebViewBridge.navigateHome(webViewRef);
  }, [webViewRef]);

  const showExitToast = useCallback(() => {
    if (IS_ANDROID) {
      ToastAndroid.show('한 번 더 누르면 종료됩니다', ToastAndroid.SHORT);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Back Press Handler
  // ─────────────────────────────────────────────────────────────────────────

  const handleBackPress = useCallback((): boolean => {
    if (!IS_ANDROID) return false;

    // Case 0: 오버레이 열린 상태 → goBack()으로 오버레이 닫기
    if (hasOverlay) {
      if (overlayBackCooldownRef.current) return true;
      overlayBackCooldownRef.current = true;
      setTimeout(() => { overlayBackCooldownRef.current = false; }, 300);
      webViewRef.current?.goBack();
      return true;
    }

    const { isTabRoute, isHome, canGoBack } = routeInfo;

    // Case 1: 탭 내 하위 페이지 (예: /ai/detail) → 웹 뒤로가기
    if (!isTabRoute && canGoBack) {
      webViewRef.current?.goBack();
      return true;
    }

    // Case 2: 탭 페이지 (홈 제외) → 무조건 홈으로 (일관된 동작)
    if (isTabRoute && !isHome) {
      navigateToHome();
      return true;
    }

    // Case 3: 홈 → 더블 탭 종료
    const now = Date.now();
    const shouldExit = now - lastBackPressRef.current < DOUBLE_TAP_EXIT_DELAY;

    if (shouldExit) {
      BackHandler.exitApp();
      return true;
    }

    lastBackPressRef.current = now;
    showExitToast();
    return true;
  }, [hasOverlay, routeInfo, webViewRef, navigateToHome, showExitToast]);

  // ─────────────────────────────────────────────────────────────────────────
  // Event Subscription
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!IS_ANDROID) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => subscription.remove();
  }, [handleBackPress]);
};
