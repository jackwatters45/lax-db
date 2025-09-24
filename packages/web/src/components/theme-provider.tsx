import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useState,
} from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextVal = { theme: Theme; setTheme: (val: Theme) => void };
type Props = PropsWithChildren<{ initialTheme?: Theme }>;

const ThemeContext = createContext<ThemeContextVal | null>(null);

export function ThemeProvider({ children, initialTheme }: Props) {
  const [theme, setThemeState] = useState<Theme>(initialTheme || 'dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
    }
  }, []);

  function setTheme(val: Theme) {
    setThemeState(val);
    localStorage.setItem('theme', val);
  }

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}

export function useTheme() {
  const val = use(ThemeContext);
  if (!val) throw new Error('useTheme must be used within a ThemeProvider!');
  return val;
}
