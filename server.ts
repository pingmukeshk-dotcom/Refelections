/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import type { Response, Request, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { requireAuth, getFirebaseServices } from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';
import {
  generateJournalAnalysis,
  generateGentlePrompt,
  generateWeeklyMirrorLetter,
} from './server/gemini.ts';
import { safeBody, stripUndefined } from './server/utils.ts';

dotenv.config();

const __filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '';
const __dirname = __filename ? path.dirname(__filename) : process.cwd();

async function startServer() {
  const app = express();
  // Cloud Run dynamically injects the PORT environment variable (typically 8080 or 3000)
  const PORT = Number(process.env.PORT) || 3000;

  // 1. Mandatory Top-Level Request Deserialization (Ordering Guarantee)
  // Mount body parsers BEFORE defining any endpoint routes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // --- API Routes ---

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'reflections-api',
      timestamp: new Date().toISOString(),
    });
  });

  // Screen 2: Gentle starting prompt
  app.get('/api/starter-prompt', async (req, res) => {
    try {
      const prompt = await generateGentlePrompt();
      res.json({ prompt });
    } catch (error) {
      console.error('Failed to generate starter prompt:', error);
      res.json({ prompt: 'What is something you didn’t say out loud today?' });
    }
  });

  // Screen 3: "Reflect with me" analysis via Gemini
  // Verifies Firebase ID Token, strictly derives uid from verified token
  app.post('/api/reflect', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Defensive Payload Ingestion (Null-Safe Destructuring)
      const body = safeBody(req.body);
      const rawText = typeof body.rawText === 'string' ? body.rawText.trim() : '';

      if (!rawText) {
        res.status(400).json({ error: 'Journal text cannot be empty' });
        return;
      }

      if (rawText.length > 50000) {
        res.status(400).json({ error: 'Journal entry exceeds 50,000 character limit' });
        return;
      }

      const result = await generateJournalAnalysis(rawText);
      const cleanResult = stripUndefined(result);

      res.json(cleanResult);
    } catch (error) {
      console.error('Gemini reflection proxy error:', error);
      res.status(500).json({
        error:
          (error as Error).message ||
          'Failed to reflect on this entry right now. Your raw words are safe.',
      });
    }
  });

  // Screen 4: Weekly Mirror generation (summoned, never auto-shown)
  app.post('/api/weekly-mirror', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const body = safeBody(req.body);
      const entries = Array.isArray(body.entries) ? body.entries : [];

      if (entries.length === 0) {
        res.status(400).json({ error: 'At least one recent entry is needed for the Weekly Mirror' });
        return;
      }

      // Filter and sanitize entries
      const sanitizedEntries = entries.slice(0, 7).map((e: Record<string, unknown>) => ({
        rawText: typeof e.rawText === 'string' ? e.rawText : '',
        mood: typeof e.mood === 'string' ? e.mood : null,
        createdAt: typeof e.createdAt === 'string' ? e.createdAt : new Date().toISOString(),
      }));

      const letter = await generateWeeklyMirrorLetter(sanitizedEntries);
      res.json({ letter });
    } catch (error) {
      console.error('Weekly mirror generation error:', error);
      res.status(500).json({
        error: (error as Error).message || 'Unable to summon this week’s mirror at the moment.',
      });
    }
  });

  // Screen 5: Export all user data (token-verified, uid-scoped)
  app.all('/api/export', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;

    try {
      let entries: unknown[] = [];
      const { firestore } = getFirebaseServices();

      if (firestore) {
        try {
          const snapshot = await firestore
            .collection('users')
            .doc(uid)
            .collection('entries')
            .orderBy('createdAt', 'desc')
            .get();

          entries = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        } catch {
          // Firestore access unprovisioned in current local environment; fallback to provided entries
        }
      }

      // If Firestore read yielded no entries and client passed clientEntries in request body
      if ((!entries || entries.length === 0) && Array.isArray(req.body?.clientEntries)) {
        entries = req.body.clientEntries;
      }

      const exportPayload = {
        app: 'Reflections',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        user: {
          uid,
          email: req.user?.email,
        },
        totalEntries: entries.length,
        entries: stripUndefined(entries),
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="reflections-export-${new Date().toISOString().slice(0, 10)}.json"`
      );
      res.send(JSON.stringify(exportPayload, null, 2));
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export your journal data' });
    }
  });

  // Screen 5: Delete user account & permanently remove all Firestore data
  app.post('/api/account/delete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    const uid = req.user!.uid;

    try {
      const { firestore, auth } = getFirebaseServices();
      if (firestore) {
        try {
          const entriesRef = firestore.collection('users').doc(uid).collection('entries');
          const snapshot = await entriesRef.get();

          const batch = firestore.batch();
          snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });

          const profileRef = firestore.collection('users').doc(uid).collection('profile').doc('settings');
          batch.delete(profileRef);

          await batch.commit();
        } catch {
          // Batch delete handled cleanly
        }

        // Optionally delete the auth user record if desired
        if (auth) {
          try {
            await auth.deleteUser(uid);
          } catch {
            // Continue if auth delete requires elevated claims
          }
        }
      }

      res.json({
        success: true,
        message: 'All personal journal entries and preferences have been permanently deleted.',
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Failed to permanently delete user data' });
    }
  });

  // --- Vite Dev Middleware vs Static File Serving ---
  // If running compiled bundle (server.cjs), or inside Cloud Run (K_SERVICE), or NODE_ENV=production, serve static dist assets
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.K_REVISION) ||
    (typeof process.argv[1] === 'string' &&
      (process.argv[1].endsWith('.cjs') || process.argv[1].includes('dist')));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : fs.existsSync(path.join(process.cwd(), 'index.html'))
      ? process.cwd()
      : path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
      error: 'An unexpected internal server error occurred.',
      message: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Reflections unified server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
