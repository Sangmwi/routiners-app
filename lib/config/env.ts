/**
 * 환경변수 관리 유틸리티
 * 
 * Expo에서는 EXPO_PUBLIC_ 접두사가 붙은 환경변수만 클라이언트에서 접근 가능합니다.
 */

// 환경변수 타입 정의
export interface AppConfig {
  webviewUrl: string;
  supabaseUrl?: string;
  supabasePublishableKey?: string;
  apiUrl?: string;
}

/**
 * 앱 설정 가져오기
 * 환경변수에서 값을 읽어옵니다.
 */
export function getAppConfig(): AppConfig {
  return {
    webviewUrl: process.env.EXPO_PUBLIC_WEBVIEW_URL || 'https://www.google.com',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  };
}

/**
 * 개발 환경 여부
 */
export const IS_DEV = __DEV__;

/**
 * 프로덕션 환경 여부
 */
export const IS_PRODUCTION = !__DEV__;


