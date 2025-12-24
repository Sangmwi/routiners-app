/**
 * 앱 인증 상태 관리 훅
 *
 * Supabase 세션을 모니터링하고 WebView에 토큰을 전달합니다.
 * 세션 변경 시 WebView에 SET_TOKEN 명령을 보냅니다.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import WebView from 'react-native-webview';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// Types
// ============================================================================

interface UseAuthResult {
  /** 현재 세션 (null이면 미인증) */
  session: Session | null;
  /** 초기화 완료 여부 */
  isReady: boolean;
  /** 로그아웃 함수 */
  signOut: () => Promise<void>;
  /** WebView에 현재 토큰 전달 */
  syncTokenToWebView: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth(webViewRef: React.RefObject<WebView | null>): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lastTokenRef = useRef<string | null>(null);

  // WebView에 토큰 전달
  const sendTokenToWebView = useCallback((token: string | null) => {
    if (!webViewRef.current) return;

    // 토큰이 변경되지 않았으면 스킵
    if (lastTokenRef.current === token) return;
    lastTokenRef.current = token;

    const script = `
      (function() {
        const event = new CustomEvent('app-command', {
          detail: { type: 'SET_TOKEN', token: ${token ? JSON.stringify(token) : 'null'} }
        });
        window.dispatchEvent(event);
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(script);
    console.log('[useAuth] Token synced to WebView:', token ? 'set' : 'cleared');
  }, [webViewRef]);

  // WebView에 현재 토큰 동기화 (수동 호출용)
  const syncTokenToWebView = useCallback(() => {
    sendTokenToWebView(session?.access_token ?? null);
  }, [session, sendTokenToWebView]);

  // 초기 세션 로드 및 변경 구독
  useEffect(() => {
    // 1. 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true);
      console.log('[useAuth] Initial session:', session ? 'authenticated' : 'none');
    });

    // 2. 세션 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('[useAuth] Auth state changed:', _event);
        setSession(session);

        // 세션 변경 시 WebView에 토큰 전달
        sendTokenToWebView(session?.access_token ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [sendTokenToWebView]);

  // 로그아웃
  const signOut = useCallback(async () => {
    console.log('[useAuth] Signing out...');
    await supabase.auth.signOut();
    sendTokenToWebView(null);
  }, [sendTokenToWebView]);

  return {
    session,
    isReady,
    signOut,
    syncTokenToWebView,
  };
}
