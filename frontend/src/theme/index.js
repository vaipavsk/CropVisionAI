import { createContext, useContext, useEffect, useState, createElement } from 'react';
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';

const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
  colors,
  spacing,
  typography,
  shadows,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Default to dark mode for the premium cyber-agriculture aesthetic
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Use createElement to prevent JSX parse errors in plain JS files in Vite
  return createElement(
    ThemeContext.Provider,
    { value: { isDark, toggleTheme, colors, spacing, typography, shadows } },
    children
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { colors, spacing, typography, shadows };
export default ThemeContext;
