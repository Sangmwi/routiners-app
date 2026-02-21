/**
 * OAuth 콜백 처리 라우트
 *
 * Google OAuth 완료 후 routiners://auth/callback으로 리다이렉트되면
 * 이 컴포넌트가 URL에서 토큰을 추출하고 세션을 설정합니다.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Processing OAuth callback...');

        // use-auth.ts의 WebBrowser.openAuthSessionAsync에서 이미 토큰을 처리했을 수 있음
        // 이 경우 세션이 이미 설정되어 있으므로 바로 홈으로 이동
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('[AuthCallback] Session already exists, redirecting to home');
          router.replace('/');
          return;
        }

        // 세션이 없는 경우에만 URL에서 토큰 파싱 시도
        const url = await Linking.getInitialURL();
        console.log('[AuthCallback] URL:', url);

        if (!url) {
          console.log('[AuthCallback] No URL, redirecting to home');
          router.replace('/');
          return;
        }

        // Fragment (#) 또는 Query (?) 파라미터에서 토큰 추출
        const urlObj = new URL(url);
        const hashParams = new URLSearchParams(
          urlObj.hash.startsWith('#') ? urlObj.hash.substring(1) : ''
        );
        const queryParams = new URLSearchParams(urlObj.search);

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const code = hashParams.get('code') || queryParams.get('code');

        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Setting session from tokens...');
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else if (code) {
          console.log('[AuthCallback] Exchanging code for session...');
          await supabase.auth.exchangeCodeForSession(code);
        } else {
          console.log('[AuthCallback] No tokens/code found, session may already be set');
        }

        router.replace('/');
      } catch (error) {
        console.error('[AuthCallback] Error:', error);
        router.replace('/');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0ea5e9" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
