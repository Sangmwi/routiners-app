import 'react-native-reanimated';

import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Text, TextInput } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ThemePreferenceProvider, useThemePreference } from '@/lib/theme-preference';

// Keep native splash visible until app is ready.
SplashScreen.preventAutoHideAsync();

function applyDefaultFontFamily(fontFamily: string) {
  const apply = (component: { defaultProps?: { style?: unknown } }) => {
    const previousStyle = component.defaultProps?.style;
    component.defaultProps = {
      ...component.defaultProps,
      style: [{ fontFamily }, previousStyle].filter(Boolean),
    };
  };

  apply(Text as unknown as { defaultProps?: { style?: unknown } });
  apply(TextInput as unknown as { defaultProps?: { style?: unknown } });
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard-400': require('../assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-500': require('../assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-600': require('../assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-700': require('../assets/fonts/Pretendard-Bold.ttf'),
  });
  const hasAppliedDefaultFont = useRef(false);

  useEffect(() => {
    if (!fontsLoaded || hasAppliedDefaultFont.current) {
      return;
    }

    applyDefaultFontFamily('Pretendard-400');
    hasAppliedDefaultFont.current = true;
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemePreferenceProvider>
      <KeyboardProvider>
        <RootNavigator />
      </KeyboardProvider>
    </ThemePreferenceProvider>
  );
}

function RootNavigator() {
  const { resolvedMode } = useThemePreference();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="auth/callback" />
      </Stack>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
