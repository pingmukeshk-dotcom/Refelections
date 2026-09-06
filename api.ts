/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JournalEntry, ValidMood, FourLayerReflection } from '../types';

export interface ReflectResponse {
  summary: string;
  suggestedMood: ValidMood;
  reflection: FourLayerReflection;
}

export async function fetchStarterPrompt(): Promise<string> {
  try {
    const res = await fetch('/api/starter-prompt');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data.prompt || 'What felt unexpectedly heavy or light today?';
  } catch {
    return 'What felt unexpectedly heavy or light today?';
  }
}

export async function callReflectApi(
  rawText: string,
  token: string
): Promise<ReflectResponse> {
  const res = await fetch('/api/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rawText }),
  });

  if (!res.ok) {
    let errorMsg = 'Failed to analyze reflection';
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function callWeeklyMirrorApi(
  entries: JournalEntry[],
  token: string
): Promise<string> {
  const res = await fetch('/api/weekly-mirror', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      entries: entries.slice(0, 7).map((e) => ({
        rawText: e.rawText,
        mood: e.mood,
        createdAt: e.createdAt,
      })),
    }),
  });

  if (!res.ok) {
    let errorMsg = 'Could not summon Weekly Mirror';
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return data.letter;
}

export async function callExportDataApi(
  token: string,
  clientEntries: JournalEntry[] = []
): Promise<void> {
  const triggerDownload = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reflections-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  try {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ clientEntries }),
    });

    if (res.ok) {
      const blob = await res.blob();
      triggerDownload(blob);
      return;
    }
  } catch (err) {
    console.warn('Backend export encountered issue, activating client-side export fallback:', err);
  }

  // Resilient direct export fallback: guarantee data sovereignty
  const exportPayload = {
    app: 'Reflections',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    totalEntries: clientEntries.length,
    entries: clientEntries,
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob);
}

export async function callDeleteAccountApi(token: string): Promise<void> {
  const res = await fetch('/api/account/delete', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to permanently delete account data.');
  }
}
