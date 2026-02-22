import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useComponentTheme } from '@/lib/theme';

interface SheetInfoHeaderProps {
  title?: string;
  message?: string;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  messageStyle?: StyleProp<TextStyle>;
}

export default function SheetInfoHeader({
  title,
  message,
  containerStyle,
  titleStyle,
  messageStyle,
}: SheetInfoHeaderProps) {
  const theme = useComponentTheme();
  const styles = createStyles(theme);

  if (!title && !message) {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {message && <Text style={[styles.message, messageStyle]}>{message}</Text>}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useComponentTheme>) =>
  StyleSheet.create({
    container: {
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
  });
