/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Laptop,
  Download,
  Trash2,
  AlertTriangle,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { callExportDataApi, callDeleteAccountApi } from '../lib/api';
import { clearLocalUserData, fetchUserEntries } from '../lib/firebase';

interface SettingsModalProps {
  onClose: () => void;
  onDataDeleted: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onDataDeleted }) => {
  const { user, logout, getIdToken } = useAuth();
  const { theme, setTheme } = useTheme();

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Two-step destructive delete state
  const [showDeleteStep, setShowDeleteStep] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Row 1: Appearance handler
  const handleThemeChange = async (newTheme: 'day' | 'evening' | 'system') => {
    await setTheme(newTheme, user?.uid);
  };

  // Row 2: Export handler
  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const token = await getIdToken();
      let entries: any[] = [];
      if (user?.uid) {
        try {
          entries = await fetchUserEntries(user.uid);
        } catch {
          // If fetch fails, proceed with empty array fallback
        }
      }
      await callExportDataApi(token, entries);
    } catch (err) {
      console.error('Export failed:', err);
      setExportError((err as Error).message || 'Failed to download journal export.');
    } finally {
      setIsExporting(false);
    }
  };

  // Row 3: Delete handler (Step 2 confirmation)
  const handlePermanentDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const token = await getIdToken();
      await callDeleteAccountApi(token);
      await clearLocalUserData(user.uid);
      await logout();
      onDataDeleted();
      onClose();
    } catch (err) {
      console.error('Delete account failed:', err);
      setDeleteError((err as Error).message || 'Could not complete permanent deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div
        id="settings-dialog-card"
        className="w-full max-w-lg rounded-2xl border p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-card)',
          color: 'var(--ink-primary)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 border-[var(--border-card)]">
          <div>
            <h2
              id="settings-dialog-title"
              className="font-serif-journal text-2xl font-medium tracking-tight text-[var(--ink-primary)]"
            >
              Account &amp; Journal Settings
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">
              {user?.email || 'Private session'}
            </p>
          </div>
          <button
            id="close-settings-modal-button"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Exactly Three Rows Only */}
        <div className="divide-y divide-[var(--border-card)] space-y-4">
          {/* Row 1: Appearance (Day/Evening theme) */}
          <div className="pt-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] block">
              1. Appearance
            </label>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--ink-primary)]">
                  Journal Palette
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Aged amber paper by day, warm espresso leather by night.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-card)] bg-[var(--bg-journal)]">
                <button
                  id="theme-button-day"
                  type="button"
                  onClick={() => handleThemeChange('day')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    theme === 'day'
                      ? 'bg-[var(--bg-card)] text-[var(--accent-gold)] shadow-xs font-semibold'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                  title="Day theme"
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Day</span>
                </button>

                <button
                  id="theme-button-evening"
                  type="button"
                  onClick={() => handleThemeChange('evening')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    theme === 'evening'
                      ? 'bg-[var(--bg-card)] text-[var(--accent-gold)] shadow-xs font-semibold'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                  title="Evening theme"
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Evening</span>
                </button>

                <button
                  id="theme-button-system"
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-[var(--bg-card)] text-[var(--accent-gold)] shadow-xs'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
                  }`}
                  title="System preference"
                  aria-label="System preference"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Export my data */}
          <div className="pt-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] block">
              2. Data Sovereignty
            </label>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--ink-primary)]">
                  Export my data
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  Download every entry in verbatim JSON format.
                </p>
              </div>

              <button
                id="export-data-button"
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-[var(--border-card)] hover:border-[var(--accent-gold)] text-[var(--ink-primary)] bg-[var(--bg-journal)] hover:bg-[var(--accent-gold-subtle)] transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                <span>{isExporting ? 'Packaging...' : 'Download JSON'}</span>
              </button>
            </div>
            {exportError && (
              <p className="text-xs text-red-600 dark:text-red-400">{exportError}</p>
            )}
          </div>

          {/* Row 3: Delete my account (Two-step destructive confirm) */}
          <div className="pt-4 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
              3. Permanent Removal
            </label>

            {!showDeleteStep ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                    Delete my account
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Permanently destroy all journal entries and profile data.
                  </p>
                </div>
                <button
                  id="initiate-account-deletion-button"
                  type="button"
                  onClick={() => setShowDeleteStep(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete account</span>
                </button>
              </div>
            ) : (
              /* Two-step destructive confirmation sheet */
              <div
                id="destructive-delete-confirmation-box"
                className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 space-y-3 animate-fadeIn"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                      Are you sure? This cannot be undone.
                    </p>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                      We strongly recommend clicking <strong>Download JSON</strong> above to save a backup copy of your thoughts first. All Firestore records under your account will be immediately deleted.
                    </p>
                  </div>
                </div>

                {deleteError && (
                  <p className="text-xs text-rose-700 dark:text-rose-300">{deleteError}</p>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    id="cancel-delete-account-button"
                    type="button"
                    onClick={() => setShowDeleteStep(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-white dark:bg-neutral-900 text-[var(--ink-primary)] border border-[var(--border-card)] hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Keep my journal
                  </button>
                  <button
                    id="confirm-delete-everything-button"
                    type="button"
                    onClick={handlePermanentDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                    <span>Delete everything</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sign Out Action */}
        <div className="pt-4 border-t border-[var(--border-card)] flex items-center justify-between">
          <button
            id="sign-out-button"
            type="button"
            onClick={async () => {
              await logout();
              onClose();
            }}
            className="flex items-center gap-2 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out of Reflections</span>
          </button>
          <button
            id="done-settings-button"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--ink-primary)] text-[var(--bg-journal)] hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
