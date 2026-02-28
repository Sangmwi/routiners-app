import { useCallback, useRef, type MutableRefObject, type RefObject } from 'react';
import type { Session } from '@supabase/supabase-js';
import type WebView from 'react-native-webview';
import { supabase } from '@/lib/supabase/client';
import { WebViewBridge } from '@/lib/webview';

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[useSessionSync]';

/** SESSION_SET 응답 대기 타임아웃 (5초) */
const SESSION_SET_TIMEOUT = 5000;

// ============================================================================
// Types
// ============================================================================

interface UseSessionSyncReturn {
  syncSession: (session: Session | null) => Promise<boolean>;
  clearSession: () => void;
  confirmSync: (success: boolean) => void;
  refreshAndSync: () => Promise<void>;
  isSyncingRef: MutableRefObject<boolean>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * WebView 세션 동기화 전담 훅
 *
 * - syncSession: 세션을 WebView에 전송하고 SESSION_SET 확인 대기
 * - clearSession: WebView 세션 삭제 명령 전송
 * - confirmSync: SESSION_SET 메시지 수신 시 대기 중인 Promise 해소
 * - refreshAndSync: Supabase 세션 갱신 후 WebView에 전달
 * - isSyncingRef: 동기화 진행 중 플래그 (외부 훅과 공유)
 */
export function useSessionSync(webViewRef: RefObject<WebView | null>): UseSessionSyncReturn {
  const resolverRef = useRef<((success: boolean) => void) | null>(null);
  const isSyncingRef = useRef(false);

  const clearSession = useCallback(() => {
    if (!webViewRef.current) return;
    WebViewBridge.clearSession(webViewRef);
    console.log(`${LOG_PREFIX} Session clear sent to WebView`);
  }, [webViewRef]);

  const syncSession = useCallback(
    async (session: Session | null): Promise<boolean> => {
      if (!session) {
        clearSession();
        return true;
      }

      return new Promise((resolve) => {
        // 이전 대기 중인 Promise가 있으면 취소
        if (resolverRef.current) {
          resolverRef.current(false);
        }

        // 타임아웃 설정 (낙관적 처리 — 웹이 이미 리다이렉트했을 수 있음)
        const timeoutId = setTimeout(() => {
          resolverRef.current = null;
          console.log(`${LOG_PREFIX} Session set timeout (${SESSION_SET_TIMEOUT}ms)`);
          resolve(true);
        }, SESSION_SET_TIMEOUT);

        resolverRef.current = (success: boolean) => {
          clearTimeout(timeoutId);
          resolverRef.current = null;
          resolve(success);
        };

        if (!webViewRef.current) {
          clearTimeout(timeoutId);
          resolverRef.current = null;
          console.log(`${LOG_PREFIX} WebView not ready, skipping session send`);
          resolve(false);
          return;
        }

        WebViewBridge.setSession(webViewRef, session.access_token, session.refresh_token);
        console.log(`${LOG_PREFIX} Session sent to WebView`);
      });
    },
    [clearSession, webViewRef],
  );

  const confirmSync = useCallback((success: boolean) => {
    resolverRef.current?.(success);
  }, []);

  const refreshAndSync = useCallback(async () => {
    console.log(`${LOG_PREFIX} Refreshing session...`);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        console.error(`${LOG_PREFIX} Session refresh failed:`, error?.message);
        clearSession();
        await supabase.auth.signOut();
        return;
      }
      console.log(`${LOG_PREFIX} Session refreshed, syncing to WebView`);
      await syncSession(data.session);
    } catch (e) {
      console.error(`${LOG_PREFIX} Session refresh error:`, e);
      clearSession();
      await supabase.auth.signOut();
    }
  }, [syncSession, clearSession]);

  return { syncSession, clearSession, confirmSync, refreshAndSync, isSyncingRef };
}
