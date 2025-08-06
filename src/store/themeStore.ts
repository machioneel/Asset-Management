// themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDarkMode: 
        typeof window !== 'undefined' 
          ? window.matchMedia('(prefers-color-scheme: dark)').matches 
          : false,
      toggleTheme: () => {
        set((state) => {
          const newDarkMode = !state.isDarkMode;
          // Update document class when theme changes
          if (typeof window !== 'undefined') {
            if (newDarkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          return { isDarkMode: newDarkMode };
        });
      },
      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
        if (typeof window !== 'undefined') {
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

// Initialize theme on mount
if (typeof window !== 'undefined') {
  // Get theme from storage and apply it
  const isDark = useThemeStore.getState().isDarkMode;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    useThemeStore.getState().setDarkMode(e.matches);
  });
}