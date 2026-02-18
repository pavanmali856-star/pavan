import React, { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../state/auth';
import { applyTheme, getInitialTheme, type ThemeMode } from '../lib/theme';

export const ThemeContext = React.createContext<{
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggle: () => void;
} | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    []
  );

  const themeValue = useMemo(
    () => ({
      theme,
      setTheme,
      toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

