import { createClient } from '@supabase/supabase-js';
import { createHmac, randomBytes } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Passwords stored in env vars (set in Netlify dashboard)
// KAYA_PASSWORD_AD and KAYA_PASSWORD_CLIENT
const HMAC_SECRET = process.env.SUPABASE_SERVICE_KEY; // reuse as HMAC secret

function createToken(role) {
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const payload = `${role}:${expires}`;
  const sig = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ role, expires, sig })).toString('base64');
}

function validateToken(token) {
  try {
    const { role, expires, sig } = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    if (Date.now() > expires) return null;
    const expected = createHmac('sha256', HMAC_SECRET).update(`${role}:${expires}`).digest('hex');
    if (sig !== expected) return null;
    return role;
  } catch {
    return null;
  }
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.BASE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // POST with action=login: validate password server-side
  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body);

    if (body.action === 'login') {
      const { password } = body;
      const adPassword = process.env.KAYA_PASSWORD_AD;
      const clientPassword = process.env.KAYA_PASSWORD_CLIENT;

      if (!adPassword || !clientPassword) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Callsheet passwords not configured' }) };
      }

      let role = null;
      if (password === adPassword) role = 'ad';
      else if (password === clientPassword) role = 'client';

      if (!role) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Contraseña incorrecta' }) };
      }

      const token = createToken(role);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, role, token }) };
    }

    // All other POST actions require valid token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing token' }) };
    }
    const role = validateToken(authHeader.substring(7));
    if (!role) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    // Save field (AD only)
    if (role !== 'ad') {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Read-only access' }) };
    }

    const { field_id, value } = body;
    const { error } = await supabase
      .from('kaya_callsheet_edits')
      .upsert({ field_id, value, updated_at: new Date().toISOString() }, { onConflict: 'field_id' });

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  // GET requires valid token
  if (event.httpMethod === 'GET') {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing token' }) };
    }
    const role = validateToken(authHeader.substring(7));
    if (!role) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    const { data, error } = await supabase
      .from('kaya_callsheet_edits')
      .select('field_id, value');

    if (error) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  }

  return { statusCode: 405, headers, body: '{"error":"Method not allowed"}' };
};
