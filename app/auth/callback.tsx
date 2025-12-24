/**
 * OAuth 콜백 처리 라우트
 *
 * Google OAuth 완료 후 routiners://auth/callback으로 리다이렉트되면
 * 이 컴포넌트가 URL에서 토큰을 추출하고 세션을 설정합니다.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('[AuthCallback] Processing OAuth callback...');
        console.log('[AuthCallback] Params:', params);

        // URL에서 직접 파싱 (fragment 포함)
        const url = await Linking.getInitialURL();
        console.log('[AuthCallback] Full URL:', url);

        if (!url) {
          console.error('[AuthCallback] No URL found');
          router.replace('/');
          return;
        }

        // Fragment (#) 또는 Query (?) 파라미터에서 토큰 추출
        const urlObj = new URL(url);
        const hashParams = new URLSearchParams(
          urlObj.hash.startsWith('#') ? urlObj.hash.substring(1) : ''
        );
        const queryParams = new URLSearchParams(urlObj.search);

        // access_token과 refresh_token 찾기
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const code = hashParams.get('code') || queryParams.get('code');

        if (accessToken && refreshToken) {
          console.log('[AuthCallback] Setting session from tokens...');

          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[AuthCallback] Session set failed:', error.message);
          } else {
            console.log('[AuthCallback] Session established for:', data.user?.email);
          }
        } else if (code) {
          console.log('[AuthCallback] Exchanging code for session...');

          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[AuthCallback] Code exchange failed:', error.message);
          } else {
            console.log('[AuthCallback] Session established via code exchange');
          }
        } else {
          console.error('[AuthCallback] No tokens or code found in URL');
        }

        // 메인 화면으로 이동
        router.replace('/');
      } catch (error) {
        console.error('[AuthCallback] Error:', error);
        router.replace('/');
      }
    };

    handleCallback();
  }, []);

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
