import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';
import { pretendard } from '@/lib/typography';
import AppSurface from './AppSurface';

interface AppSectionProps {
  title: string;
  children: ReactNode;
}

const { layout } = THEME_TOKENS;

export default function AppSection({ title, children }: AppSectionProps) {
  const theme = useComponentTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <AppSurface rounded="xl">
        <View>{children}</View>
      </AppSurface>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useComponentTheme>) =>
  StyleSheet.create({
    wrap: {
      gap: layout.section.gap,
    },
    title: {
      paddingHorizontal: 4,
      fontSize: layout.section.titleSize,
      ...pretendard(500),
      color: theme.textMuted,
    },
  });
