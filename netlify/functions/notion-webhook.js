// notion-webhook.js — Recibe eventos de Notion y notifica por Telegram
// Eventos: cambios en Proyectos, Boletas, Entregas
// Notion envía POST con header Notion-Webhook-Signature para verificar

import { createHmac } from 'crypto';

const BOT_TOKEN_URL = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID;
const WEBHOOK_SECRET = process.env.NOTION_WEBHOOK_SECRET;

function verifySignature(body, signature) {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
  return `sha256=${expected}` === signature;
}

async function sendTelegram(text) {
  if (!OWNER_CHAT_ID) return;
  await fetch(`${BOT_TOKEN_URL()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: OWNER_CHAT_ID,
      text,
      parse_mode: 'Markdown'
    })
  });
}

function escapeMarkdown(text) {
  return String(text || '').replace(/[_*`[]/g, '\\$&');
}

// Mapea IDs de databases a nombres legibles
const DB_NAMES = {
  '3337ab7f-975e-81e2-a15d-fb2e6071f1bf': '🧾 Boletas y Gastos',
  '3337ab7f-975e-81b4-8045-d33fe1515aca': '🎬 Proyectos',
  '3337ab7f-975e-812c-a0ed-e6af65288d67': '📦 Entregas',
  '3337ab7f-975e-8132-9caf-dad72d6a9233': '🎨 Assets Creativos',
  '3337ab7f-975e-8151-95e0-ca9568b29bcb': '💻 Suscripciones',
};

const ESTADO_ICONS = {
  'Brief': '📋', 'Pre-produccion': '🔍', 'Produccion': '🎬',
  'Post-produccion': '✂️', 'Entregado': '✅', 'Archivado': '📁',
  'Pendiente': '🟡', 'Procesada': '🟢', 'Error OCR': '🔴'
};

async function handlePageEvent(event) {
  const { type, page, database_id } = event;
  const dbName = DB_NAMES[database_id] || 'Notion';
  const props = page?.properties || {};

  // Obtener título de la página
  const titleProp = Object.values(props).find(p => p.type === 'title');
  const title = titleProp?.title?.[0]?.plain_text || 'Sin título';

  // Obtener estado si existe
  const estadoProp = props.Estado?.select?.name || props.Status?.select?.name || '';
  const estadoIcon = ESTADO_ICONS[estadoProp] || '';

  switch (type) {
    case 'page.created':
      await sendTelegram(
        `✨ *Nueva entrada en ${dbName}*\n\n*${escapeMarkdown(title)}*${estadoProp ? `\nEstado: ${estadoIcon} ${estadoProp}` : ''}\n\n[Ver en Notion](${page.url})`
      );
      break;

    case 'page.updated':
      await sendTelegram(
        `📝 *Actualizado en ${dbName}*\n\n*${escapeMarkdown(title)}*${estadoProp ? `\nEstado: ${estadoIcon} ${estadoProp}` : ''}\n\n[Ver en Notion](${page.url})`
      );
      break;

    case 'page.deleted':
      await sendTelegram(
        `🗑️ *Eliminado de ${dbName}*\n\n*${escapeMarkdown(title)}*`
      );
      break;
  }
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"Method not allowed"}' };

  const rawBody = event.body;
  const signature = event.headers['notion-webhook-signature'] || event.headers['Notion-Webhook-Signature'];

  // Verificar firma si hay secret configurado
  if (WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
  }

  try {
    const payload = JSON.parse(rawBody);

    // Notion envía verification challenge al registrar el webhook
    if (payload.verification_token) {
      return { statusCode: 200, headers, body: JSON.stringify({ challenge: payload.verification_token }) };
    }

    const { type } = payload;

    if (type?.startsWith('page.')) {
      await handlePageEvent(payload);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('notion-webhook error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
