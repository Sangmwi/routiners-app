import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { NativeBottomNav } from '@/components/common/native-bottom-nav';
import { ErrorModal } from '@/components/error-modal';
import { SplashScreen } from '@/components/splash-screen';
import {
  useAuth,
  useAuthHandlers,
  useImagePicker,
  useInitialUrl,
  useKeyboardBridge,
  useSessionNavigation,
  useSmartBackHandler,
  useSplashTransition,
  useWebViewErrors,
  useWebViewMessageDispatcher,
  useWebViewNavigation,
} from '@/hooks';
import { useTheme } from '@/lib/theme';
import { useThemePreference } from '@/lib/theme-preference';
import { NATIVE_TAB_STYLE } from '@/lib/navigation/native-tab-config';
import {
  CHROME_USER_AGENT,
  DEFAULT_ROUTE_INFO,
  TAB_ROUTES,
  WEBVIEW_BASE_PROPS,
  WebViewBridge,
  type RouteInfo,
} from '@/lib/webview';

function getActiveTab(path: string): (typeof TAB_ROUTES)[number] {
  if (path === '/') return '/';
  const matched = TAB_ROUTES.find((tab) => tab !== '/' && (path === tab || path.startsWith(`${tab}/`)));
  return matched ?? '/';
}

export default function WebViewScreen() {
  const theme = useTheme();
  const { mode } = useThemePreference();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const webViewRef = useRef<WebView>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>(DEFAULT_ROUTE_INFO);
  const [hasOverlay, setHasOverlay] = useState(false);
  const {
    splashStage,
    setSplashStage,
    showSplash,
    splashOpacity,
    setCanHideSplash,
    setWebViewLoaded,
    markSplashReady,
  } = useSplashTransition();

  const { session, isReady, signOut, signInWithGoogle, handleWebMessage } =
    useAuth(webViewRef);

  const { url, setUrl, isUrlInitialized } = useInitialUrl(session, isReady);
  useSmartBackHandler({ webViewRef, routeInfo, hasOverlay });

  const { handleImagePickerRequest, ImagePickerSheet } = useImagePicker(webViewRef);

  const { handleLogout, handleNativeLogin } = useAuthHandlers({
    webViewRef,
    signOut,
    signInWithGoogle,
  });

  useSessionNavigation({
    session,
    isReady,
    isUrlInitialized,
    url,
    setUrl,
    setRouteInfo,
  });

  const { handleMessage } = useWebViewMessageDispatcher({
    setRouteInfo,
    setHasOverlay,
    setCanHideSplash,
    setSplashStage,
    handleLogout,
    handleNativeLogin,
    handleImagePickerRequest,
    handleOpenNativeSettings: () => router.push('/settings'),
    handleWebMessage,
  });

  useEffect(() => {
    if (isReady) {
      setSplashStage('WEBVIEW_LOAD');
    }
  }, [isReady, setSplashStage]);

  useEffect(() => {
    WebViewBridge.setThemeMode(webViewRef, mode);
  }, [mode]);

  useKeyboardBridge({ webViewRef, isReady });

  const { handleLoadRequest, handleNavigation } = useWebViewNavigation({
    setUrl,
    setRouteInfo,
  });

  const { handleWebViewError, handleHttpError, error, clearError } =
    useWebViewErrors({
      webViewRef,
    });

  const showNativeTabs = routeInfo.isTabRoute && routeInfo.path !== '/login';
  const activeTab = getActiveTab(routeInfo.path);

  const handleTabPress = (path: (typeof TAB_ROUTES)[number]) => {
    if (activeTab === path) return;
    WebViewBridge.navigateTo(webViewRef, path);
    setRouteInfo((prev) => ({
      ...prev,
      path,
      isTabRoute: true,
      isHome: path === '/',
      canGoBack: path !== '/',
    }));
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.background },
      ]}
    >
      <StatusBar style={theme.statusBar} />

      <View
        style={[
          styles.webviewHost,
          showNativeTabs ? { marginBottom: NATIVE_TAB_STYLE.height + insets.bottom } : null,
        ]}
      >
        {isReady && (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={[styles.webview, { backgroundColor: theme.background }]}
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
      </View>

      {showNativeTabs && <NativeBottomNav activeTab={activeTab} onTabPress={handleTabPress} />}

      {showSplash && (
        <Animated.View
          style={[styles.loadingOverlay, { opacity: splashOpacity }]}
          onLayout={markSplashReady}
        >
          <SplashScreen stage={splashStage} />
        </Animated.View>
      )}

      {ImagePickerSheet}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  webviewHost: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
