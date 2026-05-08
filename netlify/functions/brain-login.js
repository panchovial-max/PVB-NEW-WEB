// Master Brain PIN validation — server-side
// Validates PIN against env var and returns HMAC token
import { createHmac } from 'crypto';

const HMAC_SECRET = process.env.SUPABASE_SERVICE_KEY;

function createBrainToken() {
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const payload = `brain:${expires}`;
  const sig = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ scope: 'brain', expires, sig })).toString('base64');
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.BASE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"Method not allowed"}' };

  try {
    const { pin } = JSON.parse(event.body);
    const expectedPin = process.env.STUDIO_PIN || '1404';

    if (pin !== expectedPin) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'PIN incorrecto' }) };
    }

    const token = createBrainToken();
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, token }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
