/**
 * 앱 인증 상태 관리 훅
 *
 * Native OAuth를 통해 Supabase 세션을 관리하고 WebView에 쿠키 세션을 설정합니다.
 *
 * 인증 흐름:
 * 1. 앱에서 Google OAuth 완료 → access_token, refresh_token 획득
 * 2. 웹에 SET_SESSION 명령 전송
 * 3. 웹이 /api/auth/session 호출하여 쿠키 설정
 * 4. 웹이 SESSION_SET 응답으로 완료 알림
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import WebView from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase/client';
import { WebToAppMessage } from '@/lib/webview';

// Expo AuthSession 웜업 (iOS에서 브라우저 세션 재사용)
WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[useAuth]';

// ============================================================================
// Types
// ============================================================================

interface UseAuthResult {
  /** 현재 세션 (null이면 미인증) */
  session: Session | null;
  /** 초기화 완료 여부 */
  isReady: boolean;
  /** 로그인 진행 중 여부 */
  isLoggingIn: boolean;
  /** 로그아웃 함수 */
  signOut: () => Promise<void>;
  /** 네이티브 Google OAuth 시작 */
  signInWithGoogle: () => Promise<void>;
  /** 웹에서 오는 메시지 처리 */
  handleWebMessage: (message: WebToAppMessage) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(webViewRef: React.RefObject<WebView | null>): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 웹 준비 상태 추적
  const webReadyRef = useRef(false);

  // 세션 설정 완료 대기 Promise resolver
  const sessionSetResolverRef = useRef<((success: boolean) => void) | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // WebView 세션 설정 함수
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * WebView에 세션 설정 명령을 전송합니다.
   */
  const sendSessionToWebView = useCallback(
    (accessToken: string, refreshToken: string): boolean => {
      if (!webViewRef.current) {
        console.log(`${LOG_PREFIX} WebView not ready, skipping session send`);
        return false;
      }

      const script = `
        (function() {
          try {
            const event = new CustomEvent('app-command', {
              detail: {
                type: 'SET_SESSION',
                access_token: ${JSON.stringify(accessToken)},
                refresh_token: ${JSON.stringify(refreshToken)}
              }
            });
            window.dispatchEvent(event);
          } catch (e) {
            console.error('[App→Web] SET_SESSION error:', e);
          }
        })();
        true;
      `;

      webViewRef.current.injectJavaScript(script);
      console.log(`${LOG_PREFIX} Session sent to WebView`);
      return true;
    },
    [webViewRef]
  );

  /**
   * WebView에 세션 삭제 명령을 전송합니다.
   */
  const clearSessionInWebView = useCallback(() => {
    if (!webViewRef.current) return;

    const script = `
      (function() {
        try {
          const event = new CustomEvent('app-command', {
            detail: { type: 'CLEAR_SESSION' }
          });
          window.dispatchEvent(event);
        } catch (e) {
          console.error('[App→Web] CLEAR_SESSION error:', e);
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(script);
    console.log(`${LOG_PREFIX} Session clear sent to WebView`);
  }, [webViewRef]);

  /**
   * 세션을 WebView에 전송하고 설정 완료를 대기합니다.
   */
  const syncSessionToWebView = useCallback(
    async (currentSession: Session | null): Promise<boolean> => {
      if (!currentSession) {
        clearSessionInWebView();
        return true;
      }

      return new Promise((resolve) => {
        // 이전 대기 중인 Promise가 있으면 취소
        if (sessionSetResolverRef.current) {
          sessionSetResolverRef.current(false);
        }

        // 타임아웃 설정
        const timeoutId = setTimeout(() => {
          sessionSetResolverRef.current = null;
          console.log(`${LOG_PREFIX} Session set timeout`);
          resolve(false);
        }, 5000);

        // resolver 저장
        sessionSetResolverRef.current = (success: boolean) => {
          clearTimeout(timeoutId);
          sessionSetResolverRef.current = null;
          resolve(success);
        };

        // 세션 전송
        const sent = sendSessionToWebView(
          currentSession.access_token,
          currentSession.refresh_token
        );

        if (!sent) {
          clearTimeout(timeoutId);
          sessionSetResolverRef.current = null;
          resolve(false);
        }
      });
    },
    [sendSessionToWebView, clearSessionInWebView]
  );

  /**
   * 세션을 갱신하고 WebView에 전달합니다.
   */
  const refreshAndSyncSession = useCallback(async () => {
    console.log(`${LOG_PREFIX} Refreshing session...`);

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error(`${LOG_PREFIX} Session refresh failed:`, error.message);
        return;
      }

      if (data.session) {
        console.log(`${LOG_PREFIX} Session refreshed, syncing to WebView`);
        await syncSessionToWebView(data.session);
      }
    } catch (e) {
      console.error(`${LOG_PREFIX} Session refresh error:`, e);
    }
  }, [syncSessionToWebView]);

  // ──────────────────────────────────────────────────────────────────────────
  // 웹에서 오는 메시지 핸들러
  // ──────────────────────────────────────────────────────────────────────────

  const handleWebMessage = useCallback(
    (message: WebToAppMessage) => {
      switch (message.type) {
        case 'WEB_READY':
          console.log(`${LOG_PREFIX} Web ready signal received`);
          webReadyRef.current = true;
          // 웹이 준비되면 현재 세션 전달
          if (session) {
            syncSessionToWebView(session);
          }
          break;

        case 'SESSION_SET':
          console.log(`${LOG_PREFIX} Session set confirmation:`, message.success);
          if (sessionSetResolverRef.current) {
            sessionSetResolverRef.current(message.success);
          }
          break;

        case 'REQUEST_SESSION_REFRESH':
          console.log(`${LOG_PREFIX} Session refresh requested from web`);
          refreshAndSyncSession();
          break;

        case 'SESSION_EXPIRED':
          console.log(`${LOG_PREFIX} Session expired notification from web`);
          // 앱에서도 세션 정리
          supabase.auth.signOut();
          break;
      }
    },
    [session, syncSessionToWebView, refreshAndSyncSession]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Native Google OAuth
  // ──────────────────────────────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoggingIn(true);
      console.log(`${LOG_PREFIX} Starting native Google OAuth...`);

      // Deep link redirect URI 생성
      const redirectTo = Linking.createURL('auth/callback');
      console.log(`${LOG_PREFIX} Redirect URI:`, redirectTo);

      // Supabase OAuth URL 생성
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.error(`${LOG_PREFIX} OAuth URL generation failed:`, error.message);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No OAuth URL returned');
      }

      console.log(`${LOG_PREFIX} Opening browser for OAuth...`);

      // 네이티브 브라우저에서 OAuth 진행
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        console.log(`${LOG_PREFIX} OAuth callback received`);

        // URL에서 토큰 추출
        const url = new URL(result.url);
        const params = new URLSearchParams(
          url.hash.startsWith('#') ? url.hash.substring(1) : url.search
        );

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log(`${LOG_PREFIX} Setting session from tokens...`);

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error(`${LOG_PREFIX} Session set failed:`, sessionError.message);
            throw sessionError;
          }

          console.log(`${LOG_PREFIX} Session established for:`, sessionData.user?.email);
        } else {
          // PKCE 흐름
          const code = params.get('code');
          if (code) {
            console.log(`${LOG_PREFIX} Exchanging code for session...`);
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error(`${LOG_PREFIX} Code exchange failed:`, exchangeError.message);
              throw exchangeError;
            }
          } else {
            console.error(`${LOG_PREFIX} No tokens or code in callback URL`);
          }
        }
      } else if (result.type === 'cancel') {
        console.log(`${LOG_PREFIX} OAuth cancelled by user`);
      } else {
        console.log(`${LOG_PREFIX} OAuth result:`, result.type);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} OAuth error:`, error);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 초기화 및 세션 구독
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // 1. 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsReady(true);
      console.log(`${LOG_PREFIX} Initial session:`, currentSession ? 'authenticated' : 'none');
    });

    // 2. 세션 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`${LOG_PREFIX} Auth state changed:`, event);
      setSession(newSession);

      // 세션 변경 시 WebView에 전달
      if (webReadyRef.current) {
        syncSessionToWebView(newSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncSessionToWebView]);

  // ──────────────────────────────────────────────────────────────────────────
  // 로그아웃
  // ──────────────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    console.log(`${LOG_PREFIX} Signing out...`);
    clearSessionInWebView();
    webReadyRef.current = false;
    await supabase.auth.signOut();
  }, [clearSessionInWebView]);

  return {
    session,
    isReady,
    isLoggingIn,
    signOut,
    signInWithGoogle,
    handleWebMessage,
  };
}
