import { useCallback, useRef, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { SplashScreen, SplashStage } from '@/components/splash-screen';
import { ErrorModal } from '@/components/error-modal';
import {
  useSmartBackHandler,
  useAuth,
  useAuthHandlers,
  useInitialUrl,
  useSessionNavigation,
  useWebViewNavigation,
  useWebViewErrors,
  useImagePicker,
} from '@/hooks';
import { useTheme } from '@/lib/theme';
import {
  CHROME_USER_AGENT,
  DEFAULT_ROUTE_INFO,
  WEBVIEW_BASE_PROPS,
  type RouteInfo,
  type WebToAppMessage,
} from '@/lib/webview';

// ============================================================================
// Main Screen Component
// ============================================================================

export default function WebViewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const webViewRef = useRef<WebView>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>(DEFAULT_ROUTE_INFO);

  // 스플래시 상태 관리
  const [splashStage, setSplashStage] = useState<SplashStage>('SESSION_CHECK');
  const [showSplash, setShowSplash] = useState(true);
  const [splashReady, setSplashReady] = useState(false);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [canHideSplash, setCanHideSplash] = useState(false);

  // 네이티브 인증 상태 관리 (WebView에 토큰 자동 전달)
  const {
    session,
    isReady,
    signOut,
    signInWithGoogle,
    handleWebMessage,
  } = useAuth(webViewRef);

  // 세션 로드 완료 후 초기 URL 결정
  const { url, setUrl, isUrlInitialized } = useInitialUrl(session, isReady);

  useSmartBackHandler({ webViewRef, routeInfo });

  // Image Picker (네이티브 이미지 선택)
  const { handleImagePickerRequest, ImagePickerSheet } = useImagePicker(webViewRef);

  // Auth Handlers (로그아웃, 네이티브 로그인)
  const { handleLogout, handleNativeLogin } = useAuthHandlers({
    webViewRef,
    signOut,
    signInWithGoogle,
  });

  // 세션 변경 감지 → 로그아웃 시 로그인 페이지 이동
  useSessionNavigation({
    session,
    isReady,
    isUrlInitialized,
    url,
    setUrl,
    setRouteInfo,
  });

  // 단계 1 → 단계 2: 세션 확인 완료 시
  useEffect(() => {
    if (isReady) {
      setSplashStage('WEBVIEW_LOAD');
    }
  }, [isReady]);

  // React 스플래시 렌더링 완료 후 Expo 스플래시 숨김 (흰 화면 방지)
  useEffect(() => {
    if (splashReady) {
      ExpoSplashScreen.hideAsync();
    }
  }, [splashReady]);

  // 스플래시 숨김 조건: PAGE_RENDERED 수신 + WebView 로드 완료
  useEffect(() => {
    if (canHideSplash && webViewLoaded) {
      setShowSplash(false);
    }
  }, [canHideSplash, webViewLoaded]);

  // ─────────────────────────────────────────────────────────────────────────
  // Message Handler (switch-case로 타입 내로잉)
  // ─────────────────────────────────────────────────────────────────────────

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg: WebToAppMessage = JSON.parse(event.nativeEvent.data);

      switch (msg.type) {
        // 라우트 정보 업데이트
        case 'ROUTE_INFO':
          setRouteInfo(msg.payload);
          break;

        // 웹 페이지 렌더링 완료 → 스플래시 숨김 허용
        case 'PAGE_RENDERED':
          setCanHideSplash(true);
          break;

        // 인증 요청
        case 'LOGOUT':
          handleLogout();
          break;
        case 'REQUEST_LOGIN':
          handleNativeLogin();
          break;

        // 이미지 선택
        case 'REQUEST_IMAGE_PICKER':
          handleImagePickerRequest({
            requestId: msg.requestId,
            source: msg.source,
          });
          break;

        // 웹 준비 완료 (쿠키 세션 유효한 경우)
        case 'WEB_READY':
          handleWebMessage(msg);
          break;

        // 세션 동기화 요청 (쿠키 세션 만료/없음)
        case 'REQUEST_SESSION_REFRESH':
          setSplashStage('SESSION_SYNC');  // 단계 3: 동기화 중
          handleWebMessage(msg);
          break;

        // 세션 관련 (useAuth 위임)
        case 'SESSION_SET':
        case 'SESSION_EXPIRED':
          handleWebMessage(msg);
          break;
      }
    } catch {
      // Ignore parse errors
    }
  }, [handleLogout, handleNativeLogin, handleImagePickerRequest, handleWebMessage]);

  // ─────────────────────────────────────────────────────────────────────────
  // Navigation & Error Handlers (extracted to hooks)
  // ─────────────────────────────────────────────────────────────────────────

  const { handleLoadRequest, handleNavigation } = useWebViewNavigation({
    setUrl,
    setRouteInfo,
  });

  const { handleWebViewError, handleHttpError, error, clearError } = useWebViewErrors({
    webViewRef,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />

      {/* WebView는 항상 렌더링 (isReady 후) - 로딩 오버레이로 커버 */}
      {isReady && (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          userAgent={CHROME_USER_AGENT}
          {...WEBVIEW_BASE_PROPS}
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={handleLoadRequest}
          onNavigationStateChange={handleNavigation}
          onLoadEnd={() => setWebViewLoaded(true)}
          onError={handleWebViewError}
          onHttpError={handleHttpError}
        />
      )}

      {/* React 스플래시 (단계별 메시지) */}
      {showSplash && (
        <View style={styles.loadingOverlay} onLayout={() => setSplashReady(true)}>
          <SplashScreen stage={splashStage} />
        </View>
      )}

      {/* Image Picker ActionSheet */}
      {ImagePickerSheet}

      {/* Error Modal */}
      <ErrorModal
        visible={!!error}
        onClose={clearError}
        onRetry={() => {
          webViewRef.current?.reload();
          clearError();
        }}
        error={error}
      />
    </View>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
