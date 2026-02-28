import type { ComponentType } from 'react';
import type { TabRoute } from '@sauhi/shared-contracts';
import { AppIcons } from '@/lib/icon';

type IconProps = {
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
};

type NativeTabItem = {
  path: TabRoute;
  label: string;
  icon: ComponentType<IconProps>;
};

export const NATIVE_TAB_STYLE = {
  height: 64,
  iconSize: 24,
  labelSize: 12,
  labelLetterSpacing: 0.1,
  activeWeight: 'fill' as const,
  inactiveWeight: 'regular' as const,
};

export const NATIVE_TAB_ITEMS: NativeTabItem[] = [
  { path: '/', label: '홈', icon: AppIcons.home },
  { path: '/routine', label: '루틴', icon: AppIcons.routine },
  { path: '/stats', label: '통계', icon: AppIcons.stats },
  { path: '/community', label: '커뮤니티', icon: AppIcons.community },
  { path: '/profile', label: '프로필', icon: AppIcons.profile },
];
