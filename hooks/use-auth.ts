/**
 * 앱 인증 상태 관리 훅 (오케스트레이터)
 *
 * useSessionSync + useGoogleSignIn을 조합해
 * 세션 구독·초기화·메시지 처리를 담당합니다.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import type WebView from 'react-native-webview';
import { supabase } from '@/lib/supabase/client';
import type { WebToAppMessage } from '@/lib/webview';
import { useSessionSync } from './use-session-sync';
import { useGoogleSignIn } from './use-google-sign-in';

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[useAuth]';

/** 초기 세션 조회 타임아웃 (5초) */
const SESSION_INIT_TIMEOUT = 5000;

// ============================================================================
// Types
// ============================================================================

interface UseAuthResult {
  session: Session | null;
  isReady: boolean;
  isLoggingIn: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  handleWebMessage: (message: WebToAppMessage) => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(webViewRef: React.RefObject<WebView | null>): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  const webReadyRef = useRef(false);

  const { syncSession, clearSession, confirmSync, refreshAndSync, isSyncingRef } =
    useSessionSync(webViewRef);
  const { isLoggingIn, signInWithGoogle, googleSignOut } =
    useGoogleSignIn(syncSession, isSyncingRef);

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
          confirmSync(message.success);
          if (!message.success) {
            console.log(`${LOG_PREFIX} Session set failed, clearing local session...`);
            supabase.auth.signOut();
          }
          break;

        case 'REQUEST_SESSION_REFRESH':
          // 웹 쿠키 세션 만료/없음 → 앱에서 refresh 후 전송
          console.log(`${LOG_PREFIX} Session refresh requested from web`);
          webReadyRef.current = true;
          refreshAndSync();
          break;

        case 'SESSION_EXPIRED':
          console.log(`${LOG_PREFIX} Session expired notification from web`);
          supabase.auth.signOut();
          break;
      }
    },
    [confirmSync, refreshAndSync],
  );

  // ──────────────────────────────────────────────────────────────────────────
  // 초기화 및 세션 구독
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const sessionTimeout = setTimeout(() => {
      console.log(`${LOG_PREFIX} Session check timeout, proceeding without session`);
      setIsReady(true);
    }, SESSION_INIT_TIMEOUT);

    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        clearTimeout(sessionTimeout);
        setSession(currentSession);
        setIsReady(true);
        console.log(`${LOG_PREFIX} Initial session:`, currentSession ? 'authenticated' : 'none');
      })
      .catch((error) => {
        clearTimeout(sessionTimeout);
        console.error(`${LOG_PREFIX} Session check failed:`, error);
        setIsReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log(`${LOG_PREFIX} Auth state changed:`, event);
      setSession(newSession);

      // 세션 변경 시 WebView에 전달 (signInWithGoogle에서 이미 처리 중이면 스킵)
      if (webReadyRef.current && !isSyncingRef.current) {
        syncSession(newSession);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncSession, isSyncingRef]);

  // ──────────────────────────────────────────────────────────────────────────
  // 로그아웃
  // ──────────────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    console.log(`${LOG_PREFIX} Signing out...`);
    await googleSignOut();
    clearSession();
    webReadyRef.current = false;
    await supabase.auth.signOut();
  }, [googleSignOut, clearSession]);

  return { session, isReady, isLoggingIn, signOut, signInWithGoogle, handleWebMessage };
}
