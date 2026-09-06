/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ValidMood =
  | 'calm'
  | 'content'
  | 'energized'
  | 'frustrated'
  | 'anxious'
  | 'drained'
  | 'low'
  | 'numb';

export const ALL_MOODS: readonly ValidMood[] = [
  'calm',
  'content',
  'energized',
  'frustrated',
  'anxious',
  'drained',
  'low',
  'numb',
] as const;

export interface FourLayerReflection {
  surfaceThought: string;
  possibleAssumption: string;
  possibleFeeling: string;
  questionToSitWith: string;
}

export interface JournalEntry {
  id: string;
  rawText: string;              // Verbatim, never modified by AI
  summary: string | null;       // Condensation, null if reflectWithMe is false
  mood: ValidMood | null;       // Confirmed mood chip, null if private / reflectWithMe is false
  reflectWithMe: boolean;       // Whether AI reflection was enabled
  isPrivate?: boolean;          // Explicit privacy flag
  reflection?: FourLayerReflection | null; // Optional tentative four-layer breakdown
  createdAt: string;            // ISO timestamp
  cognitiveLoad?: number;       // Computed/derived 0-100 for Bandwidth Map (X)
  emotionalCapacity?: number;   // Computed/derived 0-100 for Bandwidth Map (Y)
}

export interface UserProfile {
  theme: 'day' | 'evening' | 'system';
  hasSeenReflectBanner?: boolean;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
}

export type ActiveTab = 'write' | 'analytics';

export type Screen = 'login' | 'main' | 'writing';
