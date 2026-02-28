import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabRoute } from '@sauhi/shared-contracts';
import { NATIVE_TAB_ITEMS, NATIVE_TAB_STYLE } from '@/lib/navigation/native-tab-config';
import { useTheme } from '@/lib/theme';

type NativeBottomNavProps = {
  activeTab: TabRoute;
  onTabPress: (path: TabRoute) => void;
};

export function NativeBottomNav({ activeTab, onTabPress }: NativeBottomNavProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderTopColor: 'rgba(148, 163, 184, 0.25)',
          paddingBottom: insets.bottom,
          height: NATIVE_TAB_STYLE.height + insets.bottom,
        },
      ]}
    >
      {NATIVE_TAB_ITEMS.map((item) => {
        const isActive = activeTab === item.path;
        const Icon = item.icon;
        return (
          <Pressable key={item.path} onPress={() => onTabPress(item.path)} style={styles.tabButton}>
            <Icon
              size={NATIVE_TAB_STYLE.iconSize}
              color={isActive ? theme.text : theme.textMuted}
              weight={isActive ? NATIVE_TAB_STYLE.activeWeight : NATIVE_TAB_STYLE.inactiveWeight}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? theme.text : theme.textMuted,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: NATIVE_TAB_STYLE.height,
  },
  tabLabel: {
    fontSize: NATIVE_TAB_STYLE.labelSize,
    letterSpacing: NATIVE_TAB_STYLE.labelLetterSpacing,
  },
});
