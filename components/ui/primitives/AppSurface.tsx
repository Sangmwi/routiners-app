import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { THEME_TOKENS } from '@sauhi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';

interface AppSurfaceProps {
  children: ReactNode;
  rounded?: 'md' | 'lg' | 'xl';
}

const { layout } = THEME_TOKENS;

const radiusMap = {
  md: layout.radius.md,
  lg: layout.radius.lg,
  xl: layout.radius.xl,
} as const;

export default function AppSurface({ children, rounded = 'xl' }: AppSurfaceProps) {
  const theme = useComponentTheme();

  return (
    <View style={[styles.base, { backgroundColor: theme.card, borderRadius: radiusMap[rounded] }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
