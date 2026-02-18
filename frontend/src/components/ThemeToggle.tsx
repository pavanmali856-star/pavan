import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/Button';
import { useTheme } from '../state/theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" onClick={toggle} aria-label="Toggle theme" className="h-10 w-10 p-0">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}

