import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { ThemeMode } from '@sauhi/shared-contracts';

const THEME_MODE_KEY = 'routiners_theme_mode';

type ResolvedThemeMode = Exclude<ThemeMode, 'system'>;

type ThemePreferenceContextValue = {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

function resolveMode(mode: ThemeMode, systemMode: 'light' | 'dark' | null | undefined): ResolvedThemeMode {
  if (mode !== 'system') return mode;
  return systemMode === 'dark' ? 'dark' : 'light';
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemMode = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let mounted = true;
    void SecureStore.getItemAsync(THEME_MODE_KEY).then((saved) => {
      if (!mounted) return;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void SecureStore.setItemAsync(THEME_MODE_KEY, next);
  }, []);

  const value = useMemo<ThemePreferenceContextValue>(
    () => ({
      mode,
      resolvedMode: resolveMode(mode, systemMode),
      setMode,
    }),
    [mode, setMode, systemMode],
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return context;
}

