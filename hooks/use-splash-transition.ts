import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Animated } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import type { SplashStage } from '@/components/splash-screen';

// ============================================================================
// Constants
// ============================================================================

const SPLASH_FADE_DURATION_MS = 300;
const SPLASH_FADE_DELAY_MS = 50;

// ============================================================================
// Types
// ============================================================================

interface UseSplashTransitionReturn {
  splashStage: SplashStage;
  setSplashStage: Dispatch<SetStateAction<SplashStage>>;
  showSplash: boolean;
  splashOpacity: Animated.Value;
  setCanHideSplash: Dispatch<SetStateAction<boolean>>;
  webViewLoaded: boolean;
  setWebViewLoaded: Dispatch<SetStateAction<boolean>>;
  markSplashReady: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useSplashTransition(): UseSplashTransitionReturn {
  const [splashStage, setSplashStage] = useState<SplashStage>('SESSION_CHECK');
  const [showSplash, setShowSplash] = useState(true);
  const [splashReady, setSplashReady] = useState(false);
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [canHideSplash, setCanHideSplash] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!splashReady) return;
    void ExpoSplashScreen.hideAsync();
  }, [splashReady]);

  useEffect(() => {
    if (!(canHideSplash && webViewLoaded)) return;

    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: SPLASH_FADE_DURATION_MS,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, SPLASH_FADE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [canHideSplash, splashOpacity, webViewLoaded]);

  return {
    splashStage,
    setSplashStage,
    showSplash,
    splashOpacity,
    setCanHideSplash,
    webViewLoaded,
    setWebViewLoaded,
    markSplashReady: () => setSplashReady(true),
  };
}
