/**
 * 앱 인증 상태 관리 훅
 *
 * @react-native-google-signin을 사용한 네이티브 Google Sign-In으로
 * Supabase 세션을 관리하고 WebView에 쿠키 세션을 설정합니다.
 *
 * 인증 흐름:
 * 1. 네이티브 Google Sign-In → idToken 획득
 * 2. Supabase signInWithIdToken으로 세션 생성
 * 3. 웹에 SET_SESSION 명령 전송
 * 4. 웹이 /api/auth/session 호출하여 쿠키 설정
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import WebView from 'react-native-webview';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import type { NativeModuleError } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase/client';
import { WebToAppMessage, WebViewBridge } from '@/lib/webview';

// ============================================================================
// Google Sign-In 설정
// ============================================================================

// Google Cloud Console에서 발급받은 Web Client ID
// Android/iOS 앱에서도 Web Client ID를 사용해야 Supabase와 호환됩니다
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// 초기화 플래그 (한 번만 configure 호출)
let isGoogleSignInConfigured = false;

function configureGoogleSignIn() {
  if (isGoogleSignInConfigured) return;

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
  });

  isGoogleSignInConfigured = true;
}

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[useAuth]';

/** SESSION_SET 응답 대기 타임아웃 (5초) */
const SESSION_SET_TIMEOUT = 5000;

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
  /** 네이티브 Google OAuth 시작 (성공: true, 취소/중복: false) */
  signInWithGoogle: () => Promise<boolean>;
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

  // 세션 동기화 진행 중 플래그 (중복 방지)
  const sessionSyncingRef = useRef(false);

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

      WebViewBridge.setSession(webViewRef, accessToken, refreshToken);
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

    WebViewBridge.clearSession(webViewRef);
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

        // 타임아웃 설정 (5초)
        const timeoutId = setTimeout(() => {
          sessionSetResolverRef.current = null;
          console.log(`${LOG_PREFIX} Session set timeout (${SESSION_SET_TIMEOUT}ms)`);
          // 타임아웃 시에도 true로 resolve (낙관적 처리)
          // 웹이 이미 리다이렉트했을 수 있으므로 흐름 계속 진행
          resolve(true);
        }, SESSION_SET_TIMEOUT);

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
   * 실패 시 세션을 정리하고 로그인 페이지로 이동합니다.
   */
  const refreshAndSyncSession = useCallback(async () => {
    console.log(`${LOG_PREFIX} Refreshing session...`);

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.error(`${LOG_PREFIX} Session refresh failed:`, error?.message);
        // refresh 실패 → 웹에 CLEAR_SESSION 전송 + 앱 세션 정리
        clearSessionInWebView();
        await supabase.auth.signOut();
        return;
      }

      console.log(`${LOG_PREFIX} Session refreshed, syncing to WebView`);
      await syncSessionToWebView(data.session);
    } catch (e) {
      console.error(`${LOG_PREFIX} Session refresh error:`, e);
      // 에러 시 세션 정리
      clearSessionInWebView();
      await supabase.auth.signOut();
    }
  }, [syncSessionToWebView, clearSessionInWebView]);

  // ──────────────────────────────────────────────────────────────────────────
  // 웹에서 오는 메시지 핸들러
  // ──────────────────────────────────────────────────────────────────────────

  const handleWebMessage = useCallback(
    (message: WebToAppMessage) => {
      switch (message.type) {
        case 'WEB_READY':
          // 웹이 쿠키 세션 유효 확인 후 전송 → 세션 전송 불필요
          console.log(`${LOG_PREFIX} Web ready (cookie session valid)`);
          webReadyRef.current = true;
          break;

        case 'SESSION_SET':
          console.log(`${LOG_PREFIX} Session set confirmation:`, message.success);
          if (sessionSetResolverRef.current) {
            sessionSetResolverRef.current(message.success);
          }
          // 네비게이션은 웹에서 처리 (window.location.replace)
          // 앱에서는 세션 실패 시 토큰 정리만
          if (!message.success) {
            console.log(`${LOG_PREFIX} Session set failed, clearing local session...`);
            supabase.auth.signOut();
          }
          break;

        case 'REQUEST_SESSION_REFRESH':
          // 웹 쿠키 세션 만료/없음 → 앱에서 refresh 후 전송
          console.log(`${LOG_PREFIX} Session refresh requested from web`);
          webReadyRef.current = true;
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
  // Native Google Sign-In (signInWithIdToken 방식)
  // ──────────────────────────────────────────────────────────────────────────

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoggingIn(true);
      console.log(`${LOG_PREFIX} Starting native Google Sign-In...`);

      // Google Play Services 확인
      await GoogleSignin.hasPlayServices();

      // 네이티브 Google Sign-In UI 실행 (v11: 직접 User 반환)
      const user = await GoogleSignin.signIn();
      const idToken = user.idToken;

      if (!idToken) {
        throw new Error('No idToken received from Google Sign-In');
      }

      console.log(`${LOG_PREFIX} Got idToken, exchanging with Supabase...`);

      // Supabase에 idToken 전달하여 세션 생성
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error(`${LOG_PREFIX} Supabase signInWithIdToken failed:`, error.message);
        throw error;
      }

      console.log(`${LOG_PREFIX} Session established for:`, data.user?.email);

      // onAuthStateChange보다 먼저 직접 WebView에 세션 전달 (race condition 방지)
      if (data.session) {
        console.log(`${LOG_PREFIX} Syncing session to WebView...`);
        sessionSyncingRef.current = true;
        try {
          // 세션 전달 → SESSION_SET 응답 수신 → 앱에서 네비게이션 처리
          // (웹에서 네비게이션하면 Preview 환경에서 메시지 손실 발생)
          await syncSessionToWebView(data.session);
          console.log(`${LOG_PREFIX} Session synced, app will handle navigation on SESSION_SET`);
        } finally {
          sessionSyncingRef.current = false;
        }
      }

      return true;

    } catch (error) {
      const nativeError = error as NativeModuleError;
      if (nativeError.code) {
        switch (nativeError.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log(`${LOG_PREFIX} User cancelled the sign-in`);
            return false;
          case statusCodes.IN_PROGRESS:
            console.log(`${LOG_PREFIX} Sign-in already in progress`);
            return false;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.error(`${LOG_PREFIX} Play Services not available`);
            break;  // 에러로 처리
          default:
            console.error(`${LOG_PREFIX} Google Sign-In error:`, nativeError.code, nativeError.message);
        }
      } else {
        console.error(`${LOG_PREFIX} Unexpected error:`, error);
      }
      throw error;  // 실제 에러만 throw
    } finally {
      setIsLoggingIn(false);
    }
  }, [syncSessionToWebView]);

  // ──────────────────────────────────────────────────────────────────────────
  // 초기화 및 세션 구독
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Google Sign-In 초기화 (앱 마운트 후 실행)
    configureGoogleSignIn();

    // 1. 현재 세션 가져오기 (5초 타임아웃)
    const sessionTimeout = setTimeout(() => {
      console.log(`${LOG_PREFIX} Session check timeout, proceeding without session`);
      setIsReady(true);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      clearTimeout(sessionTimeout);
      setSession(currentSession);
      setIsReady(true);
      console.log(`${LOG_PREFIX} Initial session:`, currentSession ? 'authenticated' : 'none');
    }).catch((error) => {
      clearTimeout(sessionTimeout);
      console.error(`${LOG_PREFIX} Session check failed:`, error);
      setIsReady(true);
    });

    // 2. 세션 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`${LOG_PREFIX} Auth state changed:`, event);
      setSession(newSession);

      // 세션 변경 시 WebView에 전달 (signInWithGoogle에서 이미 처리 중이면 스킵)
      if (webReadyRef.current && !sessionSyncingRef.current) {
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

    // Google Sign-In 로그아웃
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.log(`${LOG_PREFIX} Google signOut error (ignored):`, e);
    }

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
