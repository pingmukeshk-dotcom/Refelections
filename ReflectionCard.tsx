/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FourLayerReflection } from '../types';

interface ReflectionCardProps {
  reflection?: FourLayerReflection | null;
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({ reflection }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!reflection) return null;

  return (
    <div
      id="four-layer-reflection-container"
      className="mt-4 rounded-xl border transition-all overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-journal)',
        borderColor: 'var(--border-card)',
      }}
    >
      <button
        id="toggle-reflection-breakdown-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 text-xs font-medium text-[var(--accent-teal)] hover:opacity-90 transition-opacity text-left cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-gold)]" />
          <span>Want a reflection on this?</span>
        </span>
        <span className="flex items-center gap-1 text-[var(--ink-muted)]">
          <span className="text-[11px]">{isOpen ? 'Fold' : 'Unfold'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {isOpen && (
        <div className="p-4 pt-1 space-y-4 text-xs border-t border-[var(--border-card)] animate-fadeIn">
          {/* Preface */}
          <p className="italic text-[11px] text-[var(--ink-muted)]">
            “One way to read this, not the reading.”
          </p>

          <div className="space-y-3.5">
            {/* Layer 1: Surface thought */}
            <div className="space-y-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[var(--ink-muted)]">
                Surface Thought
              </span>
              <p className="text-[var(--ink-primary)] leading-relaxed">
                {reflection.surfaceThought}
              </p>
            </div>

            {/* Layer 2: Possible assumption */}
            <div className="space-y-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[var(--accent-teal)]">
                Possible Assumption
              </span>
              <p className="text-[var(--ink-secondary)] leading-relaxed">
                {reflection.possibleAssumption}
              </p>
            </div>

            {/* Layer 3: Possible feeling */}
            <div className="space-y-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[var(--accent-gold)]">
                Possible Feeling
              </span>
              <p className="text-[var(--ink-secondary)] leading-relaxed">
                {reflection.possibleFeeling}
              </p>
            </div>

            {/* Layer 4: A question to sit with */}
            <div
              className="p-3 rounded-lg border space-y-1"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-card)',
              }}
            >
              <div className="flex items-center gap-1.5 font-medium text-[var(--accent-gold)]">
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider text-[10px]">A Question to Sit With</span>
              </div>
              <p className="font-serif-journal text-sm italic text-[var(--ink-primary)] leading-relaxed">
                {reflection.questionToSitWith}
              </p>
            </div>
          </div>

          {/* Epilogue */}
          <p className="text-right italic text-[11px] text-[var(--ink-muted)]">
            “You know yourself better than I could.”
          </p>
        </div>
      )}
    </div>
  );
};
