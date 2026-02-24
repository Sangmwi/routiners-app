import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
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
import {
  CHROME_USER_AGENT,
  DEFAULT_ROUTE_INFO,
  WEBVIEW_BASE_PROPS,
  type RouteInfo,
} from '@/lib/webview';

export default function WebViewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const webViewRef = useRef<WebView>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>(DEFAULT_ROUTE_INFO);
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
  useSmartBackHandler({ webViewRef, routeInfo });

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
    setCanHideSplash,
    setSplashStage,
    handleLogout,
    handleNativeLogin,
    handleImagePickerRequest,
    handleWebMessage,
  });

  useEffect(() => {
    if (isReady) {
      setSplashStage('WEBVIEW_LOAD');
    }
  }, [isReady, setSplashStage]);

  useKeyboardBridge({ webViewRef, isReady });

  const { handleLoadRequest, handleNavigation } = useWebViewNavigation({
    setUrl,
    setRouteInfo,
  });

  const { handleWebViewError, handleHttpError, error, clearError } =
    useWebViewErrors({
      webViewRef,
    });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.background },
      ]}
    >
      <StatusBar style={theme.statusBar} />

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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
