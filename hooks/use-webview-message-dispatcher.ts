import { useCallback } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebToAppMessageSchema } from '@sauhi/shared-contracts';
import type { SplashStage } from '@/components/splash-screen';
import type { RouteInfo, WebToAppMessage } from '@/lib/webview';

// ============================================================================
// Constants
// ============================================================================

const STRICT_BRIDGE_VALIDATION =
  process.env.EXPO_PUBLIC_STRICT_BRIDGE_VALIDATION !== 'false';

// ============================================================================
// Types
// ============================================================================

type ImagePickerRequest = Extract<WebToAppMessage, { type: 'REQUEST_IMAGE_PICKER' }>;

/**
 * 의미론적 콜백 API — 소비자의 내부 구현(setState 타입)을 드러내지 않음
 */
interface UseWebViewMessageDispatcherOptions {
  onRouteChange: (info: RouteInfo) => void;
  onOverlayChange: (hasOverlay: boolean, coversNav: boolean) => void;
  onPageRendered: () => void;
  onSplashStage: (stage: SplashStage) => void;
  onLogout: () => void | Promise<void>;
  onNativeLogin: () => void | Promise<void>;
  onImagePickerRequest: (payload: {
    requestId: ImagePickerRequest['requestId'];
    source: ImagePickerRequest['source'];
  }) => void | Promise<void>;
  onOpenSettings: () => void;
  onAuthMessage: (message: WebToAppMessage) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getMessageTypeHint(raw: string): string | null {
  try {
    const data = JSON.parse(raw) as { type?: unknown };
    return typeof data.type === 'string' ? data.type : null;
  } catch {
    return null;
  }
}

function parseWebMessage(raw: string): WebToAppMessage | null {
  try {
    const parsed = JSON.parse(raw);

    if (!STRICT_BRIDGE_VALIDATION) {
      return parsed as WebToAppMessage;
    }

    const result = WebToAppMessageSchema.safeParse(parsed);
    if (!result.success) {
      console.warn('[WebViewBridge][app] Dropped invalid inbound message', {
        type: getMessageTypeHint(raw),
        rawLength: raw.length,
        reason: result.error.issues[0]?.message,
      });
      return null;
    }

    return result.data as WebToAppMessage;
  } catch {
    if (STRICT_BRIDGE_VALIDATION) {
      console.warn('[WebViewBridge][app] Dropped malformed inbound JSON', {
        rawLength: raw.length,
      });
    }
    return null;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useWebViewMessageDispatcher({
  onRouteChange,
  onOverlayChange,
  onPageRendered,
  onSplashStage,
  onLogout,
  onNativeLogin,
  onImagePickerRequest,
  onOpenSettings,
  onAuthMessage,
}: UseWebViewMessageDispatcherOptions) {
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseWebMessage(event.nativeEvent.data);
      if (!message) return;

      switch (message.type) {
        case 'ROUTE_INFO':
          onRouteChange(message.payload);
          break;
        case 'OVERLAY_STATE':
          onOverlayChange(
            message.payload.hasOverlay,
            message.payload.coversNav ?? message.payload.hasOverlay,
          );
          break;
        case 'PAGE_RENDERED':
          onPageRendered();
          break;
        case 'LOGOUT':
          void onLogout();
          break;
        case 'REQUEST_LOGIN':
          void onNativeLogin();
          break;
        case 'OPEN_NATIVE_SETTINGS':
          onOpenSettings();
          break;
        case 'REQUEST_IMAGE_PICKER':
          void onImagePickerRequest({
            requestId: message.requestId,
            source: message.source,
          });
          break;
        case 'REQUEST_SESSION_REFRESH':
          onSplashStage('SESSION_SYNC');
          onAuthMessage(message);
          break;
        case 'WEB_READY':
        case 'SESSION_SET':
        case 'SESSION_EXPIRED':
          onAuthMessage(message);
          break;
      }
    },
    [
      onRouteChange,
      onOverlayChange,
      onPageRendered,
      onSplashStage,
      onLogout,
      onNativeLogin,
      onImagePickerRequest,
      onOpenSettings,
      onAuthMessage,
    ],
  );

  return { handleMessage };
}
