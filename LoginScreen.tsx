/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Feather, Shield, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await login();
    } catch (err) {
      console.error('Sign in error:', err);
      setAuthError((err as Error).message || 'Unable to complete Google sign-in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      id="login-screen-container"
      className="min-h-screen flex flex-col justify-between px-6 py-12 journal-canvas"
    >
      <div className="max-w-md w-full mx-auto my-auto text-center space-y-8">
        {/* Emblem */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border shadow-md transition-transform hover:scale-105 duration-300"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-card)',
              color: 'var(--accent-gold)',
            }}
          >
            <Feather className="w-8 h-8" />
          </div>
        </div>

        {/* Title and Tagline */}
        <div className="space-y-4">
          <h1
            id="login-app-title"
            className="font-serif-journal text-4xl sm:text-5xl font-medium tracking-tight text-[var(--ink-primary)]"
          >
            Reflections
          </h1>
          <p
            id="login-tagline"
            className="font-serif-journal text-lg sm:text-xl italic leading-relaxed text-[var(--ink-secondary)] max-w-sm mx-auto"
          >
            “Most AI journals talk at you. Reflections stays quiet until you ask — and never reads what you keep private.”
          </p>
        </div>

        {/* Core Card */}
        <div
          className="rounded-2xl border p-8 space-y-6 shadow-md transition-all text-left"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-card)',
          }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent-gold)]">
              <Sparkles className="w-4 h-4" />
              <span>AI at the edges, never in the way</span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--ink-secondary)]">
              Write on an undisturbed page. Nothing responds while you type. Your raw words remain strictly yours, untouched and stored verbatim.
            </p>
          </div>

          {authError && (
            <div
              className="p-3 rounded-xl text-xs border bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900"
              role="alert"
            >
              {authError}
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              id="continue-with-google-button"
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium text-sm transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--ink-primary)',
                color: 'var(--bg-journal)',
              }}
            >
              {isSigningIn ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isSigningIn ? 'Opening journal...' : 'Continue with Google'}</span>
            </button>

            {/* Note on passwordless / delegated sign-in */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--ink-muted)] text-center pt-1">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Sign-in is passwordless and delegated to your Google account.</span>
            </div>
          </div>
        </div>

        {/* Security pledge */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--ink-muted)]">
          <Shield className="w-3.5 h-3.5 text-[var(--accent-teal)]" />
          <span>Per-user Firestore isolation & strict confidentiality</span>
        </div>
      </div>

      <footer className="text-center text-xs text-[var(--ink-muted)]">
        Reflections &middot; Private Journaling
      </footer>
    </div>
  );
};
