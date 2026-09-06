/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, EyeOff, Eye, Lock, Calendar, ShieldCheck, HelpCircle } from 'lucide-react';
import { JournalEntry } from '../types';

interface DayDetailModalProps {
  entries: JournalEntry[];
  onClose: () => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ entries, onClose }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalBlurred, setIsModalBlurred] = useState(false);

  if (!entries || entries.length === 0) return null;

  const activeEntry = entries[selectedIndex] || entries[0];
  const isPrivate = Boolean(activeEntry.isPrivate || !activeEntry.reflectWithMe || !activeEntry.mood);
  const dateFormatted = new Date(activeEntry.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFormatted = new Date(activeEntry.createdAt).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      id="day-detail-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-detail-title"
    >
      <div
        id="day-detail-sheet"
        className="w-full max-w-2xl rounded-2xl border p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
          color: 'var(--ink-primary)',
        }}
      >
        {/* Header & Multi-date tabs if multiple entries */}
        <div className="space-y-4 border-b pb-4 border-[var(--border-card)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
              <Calendar className="w-4 h-4" />
              <span>Day View</span>
            </div>
            <button
              id="close-day-detail-button"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
              aria-label="Close day detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Multi-date tabs across top if more than one entry */}
          {entries.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {entries.map((entry, idx) => {
                const tabDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                });
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={entry.id}
                    id={`day-tab-${idx}`}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                      isSelected
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-subtle)] text-[var(--ink-primary)] font-semibold'
                        : 'border-[var(--border-card)] bg-[var(--bg-journal)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                    }`}
                  >
                    {tabDate} {entry.mood ? `· ${entry.mood}` : '· Private'}
                  </button>
                );
              })}
            </div>
          )}

          {/* Date & Mood indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="day-detail-title"
                className="font-serif-journal text-2xl font-medium tracking-tight text-[var(--ink-primary)]"
              >
                {dateFormatted}
              </h2>
              <span className="text-xs text-[var(--ink-muted)]">{timeFormatted}</span>
            </div>

            {!isPrivate && activeEntry.mood ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize border border-[var(--accent-gold)] bg-[var(--accent-gold-subtle)] text-[var(--ink-primary)]">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)]" />
                {activeEntry.mood}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[var(--ink-muted)]">
                <Lock className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                Private
              </span>
            )}
          </div>
        </div>

        {/* Private entry message or Summary */}
        {isPrivate ? (
          <div
            className="p-4 rounded-xl border flex items-start gap-3"
            style={{
              backgroundColor: 'var(--bg-journal)',
              borderColor: 'var(--border-card)',
            }}
          >
            <Lock className="w-4 h-4 text-[var(--accent-teal)] shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              This entry was written with reflection turned off. It was never read or tagged by AI.
            </p>
          </div>
        ) : (
          activeEntry.summary && (
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                backgroundColor: 'var(--bg-journal)',
                borderColor: 'var(--border-card)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent-teal)]">
                  Condensation
                </span>
                <span className="flex items-center gap-1 text-[11px] text-[var(--ink-muted)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                  <span>Raw text preserved verbatim</span>
                </span>
              </div>
              <p className="font-serif-journal text-sm leading-relaxed text-[var(--ink-primary)] italic">
                “{activeEntry.summary}”
              </p>
            </div>
          )
        )}

        {/* Verbatim Raw Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              Journal Text (Verbatim)
            </label>
            {isPrivate && (
              <button
                id="toggle-modal-blur-button"
                type="button"
                onClick={() => setIsModalBlurred(!isModalBlurred)}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] border border-[var(--border-card)] hover:bg-[var(--bg-journal)] transition-colors cursor-pointer"
                title={isModalBlurred ? 'Unblur and reveal text' : 'Blur text to hide from nearby onlookers'}
              >
                {isModalBlurred ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                    <span>Unblur text</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
                    <span>Blur text</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div
            className={`p-5 sm:p-6 rounded-xl border font-serif-journal text-base sm:text-lg leading-relaxed whitespace-pre-wrap text-[var(--ink-primary)] shadow-xs transition-all ${
              isPrivate && isModalBlurred ? 'filter blur-sm select-none opacity-40' : ''
            }`}
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-card)',
            }}
          >
            {activeEntry.rawText}
          </div>
          {isPrivate && isModalBlurred && (
            <p className="text-[11px] text-center italic text-[var(--ink-muted)] pt-1">
              Private journal text blurred for shoulder-surfing privacy. Tap 'Unblur text' above to reveal.
            </p>
          )}
        </div>

        {/* If four-layer reflection was recorded */}
        {activeEntry.reflection && (
          <div
            className="p-4 rounded-xl border space-y-3 text-xs"
            style={{
              backgroundColor: 'var(--bg-journal)',
              borderColor: 'var(--border-card)',
            }}
          >
            <span className="font-semibold uppercase tracking-wider text-[10px] text-[var(--accent-teal)]">
              Quiet Reflection
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-[var(--ink-muted)] block">Surface Thought</span>
                <p className="text-[var(--ink-secondary)] mt-0.5">
                  {activeEntry.reflection.surfaceThought}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-muted)] block">Possible Feeling</span>
                <p className="text-[var(--ink-secondary)] mt-0.5">
                  {activeEntry.reflection.possibleFeeling}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--ink-muted)] block">Question to Sit With</span>
                <p className="font-serif-journal italic text-[var(--ink-primary)] mt-0.5">
                  {activeEntry.reflection.questionToSitWith}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            id="dismiss-day-detail-button"
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-[var(--ink-primary)] border border-[var(--border-card)] hover:bg-[var(--bg-journal)] transition-colors cursor-pointer"
          >
            Done reading
          </button>
        </div>
      </div>
    </div>
  );
};
