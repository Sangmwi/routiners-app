/**
 * Expo Config Plugin: WebView File Upload Fix
 *
 * Android WebView에서 content:// URI의 임시 읽기 권한 만료 문제를 해결합니다.
 * 빌드 시점에 react-native-webview의 Android 코드를 패치하여
 * 파일 선택 결과를 앱 캐시로 복사한 후 WebView에 전달합니다.
 *
 * 참고: https://github.com/react-native-webview/react-native-webview/issues/3563
 */

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * FileUtils.java를 react-native-webview 모듈 내부에 생성합니다.
 * (Kotlin 대신 Java 사용 - webview 모듈과 동일한 언어로 통일)
 */
function createFileUtilsInWebViewModule(projectRoot) {
  const webviewDir = path.join(
    projectRoot,
    'node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview'
  );
  const fileUtilsPath = path.join(webviewDir, 'FileUtils.java');

  // 이미 존재하면 스킵
  if (fs.existsSync(fileUtilsPath)) {
    console.log('[WebViewFileFix] FileUtils.java already exists in webview module');
    return;
  }

  const fileUtilsContent = `package com.reactnativecommunity.webview;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Log;
import android.webkit.MimeTypeMap;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.UUID;

/**
 * WebView 파일 업로드를 위한 유틸리티 클래스
 *
 * Android WebView에서 content:// URI의 임시 읽기 권한이 만료되는 문제를 해결합니다.
 * 갤러리에서 선택한 파일을 앱 캐시 디렉토리로 복사하여 안전한 file:// URI를 제공합니다.
 */
public class FileUtils {

    private static final String TAG = "FileUtils";
    private static final String CACHE_DIR_NAME = "webview_uploads";
    private static final int MAX_CACHE_SIZE_MB = 50;

    /**
     * content:// URI를 앱 캐시로 복사하고 FileProvider URI를 반환합니다.
     */
    public static Uri copyToCache(Context context, Uri contentUri) {
        if (contentUri == null) {
            return null;
        }

        // content:// URI가 아니면 그대로 반환
        if (!ContentResolver.SCHEME_CONTENT.equals(contentUri.getScheme())) {
            return contentUri;
        }

        try {
            File cacheDir = getCacheDir(context);
            cleanupOldFiles(cacheDir);

            // 항상 고유한 파일명 생성 (동일 파일 중복 선택 시 충돌 방지)
            String fileName = generateUniqueFileName(context, contentUri);
            File cacheFile = new File(cacheDir, fileName);

            // 파일 복사
            InputStream inputStream = context.getContentResolver().openInputStream(contentUri);
            if (inputStream == null) {
                return contentUri;
            }

            FileOutputStream outputStream = new FileOutputStream(cacheFile);
            copyStream(inputStream, outputStream);
            inputStream.close();
            outputStream.close();

            // FileProvider URI 생성
            return FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                cacheFile
            );
        } catch (Exception e) {
            Log.e(TAG, "Failed to copy file to cache", e);
            // 실패 시 원본 URI 반환 (기존 동작 유지)
            return contentUri;
        }
    }

    /**
     * 여러 URI를 캐시로 복사합니다.
     */
    public static Uri[] copyToCache(Context context, Uri[] uris) {
        if (uris == null) {
            return null;
        }

        Uri[] result = new Uri[uris.length];
        for (int i = 0; i < uris.length; i++) {
            result[i] = copyToCache(context, uris[i]);
        }
        return result;
    }

    /**
     * 캐시 디렉토리를 가져오거나 생성합니다.
     */
    private static File getCacheDir(Context context) {
        File cacheDir = new File(context.getCacheDir(), CACHE_DIR_NAME);
        if (!cacheDir.exists()) {
            cacheDir.mkdirs();
        }
        return cacheDir;
    }

    /**
     * content:// URI에서 원본 파일명을 추출합니다.
     */
    private static String getOriginalFileName(Context context, Uri uri) {
        String fileName = null;

        Cursor cursor = context.getContentResolver().query(uri, null, null, null, null);
        if (cursor != null) {
            try {
                if (cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (nameIndex >= 0) {
                        fileName = cursor.getString(nameIndex);
                    }
                }
            } finally {
                cursor.close();
            }
        }

        if (fileName != null) {
            return sanitizeFileName(fileName);
        }
        return null;
    }

    /**
     * 고유한 파일명을 생성합니다.
     * 동일 파일을 여러 번 선택해도 충돌하지 않도록 항상 UUID 접두사를 붙입니다.
     */
    private static String generateUniqueFileName(Context context, Uri uri) {
        String uniquePrefix = UUID.randomUUID().toString().substring(0, 8) + "_";
        String originalName = getOriginalFileName(context, uri);

        if (originalName != null) {
            return uniquePrefix + originalName;
        }

        // 원본 파일명을 가져올 수 없으면 확장자만 추출하여 생성
        String mimeType = context.getContentResolver().getType(uri);
        String extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType);
        if (extension == null) {
            extension = "jpg";
        }
        return uniquePrefix + "upload." + extension;
    }

    /**
     * 파일명에서 위험한 문자를 제거합니다.
     */
    private static String sanitizeFileName(String fileName) {
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /**
     * 스트림을 복사합니다.
     */
    private static void copyStream(InputStream input, FileOutputStream output) throws Exception {
        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = input.read(buffer)) != -1) {
            output.write(buffer, 0, bytesRead);
        }
        output.flush();
    }

    /**
     * 오래된 캐시 파일을 정리합니다.
     */
    private static void cleanupOldFiles(File cacheDir) {
        try {
            File[] files = cacheDir.listFiles();
            if (files == null) return;

            long totalSize = 0;
            for (File file : files) {
                totalSize += file.length();
            }

            long maxSize = MAX_CACHE_SIZE_MB * 1024 * 1024L;

            if (totalSize > maxSize) {
                // 가장 오래된 파일부터 삭제
                java.util.Arrays.sort(files, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
                for (File file : files) {
                    File[] remaining = cacheDir.listFiles();
                    long currentSize = 0;
                    if (remaining != null) {
                        for (File f : remaining) {
                            currentSize += f.length();
                        }
                    }
                    if (currentSize <= maxSize / 2) break;
                    file.delete();
                }
            }

            // 1시간 이상 된 파일 삭제
            long oneHourAgo = System.currentTimeMillis() - (60 * 60 * 1000);
            files = cacheDir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.lastModified() < oneHourAgo) {
                        file.delete();
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to cleanup cache", e);
        }
    }

    /**
     * 모든 캐시 파일을 삭제합니다.
     */
    public static void clearCache(Context context) {
        try {
            File cacheDir = getCacheDir(context);
            File[] files = cacheDir.listFiles();
            if (files != null) {
                for (File file : files) {
                    file.delete();
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to clear cache", e);
        }
    }
}
`;

  fs.writeFileSync(fileUtilsPath, fileUtilsContent, 'utf8');
  console.log('[WebViewFileFix] Created FileUtils.java in webview module');
}

/**
 * react-native-webview의 RNCWebViewModuleImpl.java를 패치합니다.
 */
function patchWebViewModule(projectRoot) {
  const webviewPath = path.join(
    projectRoot,
    'node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewModuleImpl.java'
  );

  if (!fs.existsSync(webviewPath)) {
    console.warn('[WebViewFileFix] RNCWebViewModuleImpl.java not found, skipping patch...');
    return;
  }

  let content = fs.readFileSync(webviewPath, 'utf8');

  // 이미 패치되었는지 확인 (FileUtils 사용 여부로 체크)
  if (content.includes('FileUtils.copyToCache')) {
    console.log('[WebViewFileFix] Already patched, skipping...');
    return;
  }

  // onActivityResult에서 getSelectedFiles 결과를 캐시로 복사하도록 패치
  // 원본: mFilePathCallback.onReceiveValue(getSelectedFiles(data, resultCode));
  content = content.replace(
    /mFilePathCallback\.onReceiveValue\(getSelectedFiles\(data, resultCode\)\);/,
    `Uri[] selectedFiles = getSelectedFiles(data, resultCode);
                        if (selectedFiles != null) {
                            selectedFiles = FileUtils.copyToCache(mContext, selectedFiles);
                        }
                        mFilePathCallback.onReceiveValue(selectedFiles);`
  );

  // Legacy callback도 패치 (단일 파일)
  // 원본: mFilePathCallbackLegacy.onReceiveValue(data.getData());
  content = content.replace(
    /mFilePathCallbackLegacy\.onReceiveValue\(data\.getData\(\)\);/,
    `mFilePathCallbackLegacy.onReceiveValue(FileUtils.copyToCache(mContext, data.getData()));`
  );

  fs.writeFileSync(webviewPath, content, 'utf8');
  console.log('[WebViewFileFix] Patched RNCWebViewModuleImpl.java successfully!');
}

/**
 * file_paths.xml이 없으면 생성합니다.
 */
function ensureFilePathsXml(projectRoot) {
  const xmlDir = path.join(projectRoot, 'android/app/src/main/res/xml');
  const xmlPath = path.join(xmlDir, 'file_paths.xml');

  if (fs.existsSync(xmlPath)) {
    console.log('[WebViewFileFix] file_paths.xml already exists');
    return;
  }

  if (!fs.existsSync(xmlDir)) {
    fs.mkdirSync(xmlDir, { recursive: true });
  }

  const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <cache-path name="webview_cache" path="webview_uploads/" />
    <external-cache-path name="external_cache" path="webview_uploads/" />
</paths>
`;

  fs.writeFileSync(xmlPath, xmlContent, 'utf8');
  console.log('[WebViewFileFix] Created file_paths.xml');
}

/**
 * AndroidManifest.xml에 FileProvider가 없으면 추가합니다.
 */
function ensureFileProvider(projectRoot) {
  const manifestPath = path.join(projectRoot, 'android/app/src/main/AndroidManifest.xml');

  if (!fs.existsSync(manifestPath)) {
    console.warn('[WebViewFileFix] AndroidManifest.xml not found');
    return;
  }

  let content = fs.readFileSync(manifestPath, 'utf8');

  if (content.includes('androidx.core.content.FileProvider')) {
    console.log('[WebViewFileFix] FileProvider already registered');
    return;
  }

  const providerXml = `
    <!-- FileProvider for WebView file uploads (fixes content:// URI permission expiration) -->
    <provider
        android:name="androidx.core.content.FileProvider"
        android:authorities="\${applicationId}.fileprovider"
        android:exported="false"
        android:grantUriPermissions="true">
        <meta-data
            android:name="android.support.FILE_PROVIDER_PATHS"
            android:resource="@xml/file_paths" />
    </provider>`;

  // <application> 태그 바로 다음에 삽입
  content = content.replace(
    /(<application[^>]*>)/,
    `$1${providerXml}`
  );

  fs.writeFileSync(manifestPath, content, 'utf8');
  console.log('[WebViewFileFix] Added FileProvider to AndroidManifest.xml');
}

/**
 * Expo Config Plugin 메인 함수
 */
const withWebViewFileFix = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;

      console.log('[WebViewFileFix] Applying WebView file upload fix...');

      // 1. file_paths.xml 확인/생성
      ensureFilePathsXml(projectRoot);

      // 2. FileProvider 확인/추가
      ensureFileProvider(projectRoot);

      // 3. FileUtils.java를 react-native-webview 모듈에 생성
      createFileUtilsInWebViewModule(projectRoot);

      // 4. react-native-webview 패치
      patchWebViewModule(projectRoot);

      console.log('[WebViewFileFix] Done!');

      return config;
    },
  ]);
};

module.exports = withWebViewFileFix;
