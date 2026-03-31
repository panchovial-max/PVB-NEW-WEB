// Shared auth utility — supports Supabase JWT and Studio HMAC tokens
import { createHmac } from 'crypto';
import { validateUserSession } from './supabase.js';

const HMAC_SECRET = process.env.SUPABASE_SERVICE_KEY;

/**
 * Creates a time-limited HMAC token for studio/standalone pages.
 * @param {string} scope - Token scope (e.g., 'studio', 'callsheet')
 * @returns {string} Base64 encoded token
 */
export function createStudioToken(scope = 'studio') {
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const payload = `${scope}:${expires}`;
  const sig = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ scope, expires, sig })).toString('base64');
}

/**
 * Validates a Studio HMAC token.
 * @returns {string|null} The scope if valid, null otherwise
 */
export function validateStudioToken(token) {
  try {
    const { scope, expires, sig } = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (Date.now() > expires) return null;
    const expected = createHmac('sha256', HMAC_SECRET).update(`${scope}:${expires}`).digest('hex');
    if (sig !== expected) return null;
    return scope;
  } catch {
    return null;
  }
}

/**
 * Validates a Bearer token — tries Supabase JWT first, then Studio HMAC.
 * Returns { type: 'supabase', user } or { type: 'studio', scope } or null.
 */
export async function validateAnyToken(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);

  // Try Supabase JWT first
  const user = await validateUserSession(token);
  if (user) return { type: 'supabase', user };

  // Try Studio HMAC
  const scope = validateStudioToken(token);
  if (scope) return { type: 'studio', scope };

  return null;
}
