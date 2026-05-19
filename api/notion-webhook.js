// POST /api/notion-webhook — Receptor de webhooks Notion → Supabase
// Registrar en Notion con: node scripts/register-notion-webhook.js

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { fetchPage, upsertPage, detectDbName } from './notion-sync.js';

const WEBHOOK_SECRET = process.env.NOTION_WEBHOOK_SECRET;
const SUPABASE_URL   = process.env.SUPABASE_URL;
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function verifySignature(rawBody, signature) {
  if (!WEBHOOK_SECRET) return true; // skip en dev si no está configurado
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expected}`),
      Buffer.from(signature || '')
    );
  } catch {
    return false;
  }
}

export const config = {
  api: { bodyParser: false }, // necesitamos el raw body para verificar firma
};

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawBody  = await getRawBody(req);
  const sig      = req.headers['x-notion-signature'] || '';

  if (!verifySignature(rawBody, sig))
    return res.status(401).json({ error: 'Invalid signature' });

  let events;
  try {
    const parsed = JSON.parse(rawBody);
    events = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const tables   = ['notion_boletas', 'notion_proyectos', 'notion_suscripciones', 'notion_entregas'];

  for (const evt of events) {
    const entityType = evt.entity?.type;
    const entityId   = evt.entity?.id;
    const eventType  = evt.type;

    if (entityType !== 'page' || !entityId) continue;

    if (eventType === 'page.deleted') {
      for (const table of tables) {
        await supabase
          .from(table)
          .update({ estado: 'Eliminado', synced_at: new Date().toISOString() })
          .eq('notion_id', entityId);
      }
      continue;
    }

    try {
      const page   = await fetchPage(entityId);
      const dbName = detectDbName(page);
      if (!dbName) continue;

      await upsertPage(supabase, dbName, page);

      await supabase.from('notion_sync_log').insert({
        db_name: dbName, trigger: 'webhook', pages_synced: 1, status: 'ok',
      });
    } catch (err) {
      await supabase.from('notion_sync_log').insert({
        db_name: 'unknown', trigger: 'webhook', status: 'error', error: err.message,
      });
    }
  }

  // Responder rápido para que Notion no reintente
  return res.status(200).json({ ok: true });
}
