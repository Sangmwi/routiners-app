import { useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME_TOKENS, type ThemeMode } from '@sangmwi/shared-contracts';
import { ConfirmDialog, AppRow, AppSection } from '@/components/ui';
import { AppIcons } from '@/lib/icon';
import { supabase } from '@/lib/supabase/client';
import { getInitialUrl } from '@/lib/webview';
import { useComponentTheme } from '@/lib/theme';
import { useThemePreference } from '@/lib/theme-preference';

type Accessory = 'chevron' | 'toggle' | ReactNode;

type SettingsRowItem = {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number; color?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' }>;
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

type DialogConfig = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  destructive?: boolean;
  onConfirm?: () => void | Promise<void>;
};

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: 'light', label: '라이트' },
  { mode: 'dark', label: '다크' },
  { mode: 'system', label: '시스템' },
];

const { layout } = THEME_TOKENS;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useComponentTheme();
  const { mode, setMode } = useThemePreference();

  const [isLoading, setIsLoading] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  const openDialog = (config: DialogConfig) => setDialogConfig(config);

  const closeDialog = () => {
    if (!isDialogLoading) setDialogConfig(null);
  };

  const handleDialogConfirm = async () => {
    if (!dialogConfig?.onConfirm) {
      closeDialog();
      return;
    }

    setIsDialogLoading(true);
    try {
      await dialogConfig.onConfirm();
      setDialogConfig(null);
    } finally {
      setIsDialogLoading(false);
    }
  };

  const showPreparingDialog = () => {
    openDialog({
      title: '준비 중',
      message: '준비 중인 기능입니다.',
      confirmText: '확인',
      showCancel: false,
    });
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
      openDialog({
        title: '오류',
        message: error instanceof Error ? error.message : '탈퇴 처리 중 오류가 발생했습니다.',
        confirmText: '확인',
        showCancel: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const groups = useMemo<SettingsGroup[]>(
    () => [
      {
        key: 'app-settings',
        title: '앱 설정',
        rows: [
          {
            key: 'theme',
            icon: AppIcons.palette,
            label: '테마',
            accessory: (
              <ThemeModeSelector
                mode={mode}
                onChange={setMode}
                textColor={theme.text}
                mutedColor={theme.textMuted}
                cardColor={theme.card}
                surfaceColor={theme.isDark ? 'rgba(51,65,85,0.35)' : 'rgba(226,232,240,0.35)'}
              />
            ),
          },
          {
            key: 'notification',
            icon: AppIcons.bell,
            label: '알림',
            description: '준비 중',
            accessory: 'toggle',
            toggleValue: notificationEnabled,
            onToggle: (next) => {
              setNotificationEnabled(next);
              showPreparingDialog();
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
            icon: AppIcons.signOut,
            label: '로그아웃',
            onPress: () =>
              openDialog({
                title: '로그아웃',
                message: '정말 로그아웃 하시겠습니까?',
                confirmText: '로그아웃',
                cancelText: '취소',
                onConfirm: runLogout,
              }),
          },
          {
            key: 'withdraw',
            icon: AppIcons.userMinus,
            label: '회원 탈퇴',
            destructive: true,
            onPress: () =>
              openDialog({
                title: '회원 탈퇴',
                message: '정말 탈퇴하시겠습니까? 복구할 수 없습니다.',
                confirmText: '탈퇴',
                cancelText: '취소',
                destructive: true,
                onConfirm: runWithdraw,
              }),
          },
          { key: 'contact', icon: AppIcons.envelope, label: '문의하기', onPress: showPreparingDialog },
        ],
      },
      {
        key: 'info',
        title: '정보',
        rows: [
          { key: 'notice', icon: AppIcons.megaphone, label: '공지사항', onPress: showPreparingDialog },
          { key: 'terms', icon: AppIcons.fileText, label: '이용약관', onPress: showPreparingDialog },
          { key: 'privacy', icon: AppIcons.shieldCheck, label: '개인정보 처리방침', onPress: showPreparingDialog },
        ],
      },
      {
        key: 'premium',
        title: '프리미엄',
        rows: [
          { key: 'subscribe', icon: AppIcons.crown, label: '구독', onPress: showPreparingDialog },
          { key: 'gift', icon: AppIcons.gift, label: '선물', onPress: showPreparingDialog },
          { key: 'coupon', icon: AppIcons.ticket, label: '쿠폰 등록', onPress: showPreparingDialog },
          { key: 'invite', icon: AppIcons.usersThree, label: '친구 초대', onPress: showPreparingDialog },
        ],
      },
    ],
    [mode, notificationEnabled, setMode, theme.text, theme.textMuted, theme.card, theme.isDark],
  );

  return (
    <>
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}> 
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <AppIcons.caretLeft size={24} color={theme.textMuted} weight="regular" />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>설정</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + layout.space[24] }]}> 
          {groups.map((group) => (
            <AppSection key={group.key} title={group.title}>
              {group.rows.map((row, idx) => (
                <AppRow
                  key={`${group.key}:${row.key}`}
                  icon={row.icon}
                  label={row.label}
                  description={row.description}
                  destructive={row.destructive}
                  disabled={isLoading}
                  rightAccessory={row.accessory}
                  toggleValue={row.toggleValue}
                  onToggle={row.onToggle}
                  onPress={row.onPress}
                  showDivider={idx < group.rows.length - 1}
                />
              ))}
            </AppSection>
          ))}

          <Text style={[styles.versionText, { color: theme.textMuted }]}>v1.0.0</Text>
        </ScrollView>
      </View>

      <ConfirmDialog
        visible={!!dialogConfig}
        title={dialogConfig?.title ?? ''}
        message={dialogConfig?.message}
        confirmText={dialogConfig?.confirmText}
        cancelText={dialogConfig?.cancelText}
        showCancel={dialogConfig?.showCancel}
        destructive={dialogConfig?.destructive}
        loading={isDialogLoading}
        onClose={closeDialog}
        onConfirm={handleDialogConfirm}
      />
    </>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.space[16],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  title: {
    fontSize: layout.typography.title,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  content: {
    paddingHorizontal: layout.space[16],
    paddingTop: layout.space[16],
    gap: layout.space[20],
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: layout.space[2],
    gap: layout.space[4],
  },
  themeButton: {
    paddingVertical: layout.space[8],
    paddingHorizontal: layout.space[12],
    borderRadius: 10,
  },
  themeButtonText: {
    fontSize: layout.typography.caption,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: layout.typography.caption,
    paddingTop: layout.space[8],
    paddingBottom: layout.space[8],
  },
});

