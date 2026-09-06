/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, EyeOff, Info, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { callReflectApi, ReflectResponse } from '../lib/api';
import { saveJournalEntry, fetchUserProfile, saveUserProfile } from '../lib/firebase';
import { JournalEntry, ValidMood } from '../types';
import { MoodConfirmationModal } from './MoodConfirmationModal';
import { ErrorBanner } from './ErrorBanner';

interface WritingScreenProps {
  starterPrompt: string;
  onBack: () => void;
  onEntrySaved: () => void;
}

export const WritingScreen: React.FC<WritingScreenProps> = ({
  starterPrompt,
  onBack,
  onEntrySaved,
}) => {
  const { user, getIdToken } = useAuth();
  const [text, setText] = useState('');
  const [reflectWithMe, setReflectWithMe] = useState(true);
  const [hasSeenBanner, setHasSeenBanner] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reflectionResult, setReflectionResult] = useState<ReflectResponse | null>(null);
  const [privateSaveFeedback, setPrivateSaveFeedback] = useState<string | null>(null);

  // Check if one-time banner was seen
  useEffect(() => {
    const checkBannerState = async () => {
      const localSeen = localStorage.getItem('reflections_seen_reflect_banner');
      if (localSeen === 'true') {
        setHasSeenBanner(true);
        return;
      }
      if (user) {
        try {
          const profile = await fetchUserProfile(user.uid);
          if (profile?.hasSeenReflectBanner) {
            setHasSeenBanner(true);
            localStorage.setItem('reflections_seen_reflect_banner', 'true');
          }
        } catch {
          // ignore
        }
      }
    };
    checkBannerState();
  }, [user]);

  const dismissBanner = async () => {
    setHasSeenBanner(true);
    localStorage.setItem('reflections_seen_reflect_banner', 'true');
    if (user) {
      try {
        await saveUserProfile(user.uid, { theme: 'system', hasSeenReflectBanner: true });
      } catch {
        // ignore
      }
    }
  };

  // Derive coordinates for the Bandwidth map based on mood
  const getCoordinatesForMood = (mood: ValidMood | null) => {
    switch (mood) {
      case 'calm':
        return { cognitiveLoad: 25, emotionalCapacity: 80 };
      case 'content':
        return { cognitiveLoad: 35, emotionalCapacity: 75 };
      case 'energized':
        return { cognitiveLoad: 68, emotionalCapacity: 82 };
      case 'frustrated':
        return { cognitiveLoad: 78, emotionalCapacity: 38 };
      case 'anxious':
        return { cognitiveLoad: 88, emotionalCapacity: 28 };
      case 'drained':
        return { cognitiveLoad: 82, emotionalCapacity: 18 };
      case 'low':
        return { cognitiveLoad: 62, emotionalCapacity: 22 };
      case 'numb':
        return { cognitiveLoad: 45, emotionalCapacity: 15 };
      default:
        return { cognitiveLoad: 50, emotionalCapacity: 50 };
    }
  };

  const handleDone = async () => {
    if (!text.trim()) {
      setError('Please write a few words before tapping Done.');
      return;
    }

    setError(null);

    // Case 1: Reflect with me is OFF -> Save raw text only, NO Gemini call
    if (!reflectWithMe) {
      setIsSaving(true);
      try {
        if (!user) throw new Error('You must be signed in to save entries.');

        const coords = getCoordinatesForMood(null);
        const newEntry: JournalEntry = {
          id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          rawText: text.trim(),
          summary: null,
          mood: null,
          reflectWithMe: false,
          isPrivate: true,
          reflection: null,
          createdAt: new Date().toISOString(),
          cognitiveLoad: coords.cognitiveLoad,
          emotionalCapacity: coords.emotionalCapacity,
        };

        await saveJournalEntry(user.uid, newEntry);
        setPrivateSaveFeedback('Saved — just yours, unread and untagged.');
        setTimeout(() => {
          onEntrySaved();
        }, 1200);
      } catch (err) {
        console.error('Save failed:', err);
        setError((err as Error).message || 'Failed to save your private entry. Please retry.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Case 2: Reflect with me is ON -> Backend calls Gemini proxy with Fallback Ladder
    setIsReflecting(true);
    try {
      const token = await getIdToken();
      const analysis = await callReflectApi(text.trim(), token);
      setReflectionResult(analysis);
    } catch (err) {
      console.error('Reflection analysis error:', err);
      setError(
        (err as Error).message ||
          'Could not complete reflection with AI. You can still save this entry directly.'
      );
    } finally {
      setIsReflecting(false);
    }
  };

  // Called when user confirms mood chip inside the modal
  const handleConfirmMood = async (confirmedMood: ValidMood) => {
    if (!user) return;
    setIsSaving(true);
    setError(null);

    try {
      const coords = getCoordinatesForMood(confirmedMood);
      const newEntry: JournalEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        rawText: text.trim(),
        summary: reflectionResult?.summary || null,
        mood: confirmedMood,
        reflectWithMe: true,
        reflection: reflectionResult?.reflection || null,
        createdAt: new Date().toISOString(),
        cognitiveLoad: coords.cognitiveLoad,
        emotionalCapacity: coords.emotionalCapacity,
      };

      await saveJournalEntry(user.uid, newEntry);
      setReflectionResult(null);
      onEntrySaved();
    } catch (err) {
      console.error('Save failed on confirmation:', err);
      setError((err as Error).message || 'Failed to save entry to your journal. Your words are safe.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="writing-screen-container"
      className="min-h-[calc(100vh-4rem)] pb-24 px-4 sm:px-6 pt-6 max-w-3xl mx-auto flex flex-col"
    >
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          id="writing-back-button"
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer py-1.5 px-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Leave page</span>
        </button>

        {/* Reflect with me Toggle */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="reflect-with-me-toggle"
            className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[var(--ink-secondary)] select-none"
          >
            {reflectWithMe ? (
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
            )}
            <span>Reflect with me</span>
          </label>
          <button
            id="reflect-with-me-toggle"
            type="button"
            role="switch"
            aria-checked={reflectWithMe}
            onClick={() => setReflectWithMe(!reflectWithMe)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              reflectWithMe ? 'bg-[var(--accent-gold)]' : 'bg-neutral-300 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                reflectWithMe ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && (
        <ErrorBanner
          message={error}
          onRetry={handleDone}
          onDismiss={() => setError(null)}
        />
      )}

      {/* One-time inline banner when Reflect with me is ON */}
      {reflectWithMe && !hasSeenBanner && (
        <div
          id="one-time-reflect-banner"
          className="mb-6 rounded-xl border p-4 text-xs space-y-2 relative transition-all"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-card)',
            color: 'var(--ink-secondary)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--accent-gold)] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                I’ll offer a starting point and quietly note each entry’s mood for your patterns — flip me off any time to write completely alone, nothing read or tagged.
              </p>
            </div>
            <button
              id="dismiss-reflect-banner-button"
              type="button"
              onClick={dismissBanner}
              className="text-[11px] font-medium text-[var(--accent-gold)] hover:underline shrink-0"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Status Notice when Reflect with me is OFF */}
      {!reflectWithMe && (
        <div
          id="private-mode-notice"
          className="mb-4 flex items-center gap-2 text-xs py-2 px-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-card)',
            color: 'var(--ink-muted)',
          }}
        >
          <EyeOff className="w-3.5 h-3.5 text-[var(--accent-teal)] shrink-0" />
          <span>This entry will not be read or tagged.</span>
        </div>
      )}

      {/* Gentle starter prompt on top of page (hidden when Reflect is OFF) */}
      {reflectWithMe && starterPrompt && (
        <div className="mb-6 px-1">
          <p className="font-serif-journal text-base sm:text-lg italic text-[var(--ink-muted)]">
            {starterPrompt}
          </p>
        </div>
      )}

      {/* Silent Distraction-Free Serif Writing Area */}
      <div className="flex-1 flex flex-col mb-4">
        <textarea
          id="journal-writing-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="The page is quiet. Begin anywhere..."
          autoFocus
          className="w-full flex-1 min-h-[350px] p-4 sm:p-6 rounded-2xl font-serif-journal text-lg sm:text-xl leading-relaxed resize-none border focus:outline-hidden transition-colors"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-card)',
            color: 'var(--ink-primary)',
          }}
        />
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-[var(--ink-muted)]">
          {text.trim().split(/\s+/).filter(Boolean).length} words
        </div>

        <button
          id="done-writing-button"
          type="button"
          onClick={handleDone}
          disabled={isReflecting || isSaving || !text.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm shadow-xs transition-all cursor-pointer disabled:opacity-40"
          style={{
            backgroundColor: 'var(--ink-primary)',
            color: 'var(--bg-journal)',
          }}
        >
          {isReflecting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Quietly reflecting...</span>
            </>
          ) : isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Done</span>
          )}
        </button>
      </div>

      {/* Feedback toast for private entries */}
      {privateSaveFeedback && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{privateSaveFeedback}</span>
        </div>
      )}

      {/* Mood confirmation sheet (Screen 3 done sheet with reflect ON) */}
      {reflectionResult && (
        <MoodConfirmationModal
          initialSuggestedMood={reflectionResult.suggestedMood}
          summary={reflectionResult.summary}
          reflection={reflectionResult.reflection}
          onConfirm={handleConfirmMood}
          onCancel={() => setReflectionResult(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
