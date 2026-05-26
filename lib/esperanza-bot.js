// esperanza-bot.js — Agente de ventas PVB Estudio Creativo
// Scope: Video/Foto · Social Media · Pauta Digital · Web/Marketing · Branding
// Persiste conversaciones en Supabase → visible en Master Brain

import { createClient } from '@supabase/supabase-js';

const ONBOARDING_URL = 'https://panchovial.com/client-onboarding';
const OWNER_CHAT_ID  = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID;
const NOTION_KEY     = process.env.NOTION_API_KEY;
const TRIGGER_SECRET = process.env.TRIGGER_SECRET_KEY;
const NOTION_PROYECTOS_DB = '3337ab7f-975e-81b4-8045-d33fe1515aca';

function getSB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  return createClient(url, key);
}

const SERVICES = {
  video:  { label: '🎬 Producción audiovisual', desc: 'Video corporativo, spots, reels, foto producto/lifestyle' },
  social: { label: '📱 Social Media',           desc: 'Gestión de Instagram, TikTok, Facebook — estrategia + contenido' },
  ads:    { label: '📣 Pauta digital',           desc: 'Meta Ads (Instagram/Facebook) + Google Ads — campañas de performance' },
  web:    { label: '🌐 Web + Marketing digital', desc: 'Sitios web, landing pages, SEO, email marketing' },
  brand:  { label: '🎨 Branding',               desc: 'Identidad visual, logo, manual de marca, naming' }
};

const TRIGGER_KEYWORDS = [
  'hola','hello','buenas','cotiz','precio','costo','cuanto','cuánto',
  'proyecto','video','foto','fotografía','reels','tiktok','instagram',
  'social','marketing','ads','pauta','publicidad','campaña',
  'web','página','pagina','sitio','branding','logo','marca',
  'info','información','informacion','quiero','necesito','busco'
];

const OWNER_CHAT_IDS = new Set([
  OWNER_CHAT_ID,
  process.env.TELEGRAM_CHAT_ID,
  process.env.TELEGRAM_OWNER_CHAT_ID
].filter(Boolean));

// ─── Supabase helpers ──────────────────────────────────────────────────────────
async function loadState(chatId) {
  try {
    const { data } = await getSB()
      .from('esperanza_leads')
      .select('*')
      .eq('chat_id', String(chatId))
      .single();
    return data || null;
  } catch { return null; }
}

async function saveState(chatId, patch, appendMessage = null) {
  const sb = getSB();
  const cid = String(chatId);

  if (appendMessage) {
    // Append to conversation jsonb array atomically
    const { data: current } = await sb
      .from('esperanza_leads')
      .select('conversation')
      .eq('chat_id', cid)
      .single();

    const conv = Array.isArray(current?.conversation) ? current.conversation : [];
    conv.push({ ...appendMessage, ts: new Date().toISOString() });
    patch.conversation = conv;
  }

  patch.updated_at = new Date().toISOString();

  const { error } = await sb
    .from('esperanza_leads')
    .upsert({ chat_id: cid, ...patch }, { onConflict: 'chat_id' });

  if (error) console.error('esperanza saveState:', error.message);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function esc(text) { return String(text || '').replace(/[_*`[]/g, '\\$&'); }

async function send(chatId, text, telegramApi, keyboard = null) {
  const body = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  const res = await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  // Log bot message to conversation
  await saveState(chatId, {}, { role: 'bot', text });
  return data;
}

// ─── Trigger.dev: follow-up 3 días ────────────────────────────────────────────
async function scheduleFollowup(prospect) {
  if (!TRIGGER_SECRET) return;
  try {
    const delay = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    await fetch('https://api.trigger.dev/v1/tasks/pvb-lead-followup/trigger', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TRIGGER_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { ...prospect, capturedAt: new Date().toISOString() }, options: { delay } })
    });
  } catch (err) { console.error('Trigger.dev:', err.message); }
}

// ─── Guardar lead en Notion ────────────────────────────────────────────────────
async function saveLeadToNotion(prospect) {
  if (!NOTION_KEY) return null;
  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: { database_id: NOTION_PROYECTOS_DB },
        properties: {
          Nombre: { title: [{ text: { content: `Lead: ${prospect.name || prospect.username || 'Sin nombre'}` } }] },
          Cliente: { rich_text: [{ text: { content: prospect.name || prospect.username || '' } }] },
          Estado:  { select: { name: 'Brief' } },
          Tipo:    { select: { name: prospect.service || 'Sin especificar' } },
          Notas:   { rich_text: [{ text: { content: `Telegram: @${prospect.username || 'N/A'}\nInterés: ${prospect.interest || ''}\nFuente: Esperanza Bot\nFecha: ${new Date().toLocaleString('es-CL')}` } }] }
        }
      })
    });
    const data = await res.json();
    return data.id || null;
  } catch (err) { console.error('Notion lead:', err.message); return null; }
}

// ─── Notificar a Pancho ────────────────────────────────────────────────────────
async function notifyOwner(telegramApi, prospect) {
  if (!OWNER_CHAT_ID) return;
  const msg =
    `🌟 *Nuevo lead — Esperanza*\n\n` +
    `👤 ${esc(prospect.name || 'Sin nombre')}\n` +
    `📱 @${esc(prospect.username || 'sin username')}` +
    (prospect.service  ? `\n🎯 Servicio: ${esc(prospect.service)}`  : '') +
    (prospect.interest ? `\n💬 "${esc(prospect.interest)}"` : '') +
    `\n📅 ${new Date().toLocaleString('es-CL')}\n\n` +
    `[Ver en Master Brain](https://panchovial.com/masterbrain) · [Onboarding](${ONBOARDING_URL})`;

  await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text: msg, parse_mode: 'Markdown' })
  });
}

// ─── Conversación ──────────────────────────────────────────────────────────────
async function startConversation(chatId, telegramApi, from) {
  await saveState(chatId, {
    username: from?.username || null,
    name: `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || null,
    step: 'select_service',
    status: 'new'
  });

  const name = from?.first_name ? `, ${esc(from.first_name)}` : '';
  await send(chatId,
    `Hola${name} 👋 Soy *Esperanza* de *PVB Estudio Creativo*.\n\n` +
    `Somos una productora audiovisual y agencia de marketing en Santiago.\n\n` +
    `¿En qué te podemos ayudar?`,
    telegramApi,
    [
      [{ text: '🎬 Video / Fotografía',          callback_data: 'esp_svc_video'  }],
      [{ text: '📱 Social Media',                callback_data: 'esp_svc_social' }],
      [{ text: '📣 Pauta digital (Meta / Google)', callback_data: 'esp_svc_ads'  }],
      [{ text: '🌐 Web + Marketing',             callback_data: 'esp_svc_web'   }],
      [{ text: '🎨 Branding + identidad visual', callback_data: 'esp_svc_brand' }]
    ]
  );
}

async function afterServiceSelected(chatId, serviceKey, telegramApi) {
  const svc = SERVICES[serviceKey];
  await saveState(chatId, { service: svc.label, step: 'waiting_detail', status: 'warm' });
  await send(chatId,
    `*${svc.label}* — buena elección.\n\n_${svc.desc}_\n\nCuéntame brevemente: ¿qué tienes en mente? (empresa, producto, objetivo, plazo)`,
    telegramApi
  );
}

async function afterDetail(chatId, text, telegramApi) {
  // message already logged in handleEsperanza — only update state here
  await saveState(chatId, { interest: text, step: 'waiting_decision', status: 'warm' });

  await send(chatId,
    `Perfecto 🙌\n\nPVB trabaja con marcas que quieren contenido que convierte — no solo que se ve bonito.\n\n¿Cuál es tu situación ahora?`,
    telegramApi,
    [
      [{ text: '🔥 Tengo un proyecto listo para cotizar', callback_data: 'esp_now'   }],
      [{ text: '📋 Quiero dejar mis datos para después',  callback_data: 'esp_later' }],
      [{ text: '💬 Prefiero que me llamen',              callback_data: 'esp_call'  }]
    ]
  );
}

async function handleFreeText(chatId, text, step, telegramApi) {
  if (step === 'waiting_detail') {
    await afterDetail(chatId, text, telegramApi);
    return true;
  }
  if (step === 'select_service') {
    await send(chatId, 'Por favor selecciona una opción de arriba 👆', telegramApi);
    return true;
  }
  if (step === 'waiting_decision') {
    await send(chatId, 'Selecciona una de las opciones de arriba 👆 para continuar.', telegramApi);
    return true;
  }
  if (step === 'done') {
    await send(chatId,
      `¡Hola de nuevo! 😊 Si tienes más preguntas escríbenos a *info@panchovial.com* o completa el formulario:\n\n👉 ${ONBOARDING_URL}`,
      telegramApi
    );
    return true;
  }
  // Cualquier otro step desconocido — Esperanza mantiene el control
  await send(chatId, '¿En qué más te puedo ayudar? 😊', telegramApi);
  return true;
}

// ─── Exports ───────────────────────────────────────────────────────────────────
export async function handleEsperanzaCommand(chatId, command, telegramApi) {
  if (command === '/esperanza' || command === '/start_esperanza') {
    await startConversation(chatId, telegramApi, null);
    return true;
  }
  return false;
}

export async function handleEsperanza(chatId, text, from, telegramApi) {
  if (OWNER_CHAT_IDS.has(String(chatId))) return false;

  const lead = await loadState(chatId);
  const step = lead?.step || 'idle';

  // Log incoming prospect message
  if (text) await saveState(chatId, {}, { role: 'prospect', text });

  if (step !== 'idle') return handleFreeText(chatId, text, step, telegramApi);

  const triggered = TRIGGER_KEYWORDS.some(k => text.toLowerCase().includes(k));
  if (triggered) {
    await startConversation(chatId, telegramApi, from);
    return true;
  }
  return false;
}

export async function handleEsperanzaCallback(chatId, data, from, telegramApi) {
  const lead = await loadState(chatId);
  const state = lead || {};

  const SVC_MAP = { esp_svc_video: 'video', esp_svc_social: 'social', esp_svc_ads: 'ads', esp_svc_web: 'web', esp_svc_brand: 'brand' };
  if (SVC_MAP[data]) {
    await afterServiceSelected(chatId, SVC_MAP[data], telegramApi);
    return true;
  }

  const prospect = {
    name:     state.name     || `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || null,
    username: state.username || from?.username || null,
    service:  state.service  || null,
    interest: state.interest || null
  };

  if (data === 'esp_now' || data === 'esp_later' || data === 'esp_call') {
    const decisionText = { esp_now: '🔥 Proyecto listo', esp_later: '📋 Para después', esp_call: '📞 Prefiere llamada' }[data];
    await saveState(chatId, { step: 'done', decision: data, status: 'hot' });

    const msgs = {
      esp_now:   `Excelente 🎬\n\nCompleta este formulario y Pancho te contacta con una propuesta:\n\n👉 ${ONBOARDING_URL}\n\n_Toma menos de 2 minutos._`,
      esp_later: `Sin apuro 😊\n\nDeja tus datos y te avisamos:\n\n👉 ${ONBOARDING_URL}`,
      esp_call:  `Perfecto 📞\n\nDéjame tus datos y te llamamos:\n\n👉 ${ONBOARDING_URL}`
    };
    await send(chatId, msgs[data], telegramApi);
    await notifyOwner(telegramApi, { ...prospect, interest: prospect.interest || decisionText });

    const notionId = await saveLeadToNotion(prospect);
    if (notionId) await saveState(chatId, { notion_page_id: notionId });
    if (data === 'esp_now') await scheduleFollowup(prospect);
    return true;
  }

  return false;
}
