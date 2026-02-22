import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useComponentTheme } from '@/lib/theme';
import BaseSheetModal from '@/components/ui/BaseSheetModal';
import SheetInfoHeader from '@/components/ui/SheetInfoHeader';

export interface WebViewError {
  code?: number;
  description?: string;
  url?: string;
  type: 'connection' | 'http';
  statusCode?: number;
}

export interface ErrorModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
  error: WebViewError | null;
}

const ERROR_CONTENT = {
  http: {
    title: '서버 오류',
    message: '서버에서 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.',
  },
  connection: {
    title: '연결 오류',
    message: '서버에 연결할 수 없습니다.\n네트워크 연결을 확인해 주세요.',
  },
} as const;

export function ErrorModal({
  visible,
  onClose,
  onRetry,
  error,
}: ErrorModalProps) {
  const theme = useComponentTheme();
  const styles = createStyles(theme);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShowDetails(false);
    }
  }, [visible]);

  const content = error?.type === 'http' ? ERROR_CONTENT.http : ERROR_CONTENT.connection;

  return (
    <BaseSheetModal
      visible={visible}
      onClose={onClose}
      presentation="dialog"
      contentStyle={styles.container}
    >
      <SheetInfoHeader
        title={content.title}
        message={content.message}
        containerStyle={styles.header}
        titleStyle={styles.title}
        messageStyle={styles.message}
      />

      <TouchableOpacity
        style={styles.detailsToggle}
        onPress={() => setShowDetails((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? '▼' : '▶'} 오류 상세 정보
        </Text>
      </TouchableOpacity>

      {showDetails && error && (
        <View style={styles.detailsContainer}>
          {error.code !== undefined && (
            <Text style={styles.detailsText}>Code: {error.code}</Text>
          )}
          {error.statusCode !== undefined && (
            <Text style={styles.detailsText}>HTTP: {error.statusCode}</Text>
          )}
          {error.description && (
            <Text style={styles.detailsText}>{error.description}</Text>
          )}
          {error.url && (
            <Text style={styles.detailsText} numberOfLines={2}>
              URL: {error.url}
            </Text>
          )}
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.closeButton]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>
      </View>
    </BaseSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useComponentTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 320,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    detailsToggle: {
      paddingVertical: 8,
      marginBottom: 8,
    },
    detailsToggleText: {
      fontSize: 13,
      color: theme.textMuted,
    },
    detailsContainer: {
      backgroundColor: theme.isDark ? theme.muted : theme.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    detailsText: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: theme.textMuted,
      marginBottom: 4,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    retryButton: {
      backgroundColor: theme.primary,
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.primaryForeground,
    },
    closeButton: {
      backgroundColor: theme.isDark ? theme.muted : theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    closeButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
  });
