import { Pressable, StyleSheet, Text } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';
import { pretendard } from '@/lib/typography';

type Variant = 'primary' | 'destructive' | 'ghost' | 'secondary';

interface AppActionButtonProps {
  label: string;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
}

const { layout } = THEME_TOKENS;

export default function AppActionButton({
  label,
  variant = 'primary',
  disabled,
  fullWidth = false,
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
        variant === 'secondary' && styles.secondary,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'ghost' && { color: theme.text },
          variant === 'secondary' && { color: theme.text },
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
    secondary: {
      backgroundColor: theme.muted,
    },
    text: {
      fontSize: 15,
      ...pretendard(500),
    },
    fullWidth: {
      flex: 1,
    },
    disabled: {
      opacity: 0.55,
    },
    pressed: {
      opacity: 0.8,
    },
  });
