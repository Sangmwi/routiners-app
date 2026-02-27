import type { LucideIcon } from 'lucide-react-native';
import {
  CalendarDays,
  ChartColumn,
  Home,
  UserRound,
  Users,
} from 'lucide-react-native';
import type { TabRoute } from '@sangmwi/shared-contracts';

type NativeTabItem = {
  path: TabRoute;
  label: string;
  icon: LucideIcon;
};

export const NATIVE_TAB_ITEMS: NativeTabItem[] = [
  { path: '/', label: '홈', icon: Home },
  { path: '/routine', label: '루틴', icon: CalendarDays },
  { path: '/stats', label: '통계', icon: ChartColumn },
  { path: '/community', label: '커뮤니티', icon: Users },
  { path: '/profile', label: '프로필', icon: UserRound },
];

