import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';

import { getInitialUrl, getLoginUrl } from '@/lib/webview';

// ============================================================================
// Types
// ============================================================================

type UseInitialUrlResult = {
  url: string;
  setUrl: (url: string) => void;
  isUrlInitialized: boolean;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * 세션 로드 완료 후 초기 URL 결정
 * - 세션이 있으면 / (홈) → 웹에서 쿠키 확인 후 필요시 REQUEST_SESSION_REFRESH
 * - 없으면 /login
 */
export function useInitialUrl(
  session: Session | null,
  isReady: boolean
): UseInitialUrlResult {
  const [url, setUrl] = useState(getInitialUrl);
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);

  useEffect(() => {
    if (isReady && !isUrlInitialized) {
      setIsUrlInitialized(true);
      // 세션이 있으면 홈(/)으로 바로 이동
      // 웹에서 쿠키 세션 확인 후 유효하면 WEB_READY, 만료면 REQUEST_SESSION_REFRESH
      const startUrl = session ? getInitialUrl() : getLoginUrl();
      console.log('[WebView] Session ready, starting with:', session ? 'home' : 'login');
      setUrl(startUrl);
    }
  }, [isReady, session, isUrlInitialized]);

  return { url, setUrl, isUrlInitialized };
}
