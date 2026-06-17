// esperanza-bot.js — Agente de ventas PVB Estudio Creativo
// Scope: Video/Foto · Social Media · Pauta Digital · Web/Marketing · Branding
// Persiste conversaciones en Supabase → visible en Master Brain

import { createClient } from '@supabase/supabase-js';
import { notifyNotion } from './notion-query.js';

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

// Contexto público del estudio — SOLO para responder consultas de nuevos prospectos
// Esperanza NO tiene acceso a clientes actuales, proyectos en curso ni información confidencial
const PVB_CONTEXT = `
PVB Estudio Creativo es una consultora de marketing con el slogan "Marketing solutions".
Ofrecemos soluciones integrales de marketing para marcas que quieren crecer:
- Producción audiovisual: video corporativo, spots publicitarios, reels, fotografía de producto y lifestyle
- Social Media: estrategia, gestión y contenido para Instagram, TikTok, Facebook y LinkedIn
- Pauta digital: campañas de performance en Meta Ads (Instagram/Facebook) y Google Ads
- Web + Marketing digital: sitios web, landing pages, SEO y email marketing
- Branding: identidad visual, logo, manual de marca y naming
- Eventos: producción, cobertura audiovisual y activaciones de marca para eventos corporativos, lanzamientos, ferias y shows
Trabajamos con empresas en Santiago, Chile y a nivel nacional. Contacto: info@panchovial.com
`.trim();

// Preguntas sobre clientes o proyectos actuales — responder con energía pero sin revelar nada
const CONFIDENTIAL_TRIGGERS = [
  'cliente','clientes','quiénes son','quienes son','con quién trabajan','con quien trabajan',
  'qué marcas','que marcas','portfolio','portafolio','trabajaron con','han trabajado',
  'proyectos actuales','proyectos en curso','cuentas','cuentan con','ejemplos de clientes',
  'en qué proyectos','en que proyectos','qué están haciendo','que estan haciendo',
  'qué tienen ahora','que tienen ahora','notion','base de datos'
];

const SERVICES = {
  video:  { label: '🎬 Producción audiovisual', desc: 'Video corporativo, spots, reels, foto producto/lifestyle' },
  social: { label: '📱 Social Media',           desc: 'Gestión de Instagram, TikTok, Facebook — estrategia + contenido' },
  ads:    { label: '📣 Pauta digital',           desc: 'Meta Ads (Instagram/Facebook) + Google Ads — campañas de performance' },
  web:    { label: '🌐 Web + Marketing digital', desc: 'Sitios web, landing pages, SEO, email marketing' },
  brand:  { label: '🎨 Branding',               desc: 'Identidad visual, logo, manual de marca, naming' },
  eventos: { label: '🎪 Eventos',               desc: 'Producción, cobertura audiovisual y activaciones de marca para eventos corporativos, lanzamientos y shows' }
};

const TRIGGER_KEYWORDS = [
  'hola','hello','buenas','cotiz','precio','costo','cuanto','cuánto',
  'proyecto','video','foto','fotografía','reels','tiktok','instagram',
  'social','marketing','ads','pauta','publicidad','campaña',
  'web','página','pagina','sitio','branding','logo','marca',
  'evento','eventos','activación','activacion','lanzamiento','feria',
  'cobertura','show','corporativo',
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
          Nombre:  { title: [{ text: { content: `Lead: ${prospect.company || prospect.name || prospect.username || 'Sin nombre'}` } }] },
          Cliente: { rich_text: [{ text: { content: prospect.company || prospect.name || '' } }] },
          Estado:  { select: { name: 'Brief' } },
          Tipo:    { select: { name: prospect.service || 'Sin especificar' } },
          Notas:   { rich_text: [{ text: { content: [
            `Contacto: ${prospect.name || 'N/A'}`,
            `Telegram: @${prospect.username || 'N/A'}`,
            `Email: ${prospect.contact_email || 'N/A'}`,
            `Objetivo: ${prospect.objective || prospect.interest || 'N/A'}`,
            `Presupuesto: ${prospect.budget || 'N/A'}`,
            `Plazo: ${prospect.timeline || 'N/A'}`,
            `Fuente: Esperanza Bot`,
            `Fecha: ${new Date().toLocaleString('es-CL')}`
          ].join('\n') } }] }
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
    `🌟 *Nuevo lead calificado — Esperanza*\n\n` +
    `👤 ${esc(prospect.name || 'Sin nombre')}` +
    (prospect.company       ? ` · *${esc(prospect.company)}*`              : '') + '\n' +
    `📱 @${esc(prospect.username || 'sin username')}` +
    (prospect.contact_email ? `\n📧 ${esc(prospect.contact_email)}`         : '') +
    (prospect.service       ? `\n🎯 ${esc(prospect.service)}`               : '') +
    (prospect.objective     ? `\n🏆 "${esc(prospect.objective)}"`           : '') +
    (prospect.budget        ? `\n💰 ${esc(prospect.budget)}`                : '') +
    (prospect.timeline      ? `\n📅 Plazo: ${esc(prospect.timeline)}`       : '') +
    (prospect.interest      ? `\n💬 "${esc(prospect.interest)}"`            : '') +
    `\n\n[Ver en Master Brain](https://panchovial.com/masterbrain) · [Onboarding](${ONBOARDING_URL})`;

  await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: OWNER_CHAT_ID, text: msg, parse_mode: 'Markdown' })
  });

  // Registrar en Notion Notificaciones
  if (NOTION_KEY) {
    await notifyNotion(NOTION_KEY, {
      tipo: 'lead_nuevo',
      titulo: `Lead: ${prospect.name || prospect.username || 'Sin nombre'}`,
      detalle: [prospect.service, prospect.interest].filter(Boolean).join(' — '),
      origen: 'esperanza'
    });
  }
}

// ─── Conversación ──────────────────────────────────────────────────────────────
// ─── Flujo guiado de calificación ─────────────────────────────────────────────
// Pasos: greeting → company → select_service → objective → budget → email → timeline → decision

async function startConversation(chatId, telegramApi, from) {
  const telegramName = `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || null;
  await saveState(chatId, {
    username: from?.username || null,
    name: telegramName,
    step: 'waiting_company',
    status: 'new'
  });

  const greeting = from?.first_name ? `, ${esc(from.first_name)}` : '';
  await send(chatId,
    `Hola${greeting}! ¿Cómo estás? 😊\n\nSoy *Esperanza* de *PVB Estudio Creativo* — consultora de marketing, *Marketing solutions*.\n\nPara ayudarte bien, necesito conocerte un poco. ¿Con qué empresa o marca estás trabajando?`,
    telegramApi
  );
}

async function afterCompany(chatId, text, telegramApi) {
  await saveState(chatId, { company: text, step: 'select_service', status: 'warm' });
  await send(chatId,
    `Genial, *${esc(text)}* 🙌\n\n¿En qué área necesitan apoyo?`,
    telegramApi,
    [
      [{ text: '🎬 Video / Fotografía',            callback_data: 'esp_svc_video'   }],
      [{ text: '📱 Social Media',                  callback_data: 'esp_svc_social'  }],
      [{ text: '📣 Pauta digital (Meta / Google)', callback_data: 'esp_svc_ads'     }],
      [{ text: '🌐 Web + Marketing',               callback_data: 'esp_svc_web'     }],
      [{ text: '🎨 Branding + identidad visual',   callback_data: 'esp_svc_brand'   }],
      [{ text: '🎪 Eventos y activaciones',        callback_data: 'esp_svc_eventos' }]
    ]
  );
}

async function afterServiceSelected(chatId, serviceKey, telegramApi) {
  const svc = SERVICES[serviceKey];
  await saveState(chatId, { service: svc.label, step: 'waiting_objective', status: 'warm' });
  await send(chatId,
    `*${svc.label}* — perfecto.\n\n_${svc.desc}_\n\n¿Cuál es el objetivo principal de este proyecto? ¿Qué quieren lograr?`,
    telegramApi
  );
}

async function afterObjective(chatId, text, telegramApi) {
  await saveState(chatId, { objective: text, step: 'waiting_budget' });
  await send(chatId,
    `Entendido 🎯\n\n¿Tienen un presupuesto aproximado en mente? (puede ser un rango, en CLP)`,
    telegramApi,
    [
      [{ text: 'Menos de $500.000',          callback_data: 'esp_bdg_bajo'   }],
      [{ text: '$500.000 – $1.500.000',      callback_data: 'esp_bdg_medio'  }],
      [{ text: '$1.500.000 – $5.000.000',    callback_data: 'esp_bdg_alto'   }],
      [{ text: 'Más de $5.000.000',          callback_data: 'esp_bdg_premium'}],
      [{ text: 'No tengo claro aún',         callback_data: 'esp_bdg_tbd'    }]
    ]
  );
}

async function afterBudget(chatId, budget, telegramApi) {
  await saveState(chatId, { budget, step: 'waiting_email' });
  await send(chatId,
    `Perfecto ✅\n\n¿Cuál es tu email de contacto para que el equipo te envíe la propuesta?`,
    telegramApi
  );
}

async function afterEmail(chatId, text, telegramApi) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(text.trim())) {
    await send(chatId, `Ese email no parece válido 🤔 ¿Puedes revisarlo? (Ej: nombre@empresa.cl)`, telegramApi);
    return;
  }
  await saveState(chatId, { contact_email: text.trim(), step: 'waiting_timeline' });
  await send(chatId,
    `Anotado 📧\n\n¿Cuándo necesitan tener esto listo? ¿Tienen un plazo o fecha de lanzamiento?`,
    telegramApi,
    [
      [{ text: 'Urgente (menos de 2 semanas)',  callback_data: 'esp_tl_urgente' }],
      [{ text: 'En 1 mes',                      callback_data: 'esp_tl_1mes'    }],
      [{ text: 'En 2–3 meses',                  callback_data: 'esp_tl_3meses'  }],
      [{ text: 'Sin fecha definida',             callback_data: 'esp_tl_tbd'     }]
    ]
  );
}

async function afterTimeline(chatId, timeline, telegramApi) {
  await saveState(chatId, { timeline, step: 'waiting_decision', status: 'hot' });
  await send(chatId,
    `¡Perfecto, ya tengo todo lo que necesito! 🙌\n\n¿Qué te parece mejor para seguir?`,
    telegramApi,
    [
      [{ text: '✅ ¡Sí, cotizamos!',             callback_data: 'esp_now'   }],
      [{ text: '📋 Me dejas tus datos',           callback_data: 'esp_later' }],
      [{ text: '📞 Agendamos una llamada',        callback_data: 'esp_call'  }]
    ]
  );
}

async function afterDetail(chatId, text, telegramApi) {
  await saveState(chatId, { interest: text, step: 'waiting_decision', status: 'warm' });
  await send(chatId,
    `Perfecto 🙌\n\nPVB trabaja con marcas que quieren contenido que convierte — no solo que se ve bonito.\n\n¿Cuál es tu situación ahora?`,
    telegramApi,
    [
      [{ text: '🔥 Tengo un proyecto listo para cotizar', callback_data: 'esp_now'   }],
      [{ text: '📋 Quiero dejar mis datos para después',  callback_data: 'esp_later' }],
      [{ text: '💬 Prefiero que me llamen',               callback_data: 'esp_call'  }]
    ]
  );
}

function matchServiceFromText(text) {
  const t = text.toLowerCase();
  if (/event|activ|lanzam|feria|show|corporativ|cobertura/.test(t))  return 'eventos';
  if (/video|foto|fotograf|reel|spot|audiovisual/.test(t))            return 'video';
  if (/social|instagram|tiktok|facebook|linkedin|contenido/.test(t))  return 'social';
  if (/pauta|ads|meta|google|publicidad|campaña|performance/.test(t)) return 'ads';
  if (/web|página|pagina|sitio|landing|seo|email/.test(t))            return 'web';
  if (/brand|logo|marca|identidad|naming|manual/.test(t))             return 'brand';
  return null;
}

async function escalateToTeam(chatId, text, lead, telegramApi) {
  await saveState(chatId, { step: 'escalated', status: 'warm', interest: text });
  await send(chatId,
    `Entiendo lo que necesitas 🙌\n\nEso lo maneja el equipo directamente para darte la mejor respuesta. Te voy a dejar en contacto con alguien de PVB.\n\n` +
    `Mientras tanto, puedes dejarnos tus datos aquí:\n👉 ${ONBOARDING_URL}\n\n_O escríbenos a *info@panchovial.com*_`,
    telegramApi
  );
  if (OWNER_CHAT_ID) {
    const name = lead?.name || lead?.username || 'Prospecto';
    await fetch(`${telegramApi}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: OWNER_CHAT_ID,
        text: `⚡ *Esperanza escaló una consulta*\n\n👤 ${esc(name)}\n💬 "${esc(text)}"\n\n_El prospecto fue derivado al equipo._`,
        parse_mode: 'Markdown'
      })
    });
  }
}

async function handleFreeText(chatId, text, step, telegramApi) {
  const lead = await loadState(chatId);

  if (step === 'waiting_company') {
    await afterCompany(chatId, text, telegramApi);
    return true;
  }
  if (step === 'waiting_objective') {
    await afterObjective(chatId, text, telegramApi);
    return true;
  }
  if (step === 'waiting_email') {
    await afterEmail(chatId, text, telegramApi);
    return true;
  }
  if (step === 'waiting_detail') {
    await afterDetail(chatId, text, telegramApi);
    return true;
  }
  if (step === 'select_service') {
    const detected = matchServiceFromText(text);
    if (detected) {
      await afterServiceSelected(chatId, detected, telegramApi);
    } else {
      await send(chatId, 'Por favor selecciona una opción de arriba 👆', telegramApi);
    }
    return true;
  }
  if (step === 'waiting_budget' || step === 'waiting_timeline' || step === 'waiting_decision') {
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
  if (step === 'escalated') {
    await send(chatId, `Ya avisé al equipo 🙌 Te contactarán pronto. También puedes escribir a *info@panchovial.com*`, telegramApi);
    return true;
  }
  // Preguntas sobre clientes actuales o proyectos en curso — responder con energía, sin revelar nada
  const t = text.toLowerCase();
  if (CONFIDENTIAL_TRIGGERS.some(kw => t.includes(kw))) {
    await send(chatId,
      `Estamos trabajando en proyectos que buscan crear experiencias reales — vivencias que la gente recuerda. Eso es lo que hacemos en PVB 🙂\n\nSi quieres saber más, escríbenos:\n📧 info@panchovial.com`,
      telegramApi
    );
    return true;
  }

  // Sin flujo activo — detectar servicio o escalar
  const detected = matchServiceFromText(text);
  if (detected) {
    await afterServiceSelected(chatId, detected, telegramApi);
  } else {
    await escalateToTeam(chatId, text, lead, telegramApi);
  }
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

  const SVC_MAP = { esp_svc_video: 'video', esp_svc_social: 'social', esp_svc_ads: 'ads', esp_svc_web: 'web', esp_svc_brand: 'brand', esp_svc_eventos: 'eventos' };
  if (SVC_MAP[data]) {
    await afterServiceSelected(chatId, SVC_MAP[data], telegramApi);
    return true;
  }

  const BUDGET_MAP = {
    esp_bdg_bajo:    'Menos de $500.000 CLP',
    esp_bdg_medio:   '$500.000 – $1.500.000 CLP',
    esp_bdg_alto:    '$1.500.000 – $5.000.000 CLP',
    esp_bdg_premium: 'Más de $5.000.000 CLP',
    esp_bdg_tbd:     'Por definir'
  };
  if (BUDGET_MAP[data]) {
    await afterBudget(chatId, BUDGET_MAP[data], telegramApi);
    return true;
  }

  const TIMELINE_MAP = {
    esp_tl_urgente: 'Urgente (menos de 2 semanas)',
    esp_tl_1mes:    '1 mes',
    esp_tl_3meses:  '2–3 meses',
    esp_tl_tbd:     'Sin fecha definida'
  };
  if (TIMELINE_MAP[data]) {
    await afterTimeline(chatId, TIMELINE_MAP[data], telegramApi);
    return true;
  }

  const prospect = {
    name:          state.name          || `${from?.first_name || ''} ${from?.last_name || ''}`.trim() || null,
    username:      state.username      || from?.username || null,
    company:       state.company       || null,
    service:       state.service       || null,
    objective:     state.objective     || null,
    interest:      state.interest      || null,
    budget:        state.budget        || null,
    contact_email: state.contact_email || null,
    timeline:      state.timeline      || null
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
