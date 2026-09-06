/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ActiveTab, JournalEntry } from './types';
import { fetchUserEntries } from './lib/firebase';
import { fetchStarterPrompt } from './lib/api';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { WritingScreen } from './components/WritingScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { DayDetailModal } from './components/DayDetailModal';
import { SettingsModal } from './components/SettingsModal';

function ReflectionsApp() {
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('write');
  const [isWriting, setIsWriting] = useState<boolean>(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState<boolean>(false);
  const [starterPrompt, setStarterPrompt] = useState<string>(
    'What felt unexpectedly heavy or light today?'
  );
  const [isRefreshingPrompt, setIsRefreshingPrompt] = useState<boolean>(false);

  // Modal states
  const [detailEntries, setDetailEntries] = useState<JournalEntry[] | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Load starter prompt
  const loadPrompt = useCallback(async () => {
    setIsRefreshingPrompt(true);
    try {
      const prompt = await fetchStarterPrompt();
      setStarterPrompt(prompt);
    } finally {
      setIsRefreshingPrompt(false);
    }
  }, []);

  // Load entries when user logs in
  const loadEntries = useCallback(async () => {
    if (!user) {
      setEntries([]);
      return;
    }
    setIsLoadingEntries(true);
    try {
      const data = await fetchUserEntries(user.uid);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [user]);

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, loadEntries]);

  // Loading indicator for initial auth hydration
  if (authLoading) {
    return (
      <div
        id="app-loading-screen"
        className="min-h-screen flex flex-col items-center justify-center p-6 journal-canvas"
      >
        <div className="w-8 h-8 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif-journal text-sm italic text-[var(--ink-muted)]">
          Opening your private journal...
        </p>
      </div>
    );
  }

  // Screen 1: Login if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div id="reflections-app-shell" className="min-h-screen flex flex-col journal-canvas">
      {/* Top Header */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
        {isWriting ? (
          /* Screen 3: Writing Page */
          <WritingScreen
            starterPrompt={starterPrompt}
            onBack={() => setIsWriting(false)}
            onEntrySaved={() => {
              setIsWriting(false);
              loadEntries();
              loadPrompt();
            }}
          />
        ) : activeTab === 'write' ? (
          /* Screen 2: Home (Write tab) */
          <HomeScreen
            starterPrompt={starterPrompt}
            onRefreshPrompt={loadPrompt}
            isRefreshingPrompt={isRefreshingPrompt}
            onBeginWriting={() => setIsWriting(true)}
            entries={entries}
            onSelectEntry={(entry) => setDetailEntries([entry])}
          />
        ) : (
          /* Screen 4: Analytics Screen */
          <AnalyticsScreen
            entries={entries}
            onSelectEntries={(selectedEntries) => setDetailEntries(selectedEntries)}
          />
        )}
      </main>

      {/* Bottom Navigation (Write and Analytics) */}
      {!isWriting && (
        <Navigation activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />
      )}

      {/* Screen 6: Day-detail view modal */}
      {detailEntries && (
        <DayDetailModal
          entries={detailEntries}
          onClose={() => setDetailEntries(null)}
        />
      )}

      {/* Screen 5: Settings / Account modal */}
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onDataDeleted={() => {
            setEntries([]);
            setIsWriting(false);
            setActiveTab('write');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReflectionsApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
