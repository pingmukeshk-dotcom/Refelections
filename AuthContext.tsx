/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../types';
import { loginWithGoogle, logoutUser, subscribeToAuth } from '../lib/firebase';
import { useTheme } from './ThemeContext';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { loadProfileTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = subscribeToAuth((authUser) => {
      setUser(authUser);
      setLoading(false);
      if (authUser) {
        loadProfileTheme(authUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const authUser = await loginWithGoogle();
      setUser(authUser);
      if (authUser) {
        await loadProfileTheme(authUser.uid);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const getIdToken = async (): Promise<string> => {
    if (!user) {
      throw new Error('User is not signed in');
    }
    return user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
