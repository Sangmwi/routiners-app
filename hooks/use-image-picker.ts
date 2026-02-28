import React, { RefObject, useCallback, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import type { WebView } from 'react-native-webview';
import ActionSheet, { ActionSheetOption } from '@/components/ui/ActionSheet';
import { AppIcons } from '@/lib/icon';
import { useComponentTheme } from '@/lib/theme';
import { WebViewBridge, type ImagePickerResult, type ImagePickerSource } from '@/lib/webview';

type ImagePickerRequest = {
  requestId: string;
  source: ImagePickerSource;
};

type SourceSelection = 'camera' | 'gallery' | 'cancel';

// ============================================================================
// Hook
// ============================================================================

export const useImagePicker = (webViewRef: RefObject<WebView | null>) => {
  const theme = useComponentTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const resolverRef = useRef<((value: SourceSelection) => void) | null>(null);

  // expo-image-picker 17.x (Expo SDK 54)에서 ActivityResultLauncher 등록 방식이 변경됨.
  // 모듈 레벨 requestCameraPermissionsAsync/requestMediaLibraryPermissionsAsync 호출 시
  // 권한 Activity 전환 이후 launch 계약 런처가 등록 해제되는 버그가 있음.
  // hook 기반 API를 사용하면 생명주기를 인식하여 런처 상태를 올바르게 유지함.
  const [, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [, requestLibraryPermission] = ImagePicker.useMediaLibraryPermissions();

  async function launchImageSource(type: 'camera' | 'gallery'): Promise<ImagePickerResult> {
    const isCamera = type === 'camera';

    const permissionResult = isCamera
      ? await requestCameraPermission()
      : await requestLibraryPermission();

    if (!permissionResult.granted) {
      return {
        success: false,
        error: isCamera ? '카메라 권한이 필요합니다.' : '갤러리 접근 권한이 필요합니다.',
      };
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
      exif: false,
    };

    const result = isCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) return { success: false, cancelled: true };

    const asset = result.assets[0];
    return {
      success: true,
      base64: asset.base64
        ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
        : undefined,
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'image/jpeg',
      fileName: asset.fileName ?? `${isCamera ? 'photo' : 'image'}_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    };
  }

  const sendResult = useCallback(
    (requestId: string, result: ImagePickerResult) => {
      WebViewBridge.sendImagePickerResult(webViewRef, requestId, result);
    },
    [webViewRef],
  );

  const showSourcePicker = useCallback((): Promise<SourceSelection> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setSheetVisible(true);
    });
  }, []);

  const handleSelect = useCallback((source: SourceSelection) => {
    setSheetVisible(false);
    resolverRef.current?.(source);
    resolverRef.current = null;
  }, []);

  const handleImagePickerRequest = useCallback(
    async (request: ImagePickerRequest) => {
      const { requestId, source } = request;

      try {
        let result: ImagePickerResult;

        if (source === 'camera') {
          result = await launchImageSource('camera');
        } else if (source === 'gallery') {
          result = await launchImageSource('gallery');
        } else {
          const selectedSource = await showSourcePicker();

          if (selectedSource === 'cancel') {
            sendResult(requestId, { success: false, cancelled: true });
            return;
          }

          result = await launchImageSource(selectedSource);
        }

        sendResult(requestId, result);
      } catch (error) {
        sendResult(requestId, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [showSourcePicker, sendResult],
  );

  const sheetOptions: ActionSheetOption[] = [
    {
      label: '카메라로 촬영',
      icon: React.createElement(AppIcons.camera, {
        size: 22,
        color: theme.text,
        weight: 'regular',
      }),
      onPress: () => handleSelect('camera'),
    },
    {
      label: '앨범에서 선택',
      icon: React.createElement(AppIcons.image, {
        size: 22,
        color: theme.text,
        weight: 'regular',
      }),
      onPress: () => handleSelect('gallery'),
    },
  ];

  const ImagePickerSheet = React.createElement(ActionSheet, {
    visible: sheetVisible,
    onClose: () => handleSelect('cancel'),
    title: '사진 선택',
    message: '사진을 어떻게 가져올까요?',
    options: sheetOptions,
    cancelText: '취소',
  });

  return {
    handleImagePickerRequest,
    ImagePickerSheet,
  };
};
