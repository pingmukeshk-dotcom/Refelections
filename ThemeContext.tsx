/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { saveUserProfile, fetchUserProfile } from '../lib/firebase';

type ThemeMode = 'day' | 'evening' | 'system';
type ResolvedTheme = 'day' | 'evening';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode, uid?: string) => Promise<void>;
  loadProfileTheme: (uid: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('reflections_theme');
    if (saved === 'day' || saved === 'evening' || saved === 'system') {
      return saved;
    }
    return 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('day');

  // Compute resolved theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolved = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'evening' : 'day');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolved();
    mediaQuery.addEventListener('change', updateResolved);
    return () => mediaQuery.removeEventListener('change', updateResolved);
  }, [theme]);

  // Apply root HTML attribute/class for styling
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'evening') {
      root.classList.add('dark', 'theme-evening');
      root.classList.remove('theme-day');
    } else {
      root.classList.remove('dark', 'theme-evening');
      root.classList.add('theme-day');
    }
  }, [resolvedTheme]);

  const setTheme = async (newTheme: ThemeMode, uid?: string) => {
    setThemeState(newTheme);
    localStorage.setItem('reflections_theme', newTheme);
    if (uid) {
      try {
        await saveUserProfile(uid, { theme: newTheme });
      } catch (err) {
        console.warn('Could not persist theme to profile:', err);
      }
    }
  };

  const loadProfileTheme = async (uid: string) => {
    try {
      const profile = await fetchUserProfile(uid);
      if (profile?.theme) {
        setThemeState(profile.theme);
        localStorage.setItem('reflections_theme', profile.theme);
      }
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, loadProfileTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
