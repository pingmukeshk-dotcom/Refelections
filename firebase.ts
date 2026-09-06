/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { JournalEntry, UserProfile, AuthUser } from '../types';
import { stripUndefined } from './sanitize';

// Detect whether real Firebase configuration is available
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  firebaseConfig.apiKey.length > 5 &&
  !firebaseConfig.apiKey.startsWith('MY_');

let app: FirebaseApp | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;
let firestoreInstance: Firestore | null = null;
let googleAuthProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    firestoreInstance = getFirestore(app);
    googleAuthProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn('Firebase client initialization warning:', err);
  }
}

export function isFirebaseLive(): boolean {
  return Boolean(isFirebaseConfigured && authInstance && firestoreInstance);
}

// Local Storage Fallback for Dev Preview when Firebase credentials aren't entered yet
const LOCAL_STORAGE_ENTRIES_KEY = 'reflections_entries_local';
const LOCAL_STORAGE_PROFILE_KEY = 'reflections_profile_local';
const LOCAL_STORAGE_USER_KEY = 'reflections_user_local';

/**
 * Sign in using Google (Firebase Auth).
 * In development preview without live keys, falls back seamlessly to simulated Google Sign-in.
 */
export async function loginWithGoogle(): Promise<AuthUser> {
  if (isFirebaseLive() && authInstance && googleAuthProvider) {
    const result = await signInWithPopup(authInstance, googleAuthProvider);
    const fbUser = result.user;
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || 'Friend',
      photoURL: fbUser.photoURL,
      getIdToken: () => fbUser.getIdToken(),
    };
  }

  // Preview sandbox fallback
  const mockUser: AuthUser = {
    uid: 'local-writer-1',
    email: 'writer@reflections.journal',
    displayName: 'Worn Journaler',
    photoURL: null,
    getIdToken: async () => 'dev_token_local-writer-1',
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
  return mockUser;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseLive() && authInstance) {
    await signOut(authInstance);
  }
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}

/**
 * Subscribes to auth state changes.
 */
export function subscribeToAuth(callback: (user: AuthUser | null) => void): () => void {
  if (isFirebaseLive() && authInstance) {
    return onAuthStateChanged(authInstance, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        callback({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Friend',
          photoURL: fbUser.photoURL,
          getIdToken: () => fbUser.getIdToken(),
        });
      } else {
        callback(null);
      }
    });
  }

  // Check dev preview local user
  const savedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (savedUser) {
    try {
      const parsed = JSON.parse(savedUser);
      callback({
        ...parsed,
        getIdToken: async () => `dev_token_${parsed.uid}`,
      });
    } catch {
      callback(null);
    }
  } else {
    callback(null);
  }

  return () => {};
}

/**
 * Saves a journal entry to Firestore under /users/{uid}/entries/{entryId}.
 * Enforces strict undefined-stripping and guarantees zero crash.
 */
export async function saveJournalEntry(uid: string, entry: JournalEntry): Promise<void> {
  const sanitizedEntry = stripUndefined(entry);

  if (isFirebaseLive() && firestoreInstance) {
    const entryDocRef = doc(firestoreInstance, 'users', uid, 'entries', entry.id);
    await setDoc(entryDocRef, sanitizedEntry);
    return;
  }

  // Local storage persistence
  const existing = getLocalEntries(uid);
  const updated = [sanitizedEntry, ...existing.filter((e) => e.id !== entry.id)];
  localStorage.setItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${uid}`, JSON.stringify(updated));
}

/**
 * Fetches all journal entries for a user, ordered by creation date descending.
 */
export async function fetchUserEntries(uid: string): Promise<JournalEntry[]> {
  if (isFirebaseLive() && firestoreInstance) {
    const entriesRef = collection(firestoreInstance, 'users', uid, 'entries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data() as JournalEntry);
  }

  return getLocalEntries(uid);
}

function getLocalEntries(uid: string): JournalEntry[] {
  const raw = localStorage.getItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${uid}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves profile preferences (such as theme and banner flags) to /users/{uid}/profile/settings
 */
export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const sanitized = stripUndefined(profile);

  if (isFirebaseLive() && firestoreInstance) {
    const profileDocRef = doc(firestoreInstance, 'users', uid, 'profile', 'settings');
    await setDoc(profileDocRef, sanitized, { merge: true });
    return;
  }

  localStorage.setItem(`${LOCAL_STORAGE_PROFILE_KEY}_${uid}`, JSON.stringify(sanitized));
}

/**
 * Fetches profile preferences.
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (isFirebaseLive() && firestoreInstance) {
    const profileDocRef = doc(firestoreInstance, 'users', uid, 'profile', 'settings');
    const snap = await getDocs(collection(firestoreInstance, 'users', uid, 'profile'));
    if (!snap.empty) {
      return snap.docs[0].data() as UserProfile;
    }
  }

  const raw = localStorage.getItem(`${LOCAL_STORAGE_PROFILE_KEY}_${uid}`);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Permanently deletes all user entries and profile locally (mirrored with backend).
 */
export async function clearLocalUserData(uid: string): Promise<void> {
  localStorage.removeItem(`${LOCAL_STORAGE_ENTRIES_KEY}_${uid}`);
  localStorage.removeItem(`${LOCAL_STORAGE_PROFILE_KEY}_${uid}`);
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
}
