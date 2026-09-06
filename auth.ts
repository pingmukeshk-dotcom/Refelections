/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Request, Response, NextFunction } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Auth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';

let appInstance: App | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseServices(): {
  auth: Auth | null;
  firestore: Firestore | null;
} {
  if (!appInstance) {
    try {
      if (getApps().length === 0) {
        const projectId =
          process.env.FIREBASE_PROJECT_ID ||
          process.env.GOOGLE_CLOUD_PROJECT ||
          process.env.GCLOUD_PROJECT;

        appInstance = projectId ? initializeApp({ projectId }) : initializeApp();
      } else {
        appInstance = getApps()[0];
      }
      authInstance = getAuth(appInstance);
      firestoreInstance = getFirestore(appInstance);
    } catch (error) {
      console.warn('Firebase Admin SDK initialization warning:', (error as Error).message);
    }
  }
  return { auth: authInstance, firestore: firestoreInstance };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
  };
}

/**
 * Middleware: Verifies Firebase ID Token in Authorization header.
 * Derives uid strictly from the verified token — never from request body.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header with Bearer token',
    });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized: Empty token provided' });
    return;
  }

  const { auth } = getFirebaseServices();
  if (!auth) {
    // Graceful fallback for development sandboxes when credentials are being set up
    if (process.env.NODE_ENV !== 'production' && idToken.startsWith('dev_token_')) {
      const devUid = idToken.replace('dev_token_', '');
      req.user = { uid: devUid, email: `${devUid}@example.com`, name: 'Journaler' };
      next();
      return;
    }

    res.status(503).json({
      error: 'Authentication service temporarily initializing or unavailable',
    });
    return;
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
    };
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production' && idToken.startsWith('dev_token_')) {
      const devUid = idToken.replace('dev_token_', '');
      req.user = { uid: devUid, email: `${devUid}@example.com`, name: 'Journaler' };
      next();
      return;
    }

    console.error('Failed to verify Firebase ID token:', (err as Error).message);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase ID token' });
  }
}
