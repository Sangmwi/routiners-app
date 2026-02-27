import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { THEME_TOKENS } from '@sangmwi/shared-contracts';
import { useComponentTheme } from '@/lib/theme';
import { AppIcons } from '@/lib/icon';
import { pretendard } from '@/lib/typography';

interface IconProps {
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

interface AppRowProps {
  icon?: ComponentType<IconProps>;
  label: string;
  description?: string;
  destructive?: boolean;
  disabled?: boolean;
  showDivider?: boolean;
  rightAccessory?: 'chevron' | 'toggle' | ReactNode;
  toggleValue?: boolean;
  onToggle?: (next: boolean) => void;
  onPress?: () => void;
}

const { layout } = THEME_TOKENS;

export default function AppRow({
  icon: Icon,
  label,
  description,
  destructive,
  disabled,
  showDivider,
  rightAccessory = 'chevron',
  toggleValue,
  onToggle,
  onPress,
}: AppRowProps) {
  const theme = useComponentTheme();
  const styles = createStyles(theme);

  const isToggle = rightAccessory === 'toggle';
  const isChevron = rightAccessory === 'chevron';
  const isCustom = !isToggle && !isChevron;

  const handlePress = () => {
    if (isToggle && onToggle !== undefined) {
      onToggle(!toggleValue);
      return;
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isCustom}
      style={({ pressed }) => [styles.row, pressed && !disabled && !isCustom && styles.rowPressed]}
    >
      <View style={styles.rowLeft}>
        {Icon ? (
          <View style={styles.iconWrap}>
            <Icon size={20} weight="regular" color={destructive ? theme.destructive : theme.textMuted} />
          </View>
        ) : null}
        <View style={styles.textWrap}>
          <Text style={[styles.label, destructive && { color: theme.destructive }]}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </View>

      <View style={styles.right}>
        {isChevron ? <AppIcons.caretRight size={16} color={theme.textMuted} weight="bold" /> : null}
        {isToggle ? (
          <Switch
            value={!!toggleValue}
            onValueChange={(next) => onToggle?.(next)}
            thumbColor="#ffffff"
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        ) : null}
        {isCustom ? rightAccessory : null}
      </View>

      {showDivider ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
    </Pressable>
  );
}

const createStyles = (theme: ReturnType<typeof useComponentTheme>) =>
  StyleSheet.create({
    row: {
      minHeight: layout.row.height,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.row.paddingX,
      paddingVertical: layout.row.paddingY,
      position: 'relative',
    },
    rowPressed: {
      backgroundColor: theme.isDark ? 'rgba(51,65,85,0.18)' : 'rgba(226,232,240,0.25)',
    },
    rowLeft: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: layout.space[10],
    },
    iconWrap: {
      width: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textWrap: {
      flex: 1,
    },
    label: {
      fontSize: layout.typography.body,
      ...pretendard(500),
      color: theme.text,
    },
    description: {
      marginTop: 2,
      fontSize: layout.typography.caption,
      ...pretendard(400),
      color: theme.textMuted,
    },
    right: {
      marginLeft: layout.space[12],
      minWidth: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      position: 'absolute',
      left: layout.row.dividerInset,
      right: 0,
      bottom: 0,
      height: StyleSheet.hairlineWidth,
      opacity: 0.8,
    },
  });
