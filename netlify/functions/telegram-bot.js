// telegram-bot.js — PVB Telegram Bot webhook
// Recibe updates de Telegram y responde comandos
// Webhook URL: /.netlify/functions/telegram-bot

import { createClient } from '@supabase/supabase-js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_BOLETAS_DB = process.env.NOTION_CLIENT_CONTEXT_DB_ID;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function sendMessage(chatId, text, options = {}) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      ...options
    })
  });
}

async function handleCommand(chatId, command, args) {
  switch (command) {
    case '/start':
    case '/help':
      await sendMessage(chatId,
        `🧠 *PVB Master Brain Bot*\n\n` +
        `Comandos disponibles:\n` +
        `/clientes — Clientes activos con redes conectadas\n` +
        `/facturas — Facturas pendientes de cobro\n` +
        `/agentes — Estado del equipo de agentes\n` +
        `/ping — Test de conexión`
      );
      break;

    case '/ping':
      await sendMessage(chatId, '✅ Bot activo y respondiendo.');
      break;

    case '/clientes':
      await handleClientes(chatId);
      break;

    case '/facturas':
      await handleFacturas(chatId);
      break;

    case '/agentes':
      await handleAgentes(chatId);
      break;

    default:
      await sendMessage(chatId, `Comando no reconocido. Usa /help para ver los disponibles.`);
  }
}

async function handleClientes(chatId) {
  try {
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email, company, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!profiles || profiles.length === 0) {
      await sendMessage(chatId, '📭 No hay clientes registrados aún.');
      return;
    }

    const { data: accounts } = await supabaseAdmin
      .from('social_accounts')
      .select('user_id, platform')
      .eq('is_active', true);

    const countByUser = {};
    for (const acc of accounts || []) {
      countByUser[acc.user_id] = (countByUser[acc.user_id] || 0) + 1;
    }

    const lines = profiles.map(p => {
      const name = p.full_name || p.email || 'Sin nombre';
      const company = p.company ? ` — ${p.company}` : '';
      const redes = countByUser[p.id] ? ` *(${countByUser[p.id]} redes)*` : '';
      return `• ${name}${company}${redes}`;
    });

    await sendMessage(chatId, `👥 *Clientes activos (${profiles.length})*\n\n${lines.join('\n')}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error al cargar clientes: ${err.message}`);
  }
}

async function handleFacturas(chatId) {
  if (!NOTION_API_KEY || !NOTION_BOLETAS_DB) {
    await sendMessage(chatId, '⚠️ Notion no configurado. Verifica NOTION_API_KEY y NOTION_CLIENT_CONTEXT_DB_ID.');
    return;
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_BOLETAS_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          property: 'Estado',
          select: { equals: 'Pendiente' }
        },
        sorts: [{ property: 'Fecha', direction: 'descending' }],
        page_size: 10
      })
    });

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      await sendMessage(chatId, '✅ No hay facturas pendientes.');
      return;
    }

    const lines = data.results.map(page => {
      const props = page.properties;
      const nombre = props.Nombre?.title?.[0]?.plain_text || props.Name?.title?.[0]?.plain_text || 'Sin nombre';
      const monto = props.Monto?.number ? `$${props.Monto.number.toLocaleString('es-CL')}` : '';
      const fecha = props.Fecha?.date?.start || '';
      return `• ${nombre}${monto ? ' — ' + monto : ''}${fecha ? ' (' + fecha + ')' : ''}`;
    });

    await sendMessage(chatId,
      `🧾 *Facturas pendientes (${data.results.length})*\n\n${lines.join('\n')}\n\n_Revisa Notion para más detalle_`
    );
  } catch (err) {
    await sendMessage(chatId, `❌ Error al consultar Notion: ${err.message}`);
  }
}

async function handleAgentes(chatId) {
  const depts = {
    creative: 8, marketing: 12, engineering: 19,
    production: 5, qa: 8, analytics: 5,
    product: 5, support: 5, sales: 3
  };

  const total = Object.values(depts).reduce((a, b) => a + b, 0);
  const lines = Object.entries(depts).map(([d, n]) => `• ${d}: ${n} agentes`);

  await sendMessage(chatId,
    `🤖 *Master Brain — ${total} agentes activos*\n\n${lines.join('\n')}\n\n_Ver detalle en panchovial.com/masterbrain_`
  );
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 200, body: 'PVB Telegram Bot OK' };
  }

  try {
    const update = JSON.parse(event.body);
    const message = update.message || update.edited_message;
    if (!message?.text) return { statusCode: 200, body: 'ok' };

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const command = parts[0].split('@')[0]; // remove @botname if present
      const args = parts.slice(1);
      await handleCommand(chatId, command, args);
    }

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('telegram-bot error:', err);
    return { statusCode: 200, body: 'ok' }; // always 200 to Telegram
  }
};
