import { useCallback, useRef, useState, useEffect } from 'react';
import { Alert, StyleSheet, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import CookieManager from '@react-native-cookies/cookies';

import { LoadingIndicator } from '@/components/loading-indicator';
import { useSmartBackHandler } from '@/hooks/use-smart-back-handler';
import { useAuth } from '@/hooks/use-auth';
import {
  CHROME_USER_AGENT,
  FALLBACK_URL,
  DEFAULT_ROUTE_INFO,
  getInitialUrl,
  getLoginUrl,
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

// 웹 테마와 일치하는 색상
const THEME = {
  light: {
    background: '#f8faf8', // 웹 라이트모드 배경
    statusBar: 'dark' as const,
  },
  dark: {
    background: '#0f172a', // 웹 다크모드 배경 (slate-900)
    statusBar: 'light' as const,
  },
};

export default function WebViewScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? THEME.dark : THEME.light;

  const webViewRef = useRef<WebView>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>(DEFAULT_ROUTE_INFO);
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);

  // 네이티브 인증 상태 관리 (WebView에 토큰 자동 전달)
  const {
    session,
    isReady,
    signOut,
    signInWithGoogle,
    handleWebMessage,
  } = useAuth(webViewRef);

  // 세션 로드 완료 후 초기 URL 결정
  const [url, setUrl] = useState(getInitialUrl);

  useEffect(() => {
    if (isReady && !isUrlInitialized) {
      setIsUrlInitialized(true);
      // 세션이 있으면 홈, 없으면 로그인
      const startUrl = session ? getInitialUrl() : getLoginUrl();
      console.log('[WebView] Session ready, starting with:', session ? 'home' : 'login');
      setUrl(startUrl);
    }
  }, [isReady, session, isUrlInitialized]);

  useSmartBackHandler({ webViewRef, routeInfo });

  // ─────────────────────────────────────────────────────────────────────────
  // Auth Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    console.log('[WebView] Logout received, clearing session...');

    // 1. 네이티브 Supabase 세션 로그아웃 (SecureStore 토큰 삭제)
    await signOut();

    // 2. 쿠키 삭제 시도 (레거시 호환)
    try {
      const webUrl = getInitialUrl();
      const cookies = await CookieManager.get(webUrl);

      for (const cookieName of Object.keys(cookies)) {
        await CookieManager.clearByName(webUrl, cookieName);
      }
    } catch {
      console.log('[WebView] Cookie clear skipped (Android)');
    }

    // 3. 로그인 페이지로 이동
    setUrl(getLoginUrl());
    setRouteInfo({ ...DEFAULT_ROUTE_INFO, path: '/login', isHome: false });

    console.log('[WebView] Redirecting to login...');
  }, [signOut]);

  // 네이티브 OAuth 로그인 (웹에서 REQUEST_LOGIN 수신 시)
  const handleNativeLogin = useCallback(async () => {
    console.log('[WebView] Native login requested from web');
    try {
      await signInWithGoogle();
      // 로그인 성공 시 onAuthStateChange가 토큰을 WebView에 전달하고
      // 아래 useEffect에서 홈으로 이동 처리
    } catch (error) {
      console.error('[WebView] Native login failed:', error);
      // 에러 시 웹에 알림 (로딩 해제)
      webViewRef.current?.injectJavaScript(`
        window.dispatchEvent(new CustomEvent('app-command', {
          detail: { type: 'LOGIN_ERROR', error: 'Native login failed' }
        }));
        true;
      `);
    }
  }, [signInWithGoogle]);

  // 세션 변경 감지 → URL 네비게이션 처리
  // (토큰 전달은 useAuth의 onAuthStateChange에서 자동 처리)
  useEffect(() => {
    if (!isReady || !isUrlInitialized) return;

    if (session) {
      // 로그인됨: 로그인 페이지면 홈으로 이동
      if (routeInfo.path === '/login' || url.includes('/login')) {
        console.log('[WebView] Redirecting to home after login');
        setUrl(getInitialUrl());
        setRouteInfo(DEFAULT_ROUTE_INFO);
      }
    } else {
      // 로그아웃됨: 로그인 페이지로 이동
      console.log('[WebView] Session cleared, redirecting to login');
      if (!url.includes('/login')) {
        setUrl(getLoginUrl());
        setRouteInfo({ ...DEFAULT_ROUTE_INFO, path: '/login', isHome: false });
      }
    }
  }, [session, isReady, isUrlInitialized, routeInfo.path, url]);

  // ─────────────────────────────────────────────────────────────────────────
  // Message Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message: WebToAppMessage = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'ROUTE_INFO':
          setRouteInfo(message.payload);
          break;
        case 'LOGOUT':
          handleLogout();
          break;
        case 'REQUEST_LOGIN':
          handleNativeLogin();
          break;
        // 인증 관련 메시지는 useAuth에서 처리
        case 'WEB_READY':
        case 'TOKEN_RECEIVED':
        case 'REQUEST_TOKEN_REFRESH':
          handleWebMessage(message);
          break;
      }
    } catch {
      // Ignore parse errors
    }
  }, [handleLogout, handleNativeLogin, handleWebMessage]);

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

  const handleWebViewError = useCallback((syntheticEvent: { nativeEvent: { description?: string; code?: number; url?: string } }) => {
    const { description, code, url: errorUrl } = syntheticEvent.nativeEvent;

    console.log('[WebView] 🔴 onError triggered:', { description, code, errorUrl });

    // 디버깅용 상세 Alert
    Alert.alert(
      '연결 실패',
      `서버에 연결할 수 없습니다.\n\n[DEBUG]\nURL: ${errorUrl}\nCode: ${code}\nDesc: ${description}`,
      [
        { text: '홈으로', onPress: () => setUrl(FALLBACK_URL) },
        { text: '재시도', onPress: () => webViewRef.current?.reload(), style: 'cancel' },
        { text: '뒤로가기', onPress: () => webViewRef.current?.goBack() },
      ]
    );
  }, []);

  const handleHttpError = useCallback(
    (event: { nativeEvent: { url?: string; statusCode?: number; description?: string } }) => {
      const { url: errorUrl, statusCode, description } = event.nativeEvent;

      console.log('[WebView] 🟠 onHttpError:', { errorUrl, statusCode, description });

      if (!errorUrl?.includes('localhost')) {
        Alert.alert(
          'HTTP 에러',
          `[DEBUG]\nURL: ${errorUrl}\nStatus: ${statusCode}\nDesc: ${description}`,
          [
            { text: '확인' },
            { text: '재시도', onPress: () => webViewRef.current?.reload() },
          ]
        );
      }
    },
    []
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  // 세션 로드 전에는 로딩 화면 표시
  if (!isReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar style={theme.statusBar} />
        <LoadingIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar style={theme.statusBar} />
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        userAgent={CHROME_USER_AGENT}
        // Debug
        webviewDebuggingEnabled={true}
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
        onError={handleWebViewError}
        onHttpError={handleHttpError}
        // 토큰 동기화는 웹에서 WEB_READY 신호를 보내면 처리됨 (handleWebMessage)
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
  },
  webview: {
    flex: 1,
  },
});
