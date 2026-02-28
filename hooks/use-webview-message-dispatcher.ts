import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebToAppMessageSchema } from '@sauhi/shared-contracts';
import type { SplashStage } from '@/components/splash-screen';
import type { RouteInfo, WebToAppMessage } from '@/lib/webview';

type ImagePickerRequest = Extract<WebToAppMessage, { type: 'REQUEST_IMAGE_PICKER' }>;

interface UseWebViewMessageDispatcherOptions {
  setRouteInfo: Dispatch<SetStateAction<RouteInfo>>;
  setHasOverlay: Dispatch<SetStateAction<boolean>>;
  setCanHideSplash: Dispatch<SetStateAction<boolean>>;
  setSplashStage: Dispatch<SetStateAction<SplashStage>>;
  handleLogout: () => void | Promise<void>;
  handleNativeLogin: () => void | Promise<void>;
  handleImagePickerRequest: (payload: {
    requestId: ImagePickerRequest['requestId'];
    source: ImagePickerRequest['source'];
  }) => void | Promise<void>;
  handleOpenNativeSettings: () => void;
  handleWebMessage: (message: WebToAppMessage) => void;
}

const STRICT_BRIDGE_VALIDATION =
  process.env.EXPO_PUBLIC_STRICT_BRIDGE_VALIDATION !== 'false';

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

export function useWebViewMessageDispatcher({
  setRouteInfo,
  setHasOverlay,
  setCanHideSplash,
  setSplashStage,
  handleLogout,
  handleNativeLogin,
  handleImagePickerRequest,
  handleOpenNativeSettings,
  handleWebMessage,
}: UseWebViewMessageDispatcherOptions) {
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseWebMessage(event.nativeEvent.data);
      if (!message) return;

      switch (message.type) {
        case 'ROUTE_INFO':
          setRouteInfo(message.payload);
          break;
        case 'OVERLAY_STATE':
          setHasOverlay(message.payload.hasOverlay);
          break;
        case 'PAGE_RENDERED':
          setCanHideSplash(true);
          break;
        case 'LOGOUT':
          void handleLogout();
          break;
        case 'REQUEST_LOGIN':
          void handleNativeLogin();
          break;
        case 'OPEN_NATIVE_SETTINGS':
          handleOpenNativeSettings();
          break;
        case 'REQUEST_IMAGE_PICKER':
          void handleImagePickerRequest({
            requestId: message.requestId,
            source: message.source,
          });
          break;
        case 'REQUEST_SESSION_REFRESH':
          setSplashStage('SESSION_SYNC');
          handleWebMessage(message);
          break;
        case 'WEB_READY':
        case 'SESSION_SET':
        case 'SESSION_EXPIRED':
          handleWebMessage(message);
          break;
      }
    },
    [
      handleImagePickerRequest,
      handleLogout,
      handleNativeLogin,
      handleOpenNativeSettings,
      handleWebMessage,
      setCanHideSplash,
      setHasOverlay,
      setRouteInfo,
      setSplashStage,
    ],
  );

  return { handleMessage };
}
