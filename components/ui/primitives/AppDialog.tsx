import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';
import BaseSheetModal from '@/components/ui/BaseSheetModal';
import AppActionButton from './AppActionButton';

export interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  confirmVariant?: 'primary' | 'destructive';
  loading?: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
}

const { layout } = THEME_TOKENS;

export default function AppDialog({
  visible,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  showCancel = true,
  confirmVariant = 'primary',
  loading = false,
  onClose,
  onConfirm,
}: AppDialogProps) {
  const theme = useComponentTheme();
  const styles = createStyles(theme);

  return (
    <BaseSheetModal
      visible={visible}
      onClose={onClose}
      presentation="dialog"
      closeOnBackdropPress={!loading}
      contentStyle={styles.container}
      overlayStyle={styles.overlay}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={[styles.actions, !showCancel && styles.actionsSingle]}>
          {showCancel ? (
            <AppActionButton label={cancelText} variant="ghost" disabled={loading} onPress={onClose} />
          ) : null}

          {loading ? (
            <View style={styles.loadingButton}>
              <ActivityIndicator color={confirmVariant === 'destructive' ? '#ffffff' : theme.primaryForeground} />
            </View>
          ) : (
            <AppActionButton
              label={confirmText}
              variant={confirmVariant === 'destructive' ? 'destructive' : 'primary'}
              onPress={() => void onConfirm?.()}
            />
          )}
        </View>
      </View>
    </BaseSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useComponentTheme>) =>
  StyleSheet.create({
    overlay: {
      backgroundColor: theme.isDark ? THEME_TOKENS.layout.modal.backdropDark : THEME_TOKENS.layout.modal.backdropLight,
    },
    container: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.card,
      borderRadius: layout.modal.cardRadius,
      paddingHorizontal: layout.space[24],
      paddingVertical: layout.space[20],
    },
    content: {
      gap: layout.space[12],
    },
    title: {
      fontSize: 40 / 2,
      fontWeight: '700',
      color: theme.text,
    },
    message: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.textMuted,
    },
    actions: {
      marginTop: layout.space[10],
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: layout.modal.actionGap,
    },
    actionsSingle: {
      justifyContent: 'flex-end',
    },
    loadingButton: {
      minWidth: 120,
      minHeight: 44,
      borderRadius: layout.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: layout.space[16],
    },
  });
