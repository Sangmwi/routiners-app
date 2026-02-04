import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

// 네이티브 스플래시 자동 숨김 방지 (React 마운트될 때까지 유지)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // RN 앱 마운트 직후 Expo 스플래시 숨김
    // React 스플래시가 이어받아서 단계별 메시지 표시
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
