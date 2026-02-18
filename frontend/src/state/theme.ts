import { useContext } from 'react';
import { ThemeContext } from '../app/Providers';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within Providers');
  return ctx;
}

