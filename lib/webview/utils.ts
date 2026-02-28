import { IS_DEV_ANDROID, TAB_ROUTES } from './constants';

// ============================================================================
// URL Transformation
// ============================================================================

/** localhost를 Android 에뮬레이터용 10.0.2.2로 변환 */
export const toEmulatorUrl = (url: string): string =>
  IS_DEV_ANDROID ? url.replace('localhost', '10.0.2.2') : url;

/** URL에 localhost가 포함되어 있고 개발 환경인지 확인 */
export const hasLocalhost = (url: string): boolean =>
  IS_DEV_ANDROID && url.includes('localhost');

/** URL에서 pathname 추출 */
export const extractPath = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return '/';
  }
};

// ============================================================================
// Tab Navigation
// ============================================================================

/** 현재 경로에 해당하는 활성 탭 라우트를 반환 */
export function getActiveTab(path: string): (typeof TAB_ROUTES)[number] {
  if (path === '/') return '/';
  return (
    TAB_ROUTES.find((tab) => tab !== '/' && (path === tab || path.startsWith(`${tab}/`))) ?? '/'
  );
}

