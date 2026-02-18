import { safeGet, safeSet } from './storage';

export type ThemeMode = 'dark' | 'light';

const KEY = 'pm_theme';

export function getInitialTheme(): ThemeMode {
  const saved = safeGet(KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark';
}

export function applyTheme(theme: ThemeMode) {
  const html = document.documentElement;
  html.classList.remove('dark', 'light');
  html.classList.add(theme);
  safeSet(KEY, theme);
}

