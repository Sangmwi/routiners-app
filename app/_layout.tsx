import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';

// 네이티브 스플래시 자동 숨김 방지 (React 스플래시 렌더링 완료까지 유지)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // hideAsync()는 index.tsx에서 React 스플래시 렌더링 완료 후 호출
  // (흰 화면 깜빡임 방지)

  return (
    <KeyboardProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="auto" />
    </KeyboardProvider>
  );
}
