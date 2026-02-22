import type { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
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

  const handleOptionPress = (option: ActionSheetOption) => {
    if (option.disabled) return;
    option.onPress();
    onClose();
  };

  return (
    <BaseSheetModal
      visible={visible}
      onClose={onClose}
      presentation="sheet"
      contentStyle={styles.container}
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
          <TouchableOpacity
            key={`${option.label}-${index}`}
            style={[
              styles.option,
              option.disabled && styles.optionDisabled,
              index < options.length - 1 && styles.optionBorder,
            ]}
            onPress={() => handleOptionPress(option)}
            disabled={option.disabled}
            activeOpacity={0.7}
          >
            {option.icon && <View style={styles.optionIcon}>{option.icon}</View>}
            <Text
              style={[
                styles.optionText,
                { color: getOptionTextColor(option.variant) },
                option.disabled && styles.optionTextDisabled,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.cancelText}>{cancelText}</Text>
        </TouchableOpacity>
      )}
    </BaseSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useComponentTheme>) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 24,
      overflow: 'hidden',
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.textMuted,
      borderRadius: 2,
      opacity: 0.3,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    optionsContainer: {
      marginHorizontal: 12,
      backgroundColor: theme.isDark ? theme.muted : theme.background,
      borderRadius: 14,
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    optionBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    optionDisabled: {
      opacity: 0.4,
    },
    optionIcon: {
      marginRight: 12,
    },
    optionText: {
      fontSize: 18,
      fontWeight: '500',
    },
    optionTextDisabled: {
      color: theme.textMuted,
    },
    cancelButton: {
      marginTop: 8,
      marginHorizontal: 12,
      backgroundColor: theme.isDark ? theme.muted : theme.background,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.primary,
    },
  });
