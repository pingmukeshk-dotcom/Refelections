/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PenLine, Compass } from 'lucide-react';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--bg-journal)',
        borderColor: 'var(--border-journal)',
      }}
    >
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
        <button
          id="nav-tab-write"
          type="button"
          onClick={() => onSelectTab('write')}
          className={`flex flex-col items-center justify-center gap-1 w-24 py-1 rounded-xl transition-all ${
            activeTab === 'write'
              ? 'text-[var(--accent-gold)] font-medium scale-102'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]'
          }`}
          aria-selected={activeTab === 'write'}
          role="tab"
        >
          <PenLine className="w-5 h-5" />
          <span className="text-xs tracking-wide">Write</span>
        </button>

        <div
          className="w-px h-6 opacity-30"
          style={{ backgroundColor: 'var(--border-journal)' }}
        />

        <button
          id="nav-tab-analytics"
          type="button"
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center justify-center gap-1 w-24 py-1 rounded-xl transition-all ${
            activeTab === 'analytics'
              ? 'text-[var(--accent-gold)] font-medium scale-102'
              : 'text-[var(--ink-muted)] hover:text-[var(--ink-secondary)]'
          }`}
          aria-selected={activeTab === 'analytics'}
          role="tab"
        >
          <Compass className="w-5 h-5" />
          <span className="text-xs tracking-wide">Analytics</span>
        </button>
      </div>
    </nav>
  );
};
