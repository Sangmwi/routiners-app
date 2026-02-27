import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  Crown,
  FileText,
  Gift,
  LogOut,
  Mail,
  Megaphone,
  Palette,
  ShieldCheck,
  Ticket,
  UserMinus,
  Users,
} from 'lucide-react-native';
import type { ThemeMode } from '@sangmwi/shared-contracts';
import { supabase } from '@/lib/supabase/client';
import { getInitialUrl } from '@/lib/webview';
import { useComponentTheme } from '@/lib/theme';
import { useThemePreference } from '@/lib/theme-preference';

type Accessory = 'chevron' | 'toggle' | ReactNode;

type SettingsRowItem = {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  description?: string;
  destructive?: boolean;
  accessory?: Accessory;
  toggleValue?: boolean;
  onToggle?: (next: boolean) => void;
  onPress?: () => void;
};

type SettingsGroup = {
  key: string;
  title: string;
  rows: SettingsRowItem[];
};

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: '라이트' },
  { mode: 'dark', label: '다크' },
  { mode: 'system', label: '시스템' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useComponentTheme();
  const { mode, setMode } = useThemePreference();

  const [isLoading, setIsLoading] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  const showPreparingAlert = () => {
    Alert.alert('준비 중', '준비 중인 기능입니다.');
  };

  const runLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut({ scope: 'local' });
      router.replace('/');
    } finally {
      setIsLoading(false);
    }
  };

  const runWithdraw = async () => {
    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${getInitialUrl()}/api/user/withdraw`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || '탈퇴 처리에 실패했습니다.');
      }

      await supabase.auth.signOut({ scope: 'local' });
      router.replace('/');
    } catch (error) {
      Alert.alert('오류', error instanceof Error ? error.message : '탈퇴 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void runLogout() },
    ]);
  };

  const confirmWithdraw = () => {
    Alert.alert('회원 탈퇴', '정말 탈퇴하시겠습니까? 복구할 수 없습니다.', [
      { text: '취소', style: 'cancel' },
      { text: '탈퇴', style: 'destructive', onPress: () => void runWithdraw() },
    ]);
  };

  const groups = useMemo<SettingsGroup[]>(
    () => [
      {
        key: 'app-settings',
        title: '앱 설정',
        rows: [
          {
            key: 'theme',
            icon: Palette,
            label: '테마',
            accessory: (
              <ThemeModeSelector
                mode={mode}
                onChange={setMode}
                textColor={theme.text}
                mutedColor={theme.textMuted}
                cardColor={theme.card}
                surfaceColor={theme.muted}
              />
            ),
          },
          {
            key: 'notification',
            icon: Bell,
            label: '알림',
            description: '준비 중',
            accessory: 'toggle',
            toggleValue: notificationEnabled,
            onToggle: (next) => {
              setNotificationEnabled(next);
              showPreparingAlert();
            },
          },
        ],
      },
      {
        key: 'account',
        title: '계정',
        rows: [
          {
            key: 'logout',
            icon: LogOut,
            label: '로그아웃',
            onPress: confirmLogout,
          },
          {
            key: 'withdraw',
            icon: UserMinus,
            label: '회원 탈퇴',
            destructive: true,
            onPress: confirmWithdraw,
          },
          {
            key: 'contact',
            icon: Mail,
            label: '문의하기',
            onPress: showPreparingAlert,
          },
        ],
      },
      {
        key: 'info',
        title: '정보',
        rows: [
          { key: 'notice', icon: Megaphone, label: '공지사항', onPress: showPreparingAlert },
          { key: 'terms', icon: FileText, label: '이용약관', onPress: showPreparingAlert },
          { key: 'privacy', icon: ShieldCheck, label: '개인정보 처리방침', onPress: showPreparingAlert },
        ],
      },
      {
        key: 'premium',
        title: '프리미엄',
        rows: [
          { key: 'subscribe', icon: Crown, label: '구독', onPress: showPreparingAlert },
          { key: 'gift', icon: Gift, label: '선물', onPress: showPreparingAlert },
          { key: 'coupon', icon: Ticket, label: '쿠폰 등록', onPress: showPreparingAlert },
          { key: 'invite', icon: Users, label: '친구 초대', onPress: showPreparingAlert },
        ],
      },
    ],
    [confirmLogout, confirmWithdraw, mode, notificationEnabled, setMode, theme.card, theme.muted, theme.text, theme.textMuted],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.textMuted }]}>뒤로</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {groups.map((group) => (
          <View key={group.key} style={styles.groupWrap}>
            <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{group.title}</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {group.rows.map((row, idx) => (
                <SettingsRow
                  key={`${group.key}:${row.key}`}
                  row={row}
                  textColor={theme.text}
                  mutedColor={theme.textMuted}
                  iconColor={row.destructive ? theme.destructive : theme.textMuted}
                  borderColor={theme.border}
                  disabled={isLoading}
                  showDivider={idx < group.rows.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.versionText, { color: theme.textMuted }]}>v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function ThemeModeSelector({
  mode,
  onChange,
  textColor,
  mutedColor,
  cardColor,
  surfaceColor,
}: {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  textColor: string;
  mutedColor: string;
  cardColor: string;
  surfaceColor: string;
}) {
  return (
    <View style={[styles.themeSelector, { backgroundColor: surfaceColor }]}>
      {THEME_OPTIONS.map((option) => {
        const selected = option.mode === mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => onChange(option.mode)}
            style={[styles.themeButton, selected && { backgroundColor: cardColor }]}
          >
            <Text style={[styles.themeButtonText, { color: selected ? textColor : mutedColor }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingsRow({
  row,
  textColor,
  mutedColor,
  iconColor,
  borderColor,
  disabled,
  showDivider,
}: {
  row: SettingsRowItem;
  textColor: string;
  mutedColor: string;
  iconColor: string;
  borderColor: string;
  disabled: boolean;
  showDivider: boolean;
}) {
  const isToggle = row.accessory === 'toggle';
  const isChevron = row.accessory === undefined || row.accessory === 'chevron';
  const isCustom = !isToggle && !isChevron;

  const onPress = () => {
    if (isToggle && row.onToggle !== undefined && row.toggleValue !== undefined) {
      row.onToggle(!row.toggleValue);
      return;
    }
    row.onPress?.();
  };

  const Icon = row.icon;

  return (
    <Pressable disabled={disabled || isCustom} onPress={onPress} style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowLabel, { color: row.destructive ? '#ef4444' : textColor }]}>
            {row.label}
          </Text>
          {row.description ? (
            <Text style={[styles.rowDescription, { color: mutedColor }]}>{row.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.rowRight, isCustom && styles.rowRightCustom]}>
        {isChevron && <ChevronRight size={16} color={mutedColor} strokeWidth={2.2} />}
        {isToggle && (
          <Switch
            value={!!row.toggleValue}
            onValueChange={(next) => row.onToggle?.(next)}
            thumbColor="#ffffff"
            trackColor={{ false: borderColor, true: '#50A76C' }}
          />
        )}
        {isCustom ? row.accessory : null}
      </View>

      {showDivider ? <View style={[styles.divider, { backgroundColor: borderColor }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 18,
  },
  groupWrap: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'relative',
    minHeight: 52,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
    paddingTop: 2,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowRight: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  rowRightCustom: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDescription: {
    marginTop: 2,
    fontSize: 12,
  },
  divider: {
    position: 'absolute',
    left: 46,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
    gap: 4,
  },
  themeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
