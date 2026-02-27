import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';
import BaseSheetModal from './BaseSheetModal';
import SheetInfoHeader from './SheetInfoHeader';

export interface ActionSheetOption {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'destructive';
  disabled?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  cancelText?: string;
  showCancel?: boolean;
}

const { layout } = THEME_TOKENS;

export default function ActionSheet({
  visible,
  onClose,
  title,
  message,
  options,
  cancelText = '취소',
  showCancel = true,
}: ActionSheetProps) {
  const theme = useComponentTheme();
  const styles = createStyles(theme);

  const getOptionTextColor = (variant: ActionSheetOption['variant']) => {
    switch (variant) {
      case 'primary':
        return theme.primary;
      case 'destructive':
        return theme.destructive;
      default:
        return theme.text;
    }
  };

  return (
    <BaseSheetModal
      visible={visible}
      onClose={onClose}
      presentation="sheet"
      backdropBlur
      backdropIntensity={layout.modal.blurIntensity}
      contentStyle={styles.container}
      overlayStyle={styles.overlay}
    >
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {(title || message) && (
        <SheetInfoHeader
          title={title}
          message={message}
          containerStyle={styles.header}
          titleStyle={styles.title}
          messageStyle={styles.message}
        />
      )}

      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <Pressable
            key={`${option.label}-${index}`}
            onPress={() => {
              if (option.disabled) return;
              option.onPress();
              onClose();
            }}
            disabled={option.disabled}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
          >
            {option.icon ? <View style={styles.optionIcon}>{option.icon}</View> : null}
            <Text style={[styles.optionText, { color: getOptionTextColor(option.variant) }]}>{option.label}</Text>
            {index < options.length - 1 ? <View style={styles.optionDivider} /> : null}
          </Pressable>
        ))}
      </View>

      {showCancel ? (
        <Pressable onPress={onClose} style={({ pressed }) => [styles.cancelButton, pressed && styles.optionPressed]}>
          <Text style={styles.cancelText}>{cancelText}</Text>
        </Pressable>
      ) : null}
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
      backgroundColor: theme.card,
      borderTopLeftRadius: layout.radius.x2,
      borderTopRightRadius: layout.radius.x2,
      paddingBottom: Platform.OS === 'ios' ? 34 : 22,
      overflow: 'hidden',
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: layout.space[8],
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.textMuted,
      opacity: 0.35,
    },
    header: {
      paddingHorizontal: layout.space[20],
      paddingTop: layout.space[4],
      paddingBottom: layout.space[12],
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    optionsContainer: {
      marginHorizontal: layout.space[16],
      borderRadius: layout.radius.xl,
      overflow: 'hidden',
      backgroundColor: theme.card,
    },
    option: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: layout.space[16],
      position: 'relative',
    },
    optionPressed: {
      opacity: 0.8,
    },
    optionIcon: {
      marginRight: layout.space[10],
    },
    optionText: {
      fontSize: 17,
      fontWeight: '600',
    },
    optionDivider: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    cancelButton: {
      marginTop: layout.space[8],
      marginHorizontal: layout.space[16],
      minHeight: 52,
      borderRadius: layout.radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
    },
    cancelText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
    },
  });
