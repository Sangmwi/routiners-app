import { useCallback, useState, type MutableRefObject } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import type { NativeModuleError } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase/client';

// ============================================================================
// Google Sign-In 설정 (모듈 로드 시 즉시 실행 — 싱글턴)
// ============================================================================

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  offlineAccess: true,
});

// ============================================================================
// Constants
// ============================================================================

const LOG_PREFIX = '[useGoogleSignIn]';

// ============================================================================
// Types
// ============================================================================

interface UseGoogleSignInReturn {
  isLoggingIn: boolean;
  signInWithGoogle: () => Promise<boolean>;
  googleSignOut: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * 네이티브 Google OAuth 전담 훅
 *
 * - signInWithGoogle: Google Sign-In UI 실행 → Supabase 세션 생성 → WebView 전달
 * - googleSignOut: Google 계정 로그아웃
 * - isLoggingIn: 로그인 진행 중 여부
 */
export function useGoogleSignIn(
  syncSession: (session: Session) => Promise<boolean>,
  isSyncingRef: MutableRefObject<boolean>,
): UseGoogleSignInReturn {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const signInWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoggingIn(true);
      console.log(`${LOG_PREFIX} Starting native Google Sign-In...`);

      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      const idToken = user.idToken;

      if (!idToken) {
        throw new Error('No idToken received from Google Sign-In');
      }

      console.log(`${LOG_PREFIX} Got idToken, exchanging with Supabase...`);
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
        isSyncingRef.current = true;
        try {
          await syncSession(data.session);
          console.log(`${LOG_PREFIX} Session synced`);
        } finally {
          isSyncingRef.current = false;
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
            break;
          default:
            console.error(`${LOG_PREFIX} Google Sign-In error:`, nativeError.code, nativeError.message);
        }
      } else {
        console.error(`${LOG_PREFIX} Unexpected error:`, error);
      }
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, [syncSession, isSyncingRef]);

  const googleSignOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      console.log(`${LOG_PREFIX} Google signOut error (ignored):`, e);
    }
  }, []);

  return { isLoggingIn, signInWithGoogle, googleSignOut };
}
