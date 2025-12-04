import { createContext, useContext, useState, ReactNode } from 'react';

type ThemeMode = 'dark' | 'light' | 'neon';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: {
    bg: string;
    cardBg: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    success: string;
    error: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themeColors = {
  dark: {
    bg: '#0a0b0d',
    cardBg: '#111213',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.6)',
    border: 'rgba(255,255,255,0.1)',
    primary: '#7b61ff',
    success: '#22c55e',
    error: '#ef4444',
  },
  light: {
    bg: '#f5f5f5',
    cardBg: '#ffffff',
    text: '#000000',
    textSecondary: 'rgba(0,0,0,0.6)',
    border: 'rgba(0,0,0,0.1)',
    primary: '#6b51e5',
    success: '#22c55e',
    error: '#ef4444',
  },
  neon: {
    bg: '#0d0221',
    cardBg: '#1a0b2e',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.7)',
    border: 'rgba(255, 0, 255, 0.3)',
    primary: '#ff00ff',
    success: '#00ff41',
    error: '#ff0055',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app-theme') as ThemeMode;
    return saved || 'dark';
  });

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, colors: themeColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
}
