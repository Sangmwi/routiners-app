import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme, COLORS } from '@/lib/theme';

// ============================================================================
// Types
// ============================================================================

export type SplashStage =
  | 'SESSION_CHECK'   // "로그인 정보 확인 중..."
  | 'WEBVIEW_LOAD'    // "페이지 로딩 중..."
  | 'SESSION_SYNC';   // "동기화 중..."

interface SplashScreenProps {
  stage?: SplashStage;
}

// ============================================================================
// Constants
// ============================================================================

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = 120;

const STAGE_MESSAGES: Record<SplashStage, string> = {
  SESSION_CHECK: '로그인 정보 확인 중...',
  WEBVIEW_LOAD: '페이지 로딩 중...',
  SESSION_SYNC: '동기화 중...',
};

// ============================================================================
// Component
// ============================================================================

export function SplashScreen({ stage = 'SESSION_CHECK' }: SplashScreenProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // 테마에 따른 블러 색상 및 tint 설정
  const blurColors = isDark
    ? {
        light: COLORS.primaryDarkLight,
        medium: COLORS.primaryDarkMedium,
        subtle: COLORS.primaryDarkSubtle,
      }
    : {
        light: COLORS.primaryLight,
        medium: COLORS.primaryMedium,
        subtle: COLORS.primarySubtle,
      };
  const blurTint = isDark ? 'dark' : 'light';

  // Animations
  const logoOpacity = useRef(new Animated.Value(0.7)).current;

  // Logo pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [logoOpacity]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background decorations with blur */}
      <View style={[styles.decoration, styles.decorationTopRight, { backgroundColor: blurColors.light }]}>
        <BlurView intensity={isDark ? 40 : 80} style={StyleSheet.absoluteFill} tint={blurTint} />
      </View>
      <View style={[styles.decoration, styles.decorationBottomLeft, { backgroundColor: blurColors.medium }]}>
        <BlurView intensity={isDark ? 40 : 80} style={StyleSheet.absoluteFill} tint={blurTint} />
      </View>
      <View style={[styles.decoration, styles.decorationCenter, { backgroundColor: blurColors.subtle }]}>
        <BlurView intensity={isDark ? 30 : 60} style={StyleSheet.absoluteFill} tint={blurTint} />
      </View>

      {/* Logo with pulse */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Brand name */}
      <Text style={[styles.brandName, { color: theme.text }]}>
        루티너스
      </Text>

      {/* 단계별 상태 메시지 */}
      <Text style={[styles.stageText, { color: theme.textMuted }]}>
        {STAGE_MESSAGES[stage]}
      </Text>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Background decorations with blur
  decoration: {
    position: 'absolute',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  decorationTopRight: {
    top: -80,
    right: -80,
    width: 200,
    height: 200,
  },
  decorationBottomLeft: {
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
  },
  decorationCenter: {
    top: height / 2 - 120,
    left: width / 2 - 120,
    width: 240,
    height: 240,
  },

  // Logo
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },

  // Text
  brandName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  stageText: {
    position: 'absolute',
    bottom: 100,
    fontSize: 14,
  },
});
