/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene):
 * Recursively strips undefined values so no undefined properties ever reach Firestore.
 */
export function stripUndefined<T>(value: T): T {
  if (value === null || value === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) {
        sanitized[key] = stripUndefined(val);
      }
    }
    return sanitized as T;
  }

  return value;
}
