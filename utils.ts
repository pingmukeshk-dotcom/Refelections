/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Strips all undefined values recursively from objects and arrays to ensure
 * clean payloads and prevent database driver rejections.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = stripUndefined(value);
      }
    }
    return result as T;
  }

  return obj;
}

/**
 * Defensive payload extractor that returns a safe object even if req.body is null or undefined.
 */
export function safeBody(body: unknown): Record<string, unknown> {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return {};
}
