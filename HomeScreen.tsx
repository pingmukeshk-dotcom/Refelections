/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { PenLine, Sparkles, RefreshCw, EyeOff, Eye, Lock, Calendar, ChevronRight } from 'lucide-react';
import { JournalEntry } from '../types';
import { useAuth } from '../context/AuthContext';

interface HomeScreenProps {
  starterPrompt: string;
  onRefreshPrompt: () => void;
  isRefreshingPrompt: boolean;
  onBeginWriting: () => void;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  starterPrompt,
  onRefreshPrompt,
  isRefreshingPrompt,
  onBeginWriting,
  entries,
  onSelectEntry,
}) => {
  const { user } = useAuth();

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour >= 5 && hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    }

    const firstName = user?.displayName ? user.displayName.split(' ')[0] : 'friend';
    return `${timeGreeting}, ${firstName}`;
  }, [user]);

  const recentEntries = useMemo(() => {
    return entries.slice(0, 10);
  }, [entries]);

  // Track which private entries are temporarily unmasked by the user
  const [revealedEntryIds, setRevealedEntryIds] = useState<Set<string>>(new Set());

  const toggleReveal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const hasPrivateEntries = useMemo(() => {
    return recentEntries.some((e) => Boolean(e.isPrivate || !e.reflectWithMe || !e.mood));
  }, [recentEntries]);

  return (
    <div id="home-screen-container" className="space-y-8 pb-24 max-w-3xl mx-auto px-4 sm:px-6 pt-4">
      {/* Time-Aware Greeting Header */}
      <div className="space-y-2">
        <h1
          id="home-greeting-heading"
          className="font-serif-journal text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[var(--ink-primary)]"
        >
          {greeting}
        </h1>
        <p className="font-sans-journal text-xs sm:text-sm text-[var(--ink-muted)]">
          The page is still and waiting. Write as much or as little as you feel like holding.
        </p>
      </div>

      {/* Gentle Starter Prompt Card */}
      <div
        id="starter-prompt-card"
        className="rounded-2xl border p-6 sm:p-7 space-y-5 shadow-sm transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gentle starting point</span>
          </div>
          <button
            id="refresh-starter-prompt-button"
            type="button"
            onClick={onRefreshPrompt}
            disabled={isRefreshingPrompt}
            className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer p-1 rounded-md"
            title="Another thought to consider"
            aria-label="Refresh starter prompt"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshingPrompt ? 'animate-spin text-[var(--accent-gold)]' : ''}`}
            />
            <span className="text-[11px] hidden sm:inline">Different prompt</span>
          </button>
        </div>

        <p
          id="starter-prompt-text"
          className="font-serif-journal text-xl sm:text-2xl italic leading-relaxed text-[var(--ink-primary)]"
        >
          “{starterPrompt}”
        </p>

        <div className="pt-2 flex items-center justify-start">
          <button
            id="begin-writing-button"
            type="button"
            onClick={onBeginWriting}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-xs hover:shadow-md cursor-pointer"
            style={{
              backgroundColor: 'var(--ink-primary)',
              color: 'var(--bg-journal)',
            }}
          >
            <PenLine className="w-4 h-4" />
            <span>Begin writing</span>
          </button>
        </div>
      </div>

      {/* Recent Entries Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif-journal text-2xl font-medium text-[var(--ink-primary)]">
              Recent entries
            </h2>
            {hasPrivateEntries && (
              <span
                id="privacy-shield-indicator"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--ink-muted)]"
                title="Private entries have their content blurred and hidden from preview"
              >
                <Lock className="w-3 h-3 text-[var(--accent-teal)]" />
                <span>Privacy masked</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {revealedEntryIds.size > 0 && (
              <button
                id="rehide-all-previews-button"
                type="button"
                onClick={() => setRevealedEntryIds(new Set())}
                className="inline-flex items-center gap-1 text-xs text-[var(--accent-teal)] hover:underline cursor-pointer"
                title="Re-blur all revealed previews"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Re-mask all</span>
              </button>
            )}
            <span className="text-xs text-[var(--ink-muted)]">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} recorded
            </span>
          </div>
        </div>

        {recentEntries.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-8 text-center space-y-2"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
          >
            <p className="font-serif-journal text-base text-[var(--ink-secondary)] italic">
              Your journal is clean and unwritten.
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              When you write and tap Done, your entries will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentEntries.map((entry) => {
              const entryDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const isPrivate = Boolean(entry.isPrivate || !entry.reflectWithMe || !entry.mood);
              const isRevealed = revealedEntryIds.has(entry.id);

              return (
                <div
                  key={entry.id}
                  id={`recent-entry-row-${entry.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectEntry(entry)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectEntry(entry);
                    }
                  }}
                  className="w-full rounded-xl border p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-all hover:shadow-xs group cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[var(--accent-teal)]"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-card)',
                  }}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)]">
                        <Calendar className="w-3.5 h-3.5" />
                        {entryDate}
                      </span>

                      {/* Confirmed Mood Chip or Private Chip */}
                      {!isPrivate && entry.mood ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize border border-[var(--accent-gold)] bg-[var(--accent-gold-subtle)] text-[var(--ink-primary)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                          {entry.mood}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[var(--ink-muted)]">
                          <Lock className="w-3 h-3 text-[var(--accent-teal)]" />
                          Private
                        </span>
                      )}
                    </div>

                    {/* Summary or Blurred/Verbatim snippet */}
                    {isPrivate ? (
                      !isRevealed ? (
                        <div
                          id={`private-masked-content-${entry.id}`}
                          className="relative flex items-center justify-between gap-2 min-h-[1.75rem] py-0.5 overflow-hidden select-none"
                        >
                          {/* Blurred silhouette veil of writing */}
                          <span
                            aria-hidden="true"
                            className="font-serif-journal text-sm text-[var(--ink-muted)] filter blur-[5px] opacity-40 pointer-events-none truncate line-clamp-1 max-w-[70%]"
                          >
                            {entry.rawText.slice(0, 100) || 'Personal thoughts held safe in your private journal'}
                          </span>

                          {/* Reassuring privacy overlay with unmask button */}
                          <div className="absolute inset-0 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
                              <EyeOff className="w-3.5 h-3.5 text-[var(--accent-teal)] shrink-0" />
                              <span className="font-serif-journal italic text-[var(--ink-secondary)] text-xs">
                                Private entry · Content hidden
                              </span>
                            </div>

                            <button
                              id={`reveal-entry-btn-${entry.id}`}
                              type="button"
                              onClick={(e) => toggleReveal(entry.id, e)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[var(--border-card)] bg-[var(--bg-journal)] hover:bg-[var(--accent-gold-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-all cursor-pointer shadow-2xs shrink-0"
                              title="Click to reveal preview"
                              aria-label="Reveal private entry preview"
                            >
                              <Eye className="w-3 h-3 text-[var(--accent-teal)]" />
                              <span>Reveal</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          id={`private-revealed-content-${entry.id}`}
                          className="flex items-center justify-between gap-3 min-h-[1.75rem] py-0.5"
                        >
                          <p className="font-serif-journal text-sm text-[var(--ink-secondary)] truncate line-clamp-1 flex-1">
                            {entry.rawText}
                          </p>
                          <button
                            id={`hide-entry-btn-${entry.id}`}
                            type="button"
                            onClick={(e) => toggleReveal(entry.id, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[var(--border-card)] bg-[var(--bg-journal)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-all cursor-pointer shadow-2xs shrink-0"
                            title="Hide and re-blur preview"
                            aria-label="Hide private entry preview"
                          >
                            <EyeOff className="w-3 h-3 text-[var(--accent-teal)]" />
                            <span>Hide</span>
                          </button>
                        </div>
                      )
                    ) : (
                      <p className="font-serif-journal text-sm text-[var(--ink-secondary)] truncate line-clamp-1">
                        {entry.summary ? `“${entry.summary}”` : entry.rawText}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
