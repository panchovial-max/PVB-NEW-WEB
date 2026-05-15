// telegram-notify.js — Envía notificaciones a Telegram desde agentes (Vercel)
import { createHmac } from 'crypto';

const LEVEL_ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

function verifyBrainToken(token, secret) {
  if (!secret) return false;
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (decoded.scope !== 'brain') return false;
    if (decoded.expires < Date.now()) return false;
    const expectedSig = createHmac('sha256', secret).update(`brain:${decoded.expires}`).digest('hex');
    return decoded.sig === expectedSig;
  } catch { return false; }
}

function escapeMarkdown(text) {
  return String(text).replace(/[_*`[]/g, '\\$&');
}

export default async function handler(req, res) {
  const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  const HMAC_SECRET = process.env.SUPABASE_SERVICE_KEY;
  const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID;

  res.setHeader('Access-Control-Allow-Origin', process.env.BASE_URL || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !verifyBrainToken(token, HMAC_SECRET)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { message, level = 'info', chat_id } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });
    const targetChat = chat_id || OWNER_CHAT_ID;
    if (!targetChat) return res.status(400).json({ error: 'No chat_id configured' });

    const icon = LEVEL_ICONS[level] || 'ℹ️';
    const result = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: targetChat, text: `${icon} ${escapeMarkdown(message)}`, parse_mode: 'Markdown' })
    }).then(r => r.json());

    if (!result.ok) throw new Error(result.description);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
