/**
 * 앱 인증 상태 관리 훅
 *
 * Native OAuth를 통해 Supabase 세션을 관리하고 WebView에 토큰을 전달합니다.
 * expo-web-browser를 사용해 네이티브 브라우저에서 OAuth 진행 후
 * deep link로 토큰을 받아 SecureStore에 저장합니다.
 *
 * 개선된 토큰 전달 프로토콜:
 * 1. 앱 → 웹: SET_TOKEN (토큰 전달)
 * 2. 웹 → 앱: TOKEN_RECEIVED (수신 확인)
 * 3. 웹 → 앱: WEB_READY (웹 준비 완료 - 페이지 로드 후)
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
  /** WebView에 현재 토큰 전달 (강제 전달 옵션 포함) */
  syncTokenToWebView: (force?: boolean) => void;
  /** 토큰 갱신 후 WebView에 전달 */
  refreshAndSyncToken: () => Promise<void>;
  /** 웹에서 오는 메시지 처리 (WEB_READY, TOKEN_RECEIVED, REQUEST_TOKEN_REFRESH) */
  handleWebMessage: (message: WebToAppMessage) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(webViewRef: React.RefObject<WebView | null>): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 토큰 중복 전송 방지 (단, force 옵션으로 우회 가능)
  const lastSentTokenRef = useRef<string | null>(null);

  // 웹 준비 상태 추적
  const webReadyRef = useRef(false);

  // 토큰 수신 확인 대기 Promise resolver
  const tokenReceivedResolverRef = useRef<((success: boolean) => void) | null>(null);

  // ──────────────────────────────────────────────────────────────────────────
  // WebView 토큰 전달 함수들
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * WebView에 토큰을 전달합니다.
   * @param token - 전달할 토큰 (null이면 토큰 제거)
   * @param force - true면 중복 검사 무시하고 강제 전달
   * @returns 전달 성공 여부
   */
  const sendTokenToWebView = useCallback((token: string | null, force: boolean = false): boolean => {
    if (!webViewRef.current) {
      console.log(`${LOG_PREFIX} WebView not ready, skipping token send`);
      return false;
    }

    // 중복 전송 방지 (force가 아닌 경우)
    if (!force && lastSentTokenRef.current === token) {
      console.log(`${LOG_PREFIX} Same token, skipping (use force=true to override)`);
      return false;
    }

    lastSentTokenRef.current = token;

    const script = `
      (function() {
        try {
          const event = new CustomEvent('app-command', {
            detail: { type: 'SET_TOKEN', token: ${token ? JSON.stringify(token) : 'null'} }
          });
          window.dispatchEvent(event);
        } catch (e) {
          console.error('[App→Web] SET_TOKEN error:', e);
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(script);
    console.log(`${LOG_PREFIX} Token sent to WebView:`, token ? 'set' : 'cleared', force ? '(forced)' : '');
    return true;
  }, [webViewRef]);

  /**
   * WebView에 토큰을 전달하고 수신 확인을 대기합니다.
   * @param token - 전달할 토큰
   * @param timeout - 대기 시간 (ms)
   * @returns 수신 확인 성공 여부
   */
  const sendTokenAndWaitConfirmation = useCallback(async (
    token: string | null,
    timeout: number = 3000
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      // 이전 대기 중인 Promise가 있으면 취소
      if (tokenReceivedResolverRef.current) {
        tokenReceivedResolverRef.current(false);
      }

      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        tokenReceivedResolverRef.current = null;
        console.log(`${LOG_PREFIX} Token confirmation timeout`);
        resolve(false);
      }, timeout);

      // resolver 저장
      tokenReceivedResolverRef.current = (success: boolean) => {
        clearTimeout(timeoutId);
        tokenReceivedResolverRef.current = null;
        resolve(success);
      };

      // 토큰 전달
      const sent = sendTokenToWebView(token, true);
      if (!sent) {
        clearTimeout(timeoutId);
        tokenReceivedResolverRef.current = null;
        resolve(false);
      }
    });
  }, [sendTokenToWebView]);

  /**
   * WebView에 현재 세션 토큰을 동기화합니다. (수동 호출용)
   * @param force - true면 중복 검사 무시
   */
  const syncTokenToWebView = useCallback((force: boolean = false) => {
    sendTokenToWebView(session?.access_token ?? null, force);
  }, [session, sendTokenToWebView]);

  /**
   * 토큰을 갱신하고 WebView에 전달합니다.
   * 웹에서 REQUEST_TOKEN_REFRESH 요청 시 호출됩니다.
   */
  const refreshAndSyncToken = useCallback(async () => {
    console.log(`${LOG_PREFIX} Refreshing token...`);

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error(`${LOG_PREFIX} Token refresh failed:`, error.message);
        return;
      }

      if (data.session) {
        console.log(`${LOG_PREFIX} Token refreshed, syncing to WebView`);
        // 갱신된 토큰 강제 전달
        sendTokenToWebView(data.session.access_token, true);
      }
    } catch (e) {
      console.error(`${LOG_PREFIX} Token refresh error:`, e);
    }
  }, [sendTokenToWebView]);

  // ──────────────────────────────────────────────────────────────────────────
  // 웹에서 오는 메시지 핸들러 (index.tsx에서 호출용으로 export)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 웹에서 오는 메시지를 처리합니다.
   * 이 함수는 index.tsx의 handleMessage에서 호출됩니다.
   */
  const handleWebMessage = useCallback((message: WebToAppMessage) => {
    switch (message.type) {
      case 'WEB_READY':
        console.log(`${LOG_PREFIX} Web ready signal received`);
        webReadyRef.current = true;
        // 웹이 준비되면 현재 토큰 전달
        if (session?.access_token) {
          sendTokenToWebView(session.access_token, true);
        }
        break;

      case 'TOKEN_RECEIVED':
        console.log(`${LOG_PREFIX} Token received confirmation:`, message.success);
        if (tokenReceivedResolverRef.current) {
          tokenReceivedResolverRef.current(message.success ?? true);
        }
        break;

      case 'REQUEST_TOKEN_REFRESH':
        console.log(`${LOG_PREFIX} Token refresh requested from web`);
        refreshAndSyncToken();
        break;
    }
  }, [session, sendTokenToWebView, refreshAndSyncToken]);

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

      // 초기 세션이 있으면 WebView에 토큰 전달
      if (currentSession?.access_token) {
        sendTokenToWebView(currentSession.access_token, false);
      }
    });

    // 2. 세션 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(`${LOG_PREFIX} Auth state changed:`, event);
        setSession(newSession);

        // lastSentTokenRef 리셋 (새 세션이므로 토큰 재전달 허용)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          lastSentTokenRef.current = null;
        }

        // 세션 변경 시 WebView에 토큰 전달
        sendTokenToWebView(newSession?.access_token ?? null, true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [sendTokenToWebView]);

  // ──────────────────────────────────────────────────────────────────────────
  // 로그아웃
  // ──────────────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    console.log(`${LOG_PREFIX} Signing out...`);
    await supabase.auth.signOut();
    lastSentTokenRef.current = null;
    webReadyRef.current = false;
    sendTokenToWebView(null, true);
  }, [sendTokenToWebView]);

  return {
    session,
    isReady,
    isLoggingIn,
    signOut,
    signInWithGoogle,
    syncTokenToWebView,
    refreshAndSyncToken,
    handleWebMessage,
  };
}
