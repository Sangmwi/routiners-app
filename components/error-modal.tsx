import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { AppActionButton } from '@/components/ui';
import { useComponentTheme } from '@/lib/theme';
import BaseSheetModal from '@/components/ui/BaseSheetModal';

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
    message: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  },
  connection: {
    title: '연결 오류',
    message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.',
  },
} as const;

const { layout } = THEME_TOKENS;

export function ErrorModal({ visible, onClose, onRetry, error }: ErrorModalProps) {
  const theme = useComponentTheme();
  const styles = createStyles(theme);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!visible) setShowDetails(false);
  }, [visible]);

  const content = error?.type === 'http' ? ERROR_CONTENT.http : ERROR_CONTENT.connection;

  return (
    <BaseSheetModal visible={visible} onClose={onClose} presentation="dialog" contentStyle={styles.container}>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.message}>{content.message}</Text>

      <Pressable onPress={() => setShowDetails((prev) => !prev)} style={styles.detailToggle}>
        <Text style={styles.detailToggleText}>{showDetails ? '상세 숨기기' : '오류 상세 정보'}</Text>
      </Pressable>

      {showDetails && error ? (
        <View style={styles.detailsContainer}>
          {error.code !== undefined ? <Text style={styles.detailsText}>Code: {error.code}</Text> : null}
          {error.statusCode !== undefined ? <Text style={styles.detailsText}>HTTP: {error.statusCode}</Text> : null}
          {error.description ? <Text style={styles.detailsText}>{error.description}</Text> : null}
          {error.url ? (
            <Text style={styles.detailsText} numberOfLines={2}>
              URL: {error.url}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <AppActionButton label="닫기" variant="ghost" onPress={onClose} />
        <AppActionButton label="다시 시도" variant="primary" onPress={onRetry} />
      </View>
    </BaseSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useComponentTheme>) =>
  StyleSheet.create({
    container: {
      width: '100%',
      maxWidth: 360,
      borderRadius: layout.modal.cardRadius,
      backgroundColor: theme.card,
      paddingHorizontal: layout.space[24],
      paddingVertical: layout.space[20],
      gap: layout.space[10],
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
    },
    message: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.textMuted,
    },
    detailToggle: {
      paddingVertical: layout.space[4],
    },
    detailToggleText: {
      fontSize: 13,
      color: theme.textMuted,
      textDecorationLine: 'underline',
    },
    detailsContainer: {
      borderRadius: layout.radius.md,
      padding: layout.space[12],
      backgroundColor: theme.isDark ? 'rgba(51,65,85,0.3)' : 'rgba(226,232,240,0.35)',
      gap: 4,
    },
    detailsText: {
      fontSize: 12,
      color: theme.textMuted,
      fontFamily: 'monospace',
    },
    actionRow: {
      marginTop: layout.space[6],
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: layout.modal.actionGap,
    },
  });
