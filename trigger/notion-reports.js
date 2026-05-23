// notion-reports.js — Reportes automáticos PVB vía Trigger.dev
// Reemplaza los crons de Hermes con jobs más estables y observables

import { schedules } from '@trigger.dev/sdk/v3';

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID;
const NOTION_KEY = () => process.env.NOTION_API_KEY;

const NOTION_DBS = {
  proyectos: '3337ab7f-975e-81b4-8045-d33fe1515aca',
  boletas:   '3337ab7f-975e-81e2-a15d-fb2e6071f1bf'
};

async function notionQuery(dbId, filter = {}) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY()}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(filter)
  });
  return res.json();
}

async function sendTelegram(text) {
  if (!OWNER_CHAT_ID) return;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text, parse_mode: 'Markdown' })
  });
}

// ─── Reporte lunes + viernes 9am Chile (13:00 UTC) ──────────────────────────
export const weeklyProjectReport = schedules.task({
  id: 'pvb-project-report',
  cron: '0 13 * * 1,5',
  run: async () => {
    const ESTADO_ICONS = {
      'Brief': '📋', 'Pre-produccion': '🔍',
      'Produccion': '🎬', 'Post-produccion': '✂️'
    };

    const [proyData, bolData] = await Promise.all([
      notionQuery(NOTION_DBS.proyectos, {
        filter: {
          property: 'Estado',
          select: { does_not_equal: 'Archivado' }
        }
      }),
      notionQuery(NOTION_DBS.boletas, {
        filter: {
          property: 'Estado',
          select: { equals: 'Pendiente' }
        }
      })
    ]);

    const proyectos = proyData.results || [];
    const boletas = bolData.results || [];

    const dia = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    let msg = `🧠 *PVB — Resumen ${dia}*\n\n`;

    if (proyectos.length) {
      msg += `*Proyectos activos (${proyectos.length})*\n`;
      proyectos.forEach(p => {
        const nombre = p.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre';
        const estado = p.properties.Estado?.select?.name || '';
        const icon = ESTADO_ICONS[estado] || '▪️';
        msg += `${icon} ${nombre} — ${estado}\n`;
      });
    } else {
      msg += `_Sin proyectos activos._\n`;
    }

    if (boletas.length) {
      const total = boletas.reduce((s, p) => s + (p.properties['Monto CLP']?.number || 0), 0);
      msg += `\n*Boletas pendientes (${boletas.length})*\n`;
      msg += `💰 Total: $${total.toLocaleString('es-CL')} CLP`;
    }

    await sendTelegram(msg);
    return { proyectos: proyectos.length, boletas: boletas.length };
  }
});
