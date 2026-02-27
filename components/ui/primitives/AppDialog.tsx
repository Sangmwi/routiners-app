import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';
import { pretendard } from '@/lib/typography';
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
      backdropBlur
      contentStyle={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={[styles.actions, !showCancel && styles.actionsSingle]}>
          {showCancel ? (
            <AppActionButton
              label={cancelText}
              variant="ghost"
              fullWidth
              disabled={loading}
              onPress={onClose}
            />
          ) : null}

          {loading ? (
            <View style={[styles.loadingButton, showCancel && styles.loadingButtonFull]}>
              <ActivityIndicator color={confirmVariant === 'destructive' ? '#ffffff' : theme.primaryForeground} />
            </View>
          ) : (
            <AppActionButton
              label={confirmText}
              variant={confirmVariant === 'destructive' ? 'destructive' : 'primary'}
              fullWidth={showCancel}
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
    container: {
      width: '100%',
      maxWidth: layout.modal.maxWidth,
      backgroundColor: theme.card,
      borderRadius: layout.modal.cardRadius,
      paddingHorizontal: layout.modal.paddingX,
      paddingVertical: layout.modal.paddingY,
    },
    content: {
      gap: layout.modal.contentGap,
    },
    title: {
      fontSize: layout.modal.titleSize,
      ...pretendard(700),
      color: theme.text,
    },
    message: {
      fontSize: 15,
      lineHeight: 22,
      ...pretendard(400),
      color: theme.textMuted,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: layout.modal.buttonGap,
    },
    actionsSingle: {
      justifyContent: 'flex-end',
    },
    loadingButton: {
      minWidth: layout.modal.actionMinWidth,
      minHeight: layout.modal.actionMinHeight,
      borderRadius: layout.modal.actionRadius,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingHorizontal: layout.space[16],
    },
    loadingButtonFull: {
      flex: 1,
    },
  });
