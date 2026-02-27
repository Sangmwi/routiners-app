import type { TextStyle } from 'react-native';

export type AppFontWeight = 400 | 500 | 600 | 700;

const PRETENDARD_BY_WEIGHT: Record<AppFontWeight, string> = {
  400: 'Pretendard-400',
  500: 'Pretendard-500',
  600: 'Pretendard-600',
  700: 'Pretendard-700',
};

export function pretendard(weight: AppFontWeight = 400): TextStyle {
  return {
    fontFamily: PRETENDARD_BY_WEIGHT[weight],
    fontWeight: 'normal',
  };
}

