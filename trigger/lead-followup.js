// lead-followup.js — Job de seguimiento automático de leads PVB
// Se dispara 3 días después de capturar un lead en Esperanza
// Notifica a Pancho por Telegram con resumen del lead

import { task, schedules } from '@trigger.dev/sdk/v3';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID;

async function sendTelegram(text) {
  if (!OWNER_CHAT_ID) return;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text, parse_mode: 'Markdown' })
  });
}

// ─── Job: seguimiento 3 días después de capturar un lead ─────────────────────
export const leadFollowup = task({
  id: 'pvb-lead-followup',
  run: async (payload) => {
    const { name, username, service, interest, capturedAt } = payload;

    const daysSince = Math.floor((Date.now() - new Date(capturedAt).getTime()) / 86400000);

    const msg =
      `🔔 *Seguimiento pendiente — ${daysSince}d*\n\n` +
      `👤 ${name || 'Sin nombre'}\n` +
      `📱 @${username || 'sin username'}\n` +
      `🎯 ${service || 'Sin servicio'}\n` +
      (interest ? `💬 _"${interest}"_\n` : '') +
      `\n¿Ya lo contactaste? Si no, es momento de hacer follow-up 💪`;

    await sendTelegram(msg);
    return { notified: true, lead: name || username };
  }
});

// ─── Reporte semanal de leads (lunes 9am Chile = 13:00 UTC) ──────────────────
export const weeklyLeadReport = schedules.task({
  id: 'pvb-weekly-lead-report',
  cron: '0 13 * * 1',
  run: async () => {
    const NOTION_KEY = process.env.NOTION_API_KEY;
    const NOTION_DB = '3337ab7f-975e-81b4-8045-d33fe1515aca';

    // Obtener leads de la semana (proyectos con estado "Brief" creados últimos 7 días)
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          and: [
            { property: 'Estado', select: { equals: 'Brief' } },
            { timestamp: 'created_time', created_time: { after: since } }
          ]
        }
      })
    });

    const data = await res.json();
    const leads = data.results || [];

    if (!leads.length) {
      await sendTelegram('📊 *Reporte semanal PVB*\n\n_Sin nuevos leads esta semana._\n\n¿Necesitas activar Esperanza? 🚀');
      return { leads: 0 };
    }

    const lines = leads.map(p => {
      const nombre = p.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre';
      const tipo = p.properties.Tipo?.select?.name || '—';
      return `• ${nombre} — ${tipo}`;
    });

    await sendTelegram(
      `📊 *Reporte semanal PVB — Leads*\n\n` +
      `${leads.length} lead${leads.length > 1 ? 's' : ''} esta semana:\n\n` +
      lines.join('\n') +
      `\n\n_Revisa Notion para el detalle completo._`
    );

    return { leads: leads.length };
  }
});
