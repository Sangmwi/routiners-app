import React, { RefObject, useCallback, useState } from 'react';
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

export const useImagePicker = (webViewRef: RefObject<WebView | null>) => {
  const theme = useComponentTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [resolveRef, setResolveRef] = useState<((value: SourceSelection) => void) | null>(null);

  const sendResult = useCallback(
    (requestId: string, result: ImagePickerResult) => {
      WebViewBridge.sendImagePickerResult(webViewRef, requestId, result);
    },
    [webViewRef],
  );

  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }, []);

  const requestGalleryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }, []);

  const launchCamera = useCallback(async (): Promise<ImagePickerResult> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return { success: false, error: '카메라 권한이 필요합니다.' };
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
      exif: false,
    });

    if (result.canceled) {
      return { success: false, cancelled: true };
    }

    const asset = result.assets[0];
    return {
      success: true,
      base64: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : undefined,
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    };
  }, [requestCameraPermission]);

  const launchGallery = useCallback(async (): Promise<ImagePickerResult> => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      return { success: false, error: '갤러리 접근 권한이 필요합니다.' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
      base64: true,
      exif: false,
    });

    if (result.canceled) {
      return { success: false, cancelled: true };
    }

    const asset = result.assets[0];
    return {
      success: true,
      base64: asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : undefined,
      uri: asset.uri,
      mimeType: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName || `image_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    };
  }, [requestGalleryPermission]);

  const showSourcePicker = useCallback((): Promise<SourceSelection> => {
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
      setSheetVisible(true);
    });
  }, []);

  const handleSelect = useCallback(
    (source: SourceSelection) => {
      if (!resolveRef) return;
      setSheetVisible(false);
      resolveRef(source);
      setResolveRef(null);
    },
    [resolveRef],
  );

  const handleImagePickerRequest = useCallback(
    async (request: ImagePickerRequest) => {
      const { requestId, source } = request;

      try {
        let result: ImagePickerResult;

        if (source === 'camera') {
          result = await launchCamera();
        } else if (source === 'gallery') {
          result = await launchGallery();
        } else {
          const selectedSource = await showSourcePicker();

          if (selectedSource === 'cancel') {
            sendResult(requestId, { success: false, cancelled: true });
            return;
          }

          result = selectedSource === 'camera' ? await launchCamera() : await launchGallery();
        }

        sendResult(requestId, result);
      } catch (error) {
        sendResult(requestId, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [launchCamera, launchGallery, showSourcePicker, sendResult],
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
