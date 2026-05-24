// pvb-growth.js — Director de Nuevos Negocios PVB
// Maneja mensajes de voz (transcripción via Groq) y texto estratégico
// Solo accesible por Pancho (OWNER_CHAT_ID)

import Anthropic from '@anthropic-ai/sdk';

const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID;
const NOTION_PROYECTOS_DB = '3337ab7f-975e-81b4-8045-d33fe1515aca';

const GROWTH_SYSTEM_PROMPT = `Eres el Director de Nuevos Negocios de PVB Estudio Creativo, el socio estratégico de Pancho (Francisco Vial Brown) para crecer la agencia.

PVB es una productora audiovisual y agencia de marketing en Santiago. Servicios: video/foto, social media, pauta digital (Meta/Google), web/marketing, branding.

Posicionamiento: "Contenido que convierte — no solo que se ve bonito."
Canal principal actual: referidos. Oportunidad: sistematizarlo + outbound selectivo + inbound orgánico.

Sistema de ventas actual:
- Esperanza Bot (Telegram) — captura leads inbound
- Trigger.dev — follow-up automático 3 días post-lead
- Notion — CRM (proyectos con estado "Brief" = leads nuevos)
- panchovial.com/client-onboarding — formulario de entrada

Tu rol: sparring partner estratégico. Diagnostica primero, recomienda específico, cierra con un primer paso esta semana.

Estilo: español chileno directo, respuestas cortas para Telegram (3-4 párrafos máx), números concretos, sin jerga corporativa.

Frameworks: ICE Score para canales, Hook×Meat×CTA para mensajes (Hormozi), BANT para calificar leads.`;

// ─── Transcribir audio con Groq Whisper ──────────────────────────────────────
async function transcribeVoice(fileBuffer, mimeType = 'audio/ogg') {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) throw new Error('GROQ_API_KEY no configurada');

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append('file', blob, 'voice.ogg');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'es');
  formData.append('response_format', 'text');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}` },
    body: formData
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${err}`);
  }
  return res.text();
}

// ─── Obtener leads actuales de Notion ────────────────────────────────────────
async function getLeadsFromNotion() {
  const NOTION_KEY = process.env.NOTION_API_KEY;
  if (!NOTION_KEY) return '';

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_PROYECTOS_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: { property: 'Estado', select: { equals: 'Brief' } },
        page_size: 10
      })
    });
    const data = await res.json();
    const leads = (data.results || []).map(p => {
      const nombre = p.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre';
      const tipo = p.properties.Tipo?.select?.name || '—';
      const created = p.created_time?.split('T')[0] || '';
      return `- ${nombre} (${tipo}) — ${created}`;
    });
    return leads.length ? `\nLeads activos en Notion:\n${leads.join('\n')}` : '';
  } catch {
    return '';
  }
}

// ─── Historial de conversación por chat ──────────────────────────────────────
const conversationHistory = {};

// ─── Responder con Claude (Growth Director) ──────────────────────────────────
async function askGrowthDirector(chatId, userMessage) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  if (!conversationHistory[chatId]) conversationHistory[chatId] = [];

  // Inyectar contexto de pipeline solo en el primer mensaje o cada 10 turnos
  const turnCount = conversationHistory[chatId].length;
  let contextualMessage = userMessage;
  if (turnCount === 0 || turnCount % 10 === 0) {
    const leadsContext = await getLeadsFromNotion();
    if (leadsContext) contextualMessage = userMessage + `\n\n[Contexto actual del pipeline]${leadsContext}`;
  }

  conversationHistory[chatId].push({ role: 'user', content: contextualMessage });

  // Mantener últimos 20 mensajes para no exceder contexto
  if (conversationHistory[chatId].length > 20) {
    conversationHistory[chatId] = conversationHistory[chatId].slice(-20);
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: GROWTH_SYSTEM_PROMPT,
    messages: conversationHistory[chatId]
  });

  const reply = response.content[0].text;
  conversationHistory[chatId].push({ role: 'assistant', content: reply });
  return reply;
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function handleGrowthMessage(chatId, text, telegramApi) {
  await sendMessage(chatId, '📈 Pensando...', telegramApi);
  try {
    const reply = await askGrowthDirector(chatId, text);
    await sendMessage(chatId, reply, telegramApi);
  } catch (err) {
    console.error('Growth Director error:', err.message);
    await sendMessage(chatId, `Error al responder: ${err.message}`, telegramApi);
  }
  return true;
}

export async function handleGrowthVoice(chatId, voiceFileId, telegramApi) {
  const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

  // 1. Obtener URL del archivo de voz
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${voiceFileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result?.file_path;
  if (!filePath) {
    await sendMessage(chatId, 'No pude obtener el archivo de voz.', telegramApi);
    return true;
  }

  // 2. Descargar el archivo
  const audioRes = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`);
  const audioBuffer = await audioRes.arrayBuffer();

  // 3. Transcribir con Groq
  await sendMessage(chatId, 'Escuchando...', telegramApi);
  let transcription;
  try {
    transcription = await transcribeVoice(audioBuffer, 'audio/ogg');
  } catch (err) {
    await sendMessage(chatId, `Error de transcripcion: ${err.message}`, telegramApi);
    return true;
  }

  if (!transcription?.trim()) {
    await sendMessage(chatId, 'No entendi el audio. Intenta de nuevo.', telegramApi);
    return true;
  }

  // 4. Mostrar transcripción y responder
  await sendMessage(chatId, `"${transcription.trim()}"`, telegramApi);
  await sendMessage(chatId, '📈 Pensando...', telegramApi);
  try {
    const reply = await askGrowthDirector(chatId, transcription.trim());
    await sendMessage(chatId, reply, telegramApi);
  } catch (err) {
    console.error('Growth Director error:', err.message);
    await sendMessage(chatId, `Error al generar respuesta: ${err.message}`, telegramApi);
  }
  return true;
}

async function sendMessage(chatId, text, telegramApi) {
  // Try Markdown first, fall back to plain text if Telegram rejects formatting
  const res = await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
  const data = await res.json();
  if (!data.ok) {
    await fetch(`${telegramApi}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  }
}
