// Master Brain PIN validation — Vercel serverless
import { createHmac } from 'crypto';

function createBrainToken(secret) {
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const payload = `brain:${expires}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ scope: 'brain', expires, sig })).toString('base64');
}

export default async function handler(req, res) {
  const origin = process.env.BASE_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { pin } = req.body;
    const expectedPin = process.env.STUDIO_PIN || '1404';
    if (pin !== expectedPin) return res.status(401).json({ error: 'PIN incorrecto' });

    const secret = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const token = createBrainToken(secret);
    return res.status(200).json({ ok: true, token });
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
