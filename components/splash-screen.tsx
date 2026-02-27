import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';
import { pretendard } from '@/lib/typography';
import LogoFill from '@/assets/logos/brand/logo-fill.svg';

export type SplashStage =
  | 'SESSION_CHECK'
  | 'WEBVIEW_LOAD'
  | 'SESSION_SYNC';

interface SplashScreenProps {
  stage?: SplashStage;
}

const { layout } = THEME_TOKENS;
const LOGO_SIZE = 120;

const STAGE_MESSAGES: Record<SplashStage, string> = {
  SESSION_CHECK: '로그인 정보를 확인하고 있어요.',
  WEBVIEW_LOAD: '페이지를 불러오는 중입니다.',
  SESSION_SYNC: '세션을 동기화하고 있어요.',
};

export function SplashScreen({ stage = 'SESSION_CHECK' }: SplashScreenProps) {
  const theme = useComponentTheme();
  const logoOpacity = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0.72,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [logoOpacity]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}> 
        <LogoFill width={LOGO_SIZE} height={LOGO_SIZE} />
      </Animated.View>

      <Text style={[styles.brandName, { color: theme.text }]}>루티너스</Text>
      <Text style={[styles.stageText, { color: theme.textMuted }]}>{STAGE_MESSAGES[stage]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.space[24],
  },
  logoContainer: {
    marginBottom: layout.space[12],
  },
  brandName: {
    ...pretendard(700),
    fontSize: 24,
    letterSpacing: -0.2,
  },
  stageText: {
    ...pretendard(500),
    marginTop: layout.space[6],
    fontSize: layout.typography.caption,
    textAlign: 'center',
  },
});