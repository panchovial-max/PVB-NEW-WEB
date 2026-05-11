// telegram-notify.js — Envía notificaciones a Telegram desde agentes/sistema
// POST con { chat_id, message, level } y brain token en Authorization
// level: 'info' | 'success' | 'warning' | 'error'
import { createHmac } from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const HMAC_SECRET = process.env.SUPABASE_SERVICE_KEY;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID;

function verifyBrainToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (decoded.scope !== 'brain') return false;
    if (decoded.expires < Date.now()) return false;
    const payload = `brain:${decoded.expires}`;
    const expectedSig = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
    return decoded.sig === expectedSig;
  } catch {
    return false;
  }
}

const LEVEL_ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.BASE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"Method not allowed"}' };

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !verifyBrainToken(token)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { message, level = 'info', chat_id } = JSON.parse(event.body);
    if (!message) return { statusCode: 400, headers, body: JSON.stringify({ error: 'message required' }) };

    const targetChat = chat_id || OWNER_CHAT_ID;
    if (!targetChat) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No chat_id configured' }) };

    const icon = LEVEL_ICONS[level] || 'ℹ️';
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChat,
        text: `${icon} ${message}`,
        parse_mode: 'Markdown'
      })
    });

    const result = await res.json();
    if (!result.ok) throw new Error(result.description);

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
