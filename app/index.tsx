import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';

import { LoadingIndicator } from '@/components/loading-indicator';
import { useSmartBackHandler } from '@/hooks/use-smart-back-handler';
import {
  CHROME_USER_AGENT,
  FALLBACK_URL,
  DEFAULT_ROUTE_INFO,
  getInitialUrl,
  isTabRoute,
  extractPath,
  toEmulatorUrl,
  hasLocalhost,
  type RouteInfo,
  type WebToAppMessage,
} from '@/lib/webview';

// ============================================================================
// Main Screen Component
// ============================================================================

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [url, setUrl] = useState(getInitialUrl);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>(DEFAULT_ROUTE_INFO);

  useSmartBackHandler({ webViewRef, routeInfo });

  // ─────────────────────────────────────────────────────────────────────────
  // Message Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message: WebToAppMessage = JSON.parse(event.nativeEvent.data);

      if (message.type === 'ROUTE_INFO') {
        setRouteInfo(message.payload);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleLoadRequest = useCallback(
    (request: ShouldStartLoadRequest): boolean => {
      const { url: requestUrl } = request;

      // Block intent:// scheme
      if (requestUrl.startsWith('intent://')) return false;

      // Convert localhost to emulator IP
      if (hasLocalhost(requestUrl)) {
        setUrl(toEmulatorUrl(requestUrl));
        return false;
      }

      return true;
    },
    []
  );

  const handleNavigation = useCallback((navState: WebViewNavigation) => {
    const path = extractPath(navState.url);
    const onTabRoute = isTabRoute(path);
    const isHome = path === '/';

    setRouteInfo((prev) => ({
      ...prev,
      path,
      isTabRoute: onTabRoute,
      isHome,
      // 홈에서는 뒤로가기 불가 (앱 종료로 이어짐), 그 외에는 WebView 상태 따름
      canGoBack: navState.canGoBack && !isHome,
    }));

    if (hasLocalhost(navState.url)) {
      setUrl(toEmulatorUrl(navState.url));
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Error Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const showConnectionError = useCallback(() => {
    Alert.alert('연결 실패', '서버에 연결할 수 없습니다.', [
      { text: '홈으로', onPress: () => setUrl(FALLBACK_URL) },
      { text: '재시도', onPress: () => webViewRef.current?.reload(), style: 'cancel' },
    ]);
  }, []);

  const handleHttpError = useCallback(
    (event: { nativeEvent: { url?: string } }) => {
      if (!event.nativeEvent.url?.includes('localhost')) {
        showConnectionError();
      }
    },
    [showConnectionError]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        userAgent={CHROME_USER_AGENT}
        // Scroll behavior
        bounces={false}
        overScrollMode="never"
        // OAuth & Cookie
        originWhitelist={['*']}
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        mixedContentMode="compatibility"
        setSupportMultipleWindows={false}
        // Core features
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        mediaPlaybackRequiresUserAction={false}
        scalesPageToFit
        // Loading
        startInLoadingState
        renderLoading={LoadingIndicator}
        // Events
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleLoadRequest}
        onNavigationStateChange={handleNavigation}
        onError={showConnectionError}
        onHttpError={handleHttpError}
      />
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
