import { Pressable, StyleSheet, Text } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';

type Variant = 'primary' | 'destructive' | 'ghost';

interface AppActionButtonProps {
  label: string;
  variant?: Variant;
  disabled?: boolean;
  onPress?: () => void;
}

const { layout } = THEME_TOKENS;

export default function AppActionButton({
  label,
  variant = 'primary',
  disabled,
  onPress,
}: AppActionButtonProps) {
  const theme = useComponentTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'destructive' && styles.destructive,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'ghost' && { color: theme.text },
          variant === 'primary' && { color: theme.primaryForeground },
          variant === 'destructive' && { color: '#ffffff' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: ReturnType<typeof useComponentTheme>) =>
  StyleSheet.create({
    base: {
      minHeight: layout.modal.actionMinHeight,
      minWidth: layout.modal.actionMinWidth,
      borderRadius: layout.modal.actionRadius,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: layout.space[16],
    },
    primary: {
      backgroundColor: theme.primary,
    },
    destructive: {
      backgroundColor: theme.destructive,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    text: {
      fontSize: layout.typography.button,
      fontWeight: '700',
    },
    disabled: {
      opacity: 0.55,
    },
    pressed: {
      opacity: 0.8,
    },
  });
