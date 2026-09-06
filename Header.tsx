/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Feather, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { user } = useAuth();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 w-full border-b transition-colors backdrop-blur-md"
      style={{
        backgroundColor: 'var(--bg-journal)',
        borderColor: 'var(--border-journal)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              color: 'var(--accent-gold)',
            }}
          >
            <Feather className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif-journal text-xl font-medium tracking-tight text-[var(--ink-primary)]">
              Reflections
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-sans-journal text-[var(--ink-muted)]">
              — a quiet journal
            </span>
          </div>
        </div>

        {user && (
          <button
            id="user-avatar-settings-button"
            type="button"
            onClick={onOpenSettings}
            className="group flex items-center gap-2.5 p-1.5 pl-3 rounded-full border transition-all hover:shadow-xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
            }}
            title="Account and preferences"
            aria-label="Account and preferences"
          >
            <span className="text-xs font-medium text-[var(--ink-secondary)] group-hover:text-[var(--ink-primary)] transition-colors">
              {user.displayName?.split(' ')[0] || 'Journaler'}
            </span>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden border"
              style={{
                backgroundColor: 'var(--accent-gold-subtle)',
                borderColor: 'var(--border-card)',
                color: 'var(--accent-gold)',
              }}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
          </button>
        )}
      </div>
    </header>
  );
};
