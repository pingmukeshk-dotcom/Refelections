/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      id="error-notification-banner"
      role="alert"
      className="rounded-xl border p-4 mb-4 text-sm transition-all"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: '#D97706',
        color: 'var(--ink-primary)',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Save or Reflection Interrupted
            </p>
            <p className="mt-1 text-xs opacity-90 text-amber-800 dark:text-amber-300">
              {message}
            </p>
            <p className="mt-1 text-[11px] opacity-75">
              Your written words have been preserved in your editor.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              id="retry-action-button"
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-950 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:text-amber-100 dark:hover:bg-amber-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              id="dismiss-error-button"
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
