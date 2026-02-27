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
      backdropBlur
      backdropIntensity={layout.modal.blurIntensity}
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
      backgroundColor: theme.isDark
        ? `rgba(0, 0, 0, ${layout.modal.backdropAlphaDark})`
        : `rgba(0, 0, 0, ${layout.modal.backdropAlphaLight})`,
    },
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
      fontWeight: '700',
      color: theme.text,
    },
    message: {
      fontSize: layout.modal.messageSize,
      lineHeight: layout.modal.messageLineHeight,
      color: theme.textMuted,
    },
    actions: {
      marginTop: layout.space[10],
      flexDirection: 'row',
      justifyContent: 'flex-end',
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
  });
