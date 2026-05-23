// esperanza-bot.js — Agente de ventas PVB Estudio Creativo
// Scope: Video/Foto · Social Media · Pauta Digital · Web/Marketing · Branding
// NO atiende: legal, salud, educación, tech externa, consultoría general

const ONBOARDING_URL = 'https://panchovial.com/client-onboarding';
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID;
const NOTION_KEY = process.env.NOTION_API_KEY;
const TRIGGER_SECRET = process.env.TRIGGER_SECRET_KEY;

// Notion DB de Proyectos (usada para registrar leads con estado "Lead")
const NOTION_PROYECTOS_DB = '3337ab7f-975e-81b4-8045-d33fe1515aca';

// ─── Servicios PVB — únicos aceptados ───────────────────────────────────────
const SERVICES = {
  video:   { label: '🎬 Producción audiovisual', desc: 'Video corporativo, spots, reels, foto producto/lifestyle' },
  social:  { label: '📱 Social Media', desc: 'Gestión de Instagram, TikTok, Facebook — estrategia + contenido' },
  ads:     { label: '📣 Pauta digital', desc: 'Meta Ads (Instagram/Facebook) + Google Ads — campañas de performance' },
  web:     { label: '🌐 Web + Marketing digital', desc: 'Sitios web, landing pages, SEO, email marketing' },
  brand:   { label: '🎨 Branding', desc: 'Identidad visual, logo, manual de marca, naming' }
};

// Keywords que activan a Esperanza (solo para chats externos / prospects)
const TRIGGER_KEYWORDS = [
  'hola', 'hello', 'buenas', 'cotiz', 'precio', 'costo', 'cuanto', 'cuánto',
  'proyecto', 'video', 'foto', 'fotografía', 'reels', 'tiktok', 'instagram',
  'social', 'marketing', 'ads', 'pauta', 'publicidad', 'campaña', 'campaña',
  'web', 'página', 'pagina', 'sitio', 'branding', 'logo', 'marca',
  'info', 'información', 'informacion', 'quiero', 'necesito', 'busco'
];

// Chats de Pancho — no activar Esperanza aquí (usa Master Brain directo)
const OWNER_CHAT_IDS = new Set([
  OWNER_CHAT_ID,
  process.env.TELEGRAM_CHAT_ID,
  process.env.TELEGRAM_OWNER_CHAT_ID
].filter(Boolean));

// Estado de conversación por chat
const conversations = {};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function esc(text) {
  return String(text || '').replace(/[_*`[]/g, '\\$&');
}

async function send(chatId, text, telegramApi, keyboard = null) {
  const body = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const res = await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ─── Trigger.dev — agendar follow-up 3 días después ─────────────────────────
async function scheduleFollowup(prospect) {
  if (!TRIGGER_SECRET) return;
  try {
    const delay = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    await fetch('https://api.trigger.dev/v1/tasks/pvb-lead-followup/trigger', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIGGER_SECRET}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payload: { ...prospect, capturedAt: new Date().toISOString() },
        options: { delay }
      })
    });
  } catch (err) {
    console.error('Trigger.dev schedule error:', err.message);
  }
}

// ─── Guardar lead en Notion ──────────────────────────────────────────────────
async function saveLeadToNotion(prospect) {
  if (!NOTION_KEY) return null;
  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_PROYECTOS_DB },
        properties: {
          Nombre: { title: [{ text: { content: `Lead: ${prospect.name || prospect.username || 'Sin nombre'}` } }] },
          Cliente: { rich_text: [{ text: { content: prospect.name || prospect.username || '' } }] },
          Estado: { select: { name: 'Brief' } },
          Tipo: { select: { name: prospect.service || 'Sin especificar' } },
          Notas: {
            rich_text: [{
              text: {
                content: `Telegram: @${prospect.username || 'N/A'}\nInterés: ${prospect.interest || ''}\nFuente: Esperanza Bot\nFecha: ${new Date().toLocaleString('es-CL')}`
              }
            }]
          }
        }
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Notion lead error:', err.message);
    return null;
  }
}

// ─── Notificar a Pancho ──────────────────────────────────────────────────────
async function notifyOwner(telegramApi, prospect) {
  if (!OWNER_CHAT_ID) return;
  const svc = prospect.service ? `\n🎯 Servicio: ${esc(prospect.service)}` : '';
  const interest = prospect.interest ? `\n💬 "${esc(prospect.interest)}"` : '';
  const msg =
    `🌟 *Nuevo lead — Esperanza*\n\n` +
    `👤 ${esc(prospect.name || 'Sin nombre')}\n` +
    `📱 @${esc(prospect.username || 'sin username')}` +
    svc + interest +
    `\n📅 ${new Date().toLocaleString('es-CL')}\n\n` +
    `[Ver onboarding](${ONBOARDING_URL})`;

  await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text: msg, parse_mode: 'Markdown' })
  });
}

// ─── Inicio de conversación ───────────────────────────────────────────────────
async function startConversation(chatId, telegramApi, from) {
  const name = from?.first_name ? `, ${esc(from.first_name)}` : '';
  conversations[chatId] = { step: 'select_service', from };

  await send(chatId,
    `Hola${name} 👋 Soy *Esperanza* de *PVB Estudio Creativo*.\n\n` +
    `Somos una productora audiovisual y agencia de marketing en Santiago.\n\n` +
    `¿En qué te podemos ayudar?`,
    telegramApi,
    [
      [{ text: '🎬 Video / Fotografía', callback_data: 'esp_svc_video' }],
      [{ text: '📱 Social Media', callback_data: 'esp_svc_social' }],
      [{ text: '📣 Pauta digital (Meta / Google)', callback_data: 'esp_svc_ads' }],
      [{ text: '🌐 Web + Marketing', callback_data: 'esp_svc_web' }],
      [{ text: '🎨 Branding + identidad visual', callback_data: 'esp_svc_brand' }]
    ]
  );
}

// ─── Después de seleccionar servicio ─────────────────────────────────────────
async function afterServiceSelected(chatId, serviceKey, telegramApi) {
  const svc = SERVICES[serviceKey];
  conversations[chatId] = { ...conversations[chatId], service: svc.label, step: 'waiting_detail' };

  await send(chatId,
    `*${svc.label}* — buena elección.\n\n` +
    `_${svc.desc}_\n\n` +
    `Cuéntame brevemente: ¿qué tienes en mente? (empresa, producto, objetivo, plazo)`,
    telegramApi
  );
}

// ─── Después del detalle → decidir ────────────────────────────────────────────
async function afterDetail(chatId, text, telegramApi) {
  conversations[chatId] = { ...conversations[chatId], interest: text, step: 'waiting_decision' };

  await send(chatId,
    `Perfecto 🙌\n\n` +
    `PVB trabaja con marcas que quieren contenido que convierte — no solo que se ve bonito.\n\n` +
    `¿Cuál es tu situación ahora?`,
    telegramApi,
    [
      [{ text: '🔥 Tengo un proyecto listo para cotizar', callback_data: 'esp_now' }],
      [{ text: '📋 Quiero dejar mis datos para después', callback_data: 'esp_later' }],
      [{ text: '💬 Prefiero que me llamen', callback_data: 'esp_call' }]
    ]
  );
}

// ─── Manejo de mensaje libre durante conversación ────────────────────────────
async function handleFreeText(chatId, text, telegramApi) {
  const state = conversations[chatId] || { step: 'idle' };

  if (state.step === 'waiting_detail') {
    await afterDetail(chatId, text, telegramApi);
    return true;
  }

  if (state.step === 'select_service') {
    // El usuario escribió en lugar de usar botón
    await send(chatId, 'Por favor selecciona una opción de arriba 👆', telegramApi);
    return true;
  }

  return false;
}

// ─── Exports principales ──────────────────────────────────────────────────────

export async function handleEsperanzaCommand(chatId, command, telegramApi) {
  if (command === '/esperanza' || command === '/start_esperanza') {
    await startConversation(chatId, telegramApi, null);
    return true;
  }
  return false;
}

export async function handleEsperanza(chatId, text, from, telegramApi) {
  // No interrumpir chats del owner con Esperanza
  if (OWNER_CHAT_IDS.has(String(chatId))) return false;

  const state = conversations[chatId] || { step: 'idle' };

  // Si hay conversación activa, manejar texto libre
  if (state.step !== 'idle') {
    return handleFreeText(chatId, text, telegramApi);
  }

  // Disparar si hay keyword relevante
  const lower = text.toLowerCase();
  const triggered = TRIGGER_KEYWORDS.some(k => lower.includes(k));
  if (triggered) {
    await startConversation(chatId, telegramApi, from);
    return true;
  }

  return false;
}

export async function handleEsperanzaCallback(chatId, data, from, telegramApi) {
  const state = conversations[chatId] || {};

  // ── Selección de servicio ──
  const SVC_MAP = {
    'esp_svc_video': 'video',
    'esp_svc_social': 'social',
    'esp_svc_ads': 'ads',
    'esp_svc_web': 'web',
    'esp_svc_brand': 'brand'
  };
  if (SVC_MAP[data]) {
    conversations[chatId] = { ...state, from, step: 'select_service' };
    await afterServiceSelected(chatId, SVC_MAP[data], telegramApi);
    return true;
  }

  // ── Decisión final ──
  const prospect = {
    name: `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || null,
    username: from?.username || null,
    service: state.service || null,
    interest: state.interest || null
  };

  if (data === 'esp_now') {
    conversations[chatId] = { ...state, step: 'done' };
    await send(chatId,
      `Excelente 🎬\n\n` +
      `Completa este formulario y Pancho te contacta personalmente con una propuesta:\n\n` +
      `👉 ${ONBOARDING_URL}\n\n` +
      `_Toma menos de 2 minutos._`,
      telegramApi
    );
    await notifyOwner(telegramApi, { ...prospect, interest: state.interest || 'Proyecto inmediato' });
    await Promise.all([saveLeadToNotion(prospect), scheduleFollowup(prospect)]);
    return true;
  }

  if (data === 'esp_later') {
    conversations[chatId] = { ...state, step: 'done' };
    await send(chatId,
      `Sin apuro 😊\n\n` +
      `Deja tus datos y te avisamos cuando tengamos disponibilidad:\n\n` +
      `👉 ${ONBOARDING_URL}`,
      telegramApi
    );
    await notifyOwner(telegramApi, { ...prospect, interest: state.interest || 'Para después' });
    await saveLeadToNotion(prospect);
    return true;
  }

  if (data === 'esp_call') {
    conversations[chatId] = { ...state, step: 'done' };
    await send(chatId,
      `Perfecto 📞\n\n` +
      `Déjame tus datos y te llamamos:\n\n` +
      `👉 ${ONBOARDING_URL}\n\n` +
      `_También puedes escribirnos al +56 9 XXXX XXXX_`,
      telegramApi
    );
    await notifyOwner(telegramApi, { ...prospect, interest: state.interest || 'Prefiere llamada' });
    await saveLeadToNotion(prospect);
    return true;
  }

  return false;
}
