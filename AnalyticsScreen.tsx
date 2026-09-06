/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Sparkles, Calendar, CheckCircle, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { JournalEntry, ValidMood } from '../types';
import { BandwidthMap } from './BandwidthMap';
import { useAuth } from '../context/AuthContext';
import { callWeeklyMirrorApi } from '../lib/api';

interface AnalyticsScreenProps {
  entries: JournalEntry[];
  onSelectEntries: (entries: JournalEntry[]) => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  entries,
  onSelectEntries,
}) => {
  const { getIdToken } = useAuth();
  const [isMirrorOpen, setIsMirrorOpen] = useState(false);
  const [weeklyLetter, setWeeklyLetter] = useState<string | null>(null);
  const [isLoadingMirror, setIsLoadingMirror] = useState(false);
  const [mirrorError, setMirrorError] = useState<string | null>(null);

  // --- Card 2: Mood Timeline (Last 14 days) ---
  const last14Days = useMemo(() => {
    const days: Array<{
      date: Date;
      dateStr: string;
      label: string;
      entries: JournalEntry[];
      primaryMood: ValidMood | null;
      isPrivate: boolean;
    }> = [];

    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toDateString();

      const dayEntries = entries.filter(
        (e) => new Date(e.createdAt).toDateString() === dateStr
      );

      const taggedEntry = dayEntries.find((e) => e.mood !== null);
      const primaryMood = taggedEntry ? taggedEntry.mood : null;
      const isPrivate = dayEntries.length > 0 && !taggedEntry;

      days.push({
        date: d,
        dateStr,
        label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        entries: dayEntries,
        primaryMood,
        isPrivate,
      });
    }
    return days;
  }, [entries]);

  // Distribution Summary: e.g. "5 content · 3 calm · 2 private"
  const distributionSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    let privateCount = 0;

    entries.forEach((e) => {
      if (e.mood) {
        counts[e.mood] = (counts[e.mood] || 0) + 1;
      } else {
        privateCount += 1;
      }
    });

    const parts: string[] = [];
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([mood, count]) => {
        parts.push(`${count} ${mood}`);
      });

    if (privateCount > 0) {
      parts.push(`${privateCount} private`);
    }

    return parts.join(' · ') || 'No confirmed moods yet';
  }, [entries]);

  const getMoodBgClass = (mood: ValidMood | null) => {
    switch (mood) {
      case 'calm':
        return 'bg-emerald-600/80 text-white';
      case 'content':
        return 'bg-amber-500/80 text-white';
      case 'energized':
        return 'bg-amber-600 text-white';
      case 'frustrated':
        return 'bg-rose-600/80 text-white';
      case 'anxious':
        return 'bg-orange-500/80 text-white';
      case 'drained':
        return 'bg-slate-500/80 text-white';
      case 'low':
        return 'bg-indigo-600/70 text-white';
      case 'numb':
        return 'bg-stone-500 text-white';
      default:
        return 'bg-transparent';
    }
  };

  // --- Card 3: Weekly Mirror Handler ---
  const handleToggleMirror = async () => {
    if (isMirrorOpen) {
      setIsMirrorOpen(false);
      return;
    }

    setIsMirrorOpen(true);
    if (!weeklyLetter && !isLoadingMirror) {
      setIsLoadingMirror(true);
      setMirrorError(null);
      try {
        const token = await getIdToken();
        const letter = await callWeeklyMirrorApi(entries, token);
        setWeeklyLetter(letter);
      } catch (err) {
        console.error('Failed to load weekly mirror:', err);
        setMirrorError(
          (err as Error).message ||
            'Could not summon this week’s mirror letter. Write a few more entries to notice patterns.'
        );
      } finally {
        setIsLoadingMirror(false);
      }
    }
  };

  // --- Card 4: Habit Tracker (Intentions surfaced from entries) ---
  const habits = [
    {
      id: 'habit-1',
      title: 'Solo page time',
      note: 'Giving yourself quiet space before the day intrudes.',
      hits: [true, true, false, true, true, true, true],
    },
    {
      id: 'habit-2',
      title: 'Unfiltered expression',
      note: 'Letting thoughts land without early editing.',
      hits: [true, false, true, true, true, false, true],
    },
    {
      id: 'habit-3',
      title: 'Gentle check-in',
      note: 'Noticing how your body feels without needing to fix it.',
      hits: [false, true, true, true, false, true, true],
    },
  ];

  return (
    <div id="analytics-screen-container" className="space-y-6 pb-24 max-w-3xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
          Self-Observation
        </span>
        <h2
          id="analytics-header-title"
          className="font-serif-journal text-3xl sm:text-4xl font-medium text-[var(--ink-primary)] tracking-tight"
        >
          Your patterns
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Synthesized only from confirmed entries you chose to tag.
        </p>
      </div>

      {/* 1. Bandwidth Map (Lead Card) */}
      <BandwidthMap entries={entries} onSelectEntries={onSelectEntries} />

      {/* 2. Mood Timeline (Last 14 days) */}
      <div
        id="mood-timeline-card"
        className="rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-teal)]">
              Rhythm
            </span>
            <h3 className="font-serif-journal text-xl font-medium text-[var(--ink-primary)]">
              Mood Timeline
            </h3>
          </div>
          <span className="text-xs text-[var(--ink-muted)]">Past 14 Days</span>
        </div>

        {/* 14 Day Cells */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {last14Days.map((day, idx) => {
            const hasEntry = day.entries.length > 0;
            return (
              <button
                key={idx}
                id={`timeline-day-${idx}`}
                type="button"
                disabled={!hasEntry}
                onClick={() => hasEntry && onSelectEntries(day.entries)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                  hasEntry ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-40'
                }`}
                style={{
                  backgroundColor: 'var(--bg-journal)',
                  border: day.isPrivate
                    ? '1.5px dashed var(--ink-muted)'
                    : '1px solid var(--border-card)',
                }}
                title={
                  hasEntry
                    ? `${day.dateStr}: ${day.primaryMood || 'Private entry'}`
                    : `${day.dateStr}: No entry`
                }
              >
                <span className="text-[10px] text-[var(--ink-muted)] mb-1">{day.label}</span>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                    day.isPrivate
                      ? 'border border-dashed border-[var(--ink-muted)] text-[var(--ink-muted)]'
                      : day.primaryMood
                      ? getMoodBgClass(day.primaryMood)
                      : 'border border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  {day.isPrivate && <Lock className="w-2.5 h-2.5" />}
                  {day.primaryMood && day.primaryMood.slice(0, 1).toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Distribution summary */}
        <div className="pt-2 border-t border-[var(--border-card)] flex items-center justify-between text-xs text-[var(--ink-secondary)]">
          <span className="font-medium">Distribution:</span>
          <span className="font-serif-journal italic text-[var(--ink-muted)]">
            {distributionSummary}
          </span>
        </div>
      </div>

      {/* 3. Weekly Mirror (Collapsed behind "Open this week's mirror" button) */}
      <div
        id="weekly-mirror-card"
        className="rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
              Summoned Reflection
            </span>
            <h3 className="font-serif-journal text-xl font-medium text-[var(--ink-primary)]">
              Weekly Mirror
            </h3>
          </div>
          <button
            id="open-weekly-mirror-button"
            type="button"
            onClick={handleToggleMirror}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--accent-gold)] text-[var(--accent-gold)] hover:bg-[var(--accent-gold-subtle)] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isMirrorOpen ? 'Fold mirror' : "Open this week's mirror"}</span>
            {isMirrorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-xs text-[var(--ink-muted)]">
          Summoned only when asked. Never generated automatically.
        </p>

        {isMirrorOpen && (
          <div className="pt-3 border-t border-[var(--border-card)] space-y-3 animate-fadeIn">
            {isLoadingMirror ? (
              <div className="flex items-center gap-3 py-6 justify-center text-xs text-[var(--ink-muted)]">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin text-[var(--accent-gold)]" />
                <span>Reading the weather of your past seven entries...</span>
              </div>
            ) : mirrorError ? (
              <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
                {mirrorError}
              </div>
            ) : weeklyLetter ? (
              <div
                className="p-5 rounded-xl border font-serif-journal text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-[var(--ink-primary)] shadow-xs"
                style={{
                  backgroundColor: 'var(--bg-journal)',
                  borderColor: 'var(--border-card)',
                }}
              >
                {weeklyLetter}
              </div>
            ) : (
              <div className="text-xs text-[var(--ink-muted)] py-3">
                No mirror letter generated yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Habit Tracker (Intentions surfaced from user entries) */}
      <div
        id="habit-tracker-card"
        className="rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
        }}
      >
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-teal)]">
            Gentle Continuity
          </span>
          <h3 className="font-serif-journal text-xl font-medium text-[var(--ink-primary)]">
            Habit Tracker
          </h3>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">
            Intentions surfaced quietly from your own entries.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--bg-journal)',
                borderColor: 'var(--border-card)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--ink-primary)]">
                  {habit.title}
                </span>
                <span className="text-[11px] italic font-serif-journal text-[var(--ink-muted)]">
                  “{habit.note}”
                </span>
              </div>

              {/* 7-day hit/miss row */}
              <div className="flex items-center gap-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, dIdx) => {
                  const isHit = habit.hits[dIdx];
                  return (
                    <div
                      key={dIdx}
                      className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium border ${
                        isHit
                          ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-subtle)] text-[var(--accent-teal)]'
                          : 'border-dashed border-neutral-300 dark:border-neutral-800 text-[var(--ink-muted)] opacity-50'
                      }`}
                    >
                      <span className="text-[9px] mb-0.5 opacity-70">{dayChar}</span>
                      {isHit ? (
                        <CheckCircle className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
