import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Animated } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import type { SplashStage } from '@/components/splash-screen';

interface UseSplashTransitionReturn {
  splashStage: SplashStage;
  setSplashStage: Dispatch<SetStateAction<SplashStage>>;
  showSplash: boolean;
  splashOpacity: Animated.Value;
  setCanHideSplash: Dispatch<SetStateAction<boolean>>;
  setWebViewLoaded: Dispatch<SetStateAction<boolean>>;
  markSplashReady: () => void;
}

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
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }, 50);

    return () => clearTimeout(timer);
  }, [canHideSplash, splashOpacity, webViewLoaded]);

  return {
    splashStage,
    setSplashStage,
    showSplash,
    splashOpacity,
    setCanHideSplash,
    setWebViewLoaded,
    markSplashReady: () => setSplashReady(true),
  };
}
