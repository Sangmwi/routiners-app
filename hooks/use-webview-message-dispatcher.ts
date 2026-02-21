import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { WebViewMessageEvent } from 'react-native-webview';
import type { SplashStage } from '@/components/splash-screen';
import type { RouteInfo, WebToAppMessage } from '@/lib/webview';

type ImagePickerRequest = Extract<WebToAppMessage, { type: 'REQUEST_IMAGE_PICKER' }>;

interface UseWebViewMessageDispatcherOptions {
  setRouteInfo: Dispatch<SetStateAction<RouteInfo>>;
  setCanHideSplash: Dispatch<SetStateAction<boolean>>;
  setSplashStage: Dispatch<SetStateAction<SplashStage>>;
  handleLogout: () => void | Promise<void>;
  handleNativeLogin: () => void | Promise<void>;
  handleImagePickerRequest: (payload: {
    requestId: ImagePickerRequest['requestId'];
    source: ImagePickerRequest['source'];
  }) => void | Promise<void>;
  handleWebMessage: (message: WebToAppMessage) => void;
}

function parseWebMessage(raw: string): WebToAppMessage | null {
  try {
    return JSON.parse(raw) as WebToAppMessage;
  } catch {
    return null;
  }
}

export function useWebViewMessageDispatcher({
  setRouteInfo,
  setCanHideSplash,
  setSplashStage,
  handleLogout,
  handleNativeLogin,
  handleImagePickerRequest,
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
        case 'PAGE_RENDERED':
          setCanHideSplash(true);
          break;
        case 'LOGOUT':
          void handleLogout();
          break;
        case 'REQUEST_LOGIN':
          void handleNativeLogin();
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
      handleWebMessage,
      setCanHideSplash,
      setRouteInfo,
      setSplashStage,
    ],
  );

  return { handleMessage };
}
