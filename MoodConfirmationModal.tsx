/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Feather, ShieldCheck } from 'lucide-react';
import { ALL_MOODS, ValidMood, FourLayerReflection } from '../types';
import { ReflectionCard } from './ReflectionCard';

interface MoodConfirmationModalProps {
  initialSuggestedMood: ValidMood;
  summary: string;
  reflection?: FourLayerReflection | null;
  onConfirm: (selectedMood: ValidMood) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const MoodConfirmationModal: React.FC<MoodConfirmationModalProps> = ({
  initialSuggestedMood,
  summary,
  reflection,
  onConfirm,
  onCancel,
  isSaving,
}) => {
  const [selectedMood, setSelectedMood] = useState<ValidMood>(initialSuggestedMood);

  return (
    <div
      id="mood-confirmation-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mood-sheet-title"
    >
      <div
        id="mood-confirmation-sheet"
        className="w-full max-w-lg rounded-2xl border p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
          color: 'var(--ink-primary)',
        }}
      >
        {/* Header */}
        <div className="space-y-1.5 border-b pb-4 border-[var(--border-card)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
            <Feather className="w-4 h-4" />
            <span>Gentle Impression</span>
          </div>
          <h2
            id="mood-sheet-title"
            className="font-serif-journal text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink-primary)]"
          >
            Felt like: <span className="capitalize text-[var(--accent-gold)]">{initialSuggestedMood}</span>?
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">
            Tap to confirm or choose the tone that fits your truth best:
          </p>
        </div>

        {/* 8 Tappable Mood Chips */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
            Confirmed Mood:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_MOODS.map((m) => {
              const isSelected = selectedMood === m;
              return (
                <button
                  key={m}
                  id={`mood-chip-${m}`}
                  type="button"
                  onClick={() => setSelectedMood(m)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium capitalize transition-all border cursor-pointer ${
                    isSelected
                      ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-subtle)] text-[var(--ink-primary)] font-semibold shadow-xs ring-1 ring-[var(--accent-gold)]'
                      : 'border-[var(--border-card)] bg-[var(--bg-journal)] text-[var(--ink-secondary)] hover:border-[var(--ink-muted)]'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-gold)]" />}
                  <span>{m}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Card (labelled as condensation) */}
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
              <ShieldCheck className="w-3 h-3 text-[var(--accent-teal)]" />
              <span>Raw words kept whole</span>
            </span>
          </div>
          <p className="font-serif-journal text-sm leading-relaxed text-[var(--ink-primary)] italic">
            “{summary}”
          </p>
        </div>

        {/* Optional 4-layer reflection */}
        <ReflectionCard reflection={reflection} />

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--border-card)]">
          <button
            id="cancel-mood-confirmation-button"
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
          >
            Back to editor
          </button>
          <button
            id="confirm-save-entry-button"
            type="button"
            onClick={() => onConfirm(selectedMood)}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: 'var(--ink-primary)',
              color: 'var(--bg-journal)',
            }}
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Saving into journal...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save to Journal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
