// notion-proxy.js — Proxy autenticado para llamadas Notion desde studio.html
// Valida token PVB, luego reenvía a Notion API con la key del servidor

import { createHmac } from 'crypto';

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (payload.expires < Date.now()) return false;
    const secret = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const expected = createHmac('sha256', secret).update(`brain:${payload.expires}`).digest('hex');
    return payload.sig === expected;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verificar token PVB
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { endpoint, payload, method = 'POST' } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'Falta endpoint' });

  const NOTION_KEY = process.env.NOTION_API_KEY;
  if (!NOTION_KEY) return res.status(500).json({ error: 'NOTION_API_KEY no configurada' });

  try {
    const notionRes = await fetch(`https://api.notion.com${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      ...(payload ? { body: JSON.stringify(payload) } : {})
    });

    const data = await notionRes.json();
    return res.status(notionRes.status).json(data);
  } catch (err) {
    console.error('notion-proxy error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
