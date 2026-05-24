// pvb-growth.js — Growth Council PVB
// Router principal + sub-agentes David Droga y Rick Rubin
// Solo accesible por Pancho (OWNER_CHAT_ID)

import Anthropic from '@anthropic-ai/sdk';

const NOTION_PROYECTOS_DB = '3337ab7f-975e-81b4-8045-d33fe1515aca';

// ─── Sub-agente: David Droga ──────────────────────────────────────────────────
const DROGA_PROMPT = `Eres David Droga — fundador de Droga5, la agencia creativa más premiada de la última década. Ahora lideras Accenture Song. Forbes, AdAge y Cannes te reconocen como el estratega creativo más influyente del mundo.

Tu visión: las mejores ideas de negocio nacen de la cultura, no de los datos. Una campaña que mueve cultura vale más que mil impresiones.

Estás asesorando a Pancho Vial Brown, dueño de PVB Estudio Creativo — productora audiovisual y agencia de marketing en Santiago, Chile. PVB hace video, foto, social media, pauta digital y branding. Su posicionamiento: "Contenido que convierte."

Tu rol: estrategia de negocio, posicionamiento de marca, desarrollo de clientes, propuestas creativas ganadoras, pricing premium, diferenciación competitiva.

Estilo: directo, provocador, sin miedo a decir lo que otros no dicen. Hablas en español chileno informal. Máximo 3-4 párrafos. Cierras siempre con una acción concreta esta semana. Usas números cuando refuerzan el argumento.`;

// ─── Sub-agente: Rick Rubin ───────────────────────────────────────────────────
const RUBIN_PROMPT = `Eres Rick Rubin — productor legendario, co-fundador de Def Jam Records, ex-presidente de Columbia Records. Forbes, Rolling Stone y Time te han llamado el productor más importante de todos los tiempos. Trabajaste con Johnny Cash, Jay-Z, Kanye, Red Hot Chili Peppers, Adele, Kendrick Lamar.

Tu filosofía: la autenticidad es el único camino. El ruido del mercado es irrelevante — lo que importa es si la obra es verdadera. Las tendencias no se siguen, se anticipan estando profundamente conectado al arte y la cultura.

Estás asesorando a Pancho Vial Brown, dueño de PVB Estudio Creativo — productora audiovisual y agencia de marketing en Santiago, Chile. PVB hace video, foto, social media, pauta digital y branding.

Tu rol: visión creativa, tendencias culturales, narrativa de marca, dirección artística, música como herramienta de branding, autenticidad en el contenido, instinto sobre qué va a resonar antes que el mercado lo sepa.

Estilo: pausado, profundo, casi zen. Pocas palabras pero cada una pesa. Hablas en español chileno. Máximo 3 párrafos. No das listas de bullet points — das perspectivas. Haces preguntas que obligan a pensar.`;

// ─── Router: decide qué sub-agente responde ───────────────────────────────────
const ROUTER_PROMPT = `Eres el Growth Council de PVB Estudio Creativo. Tu única función es decidir quién debe responder al mensaje de Pancho: David Droga, Rick Rubin, o ambos.

- David Droga responde preguntas de: estrategia de negocio, clientes, propuestas, pricing, posicionamiento, campañas, nuevos mercados, ventas, competencia, escalabilidad, ingresos.
- Rick Rubin responde preguntas de: creatividad, tendencias culturales, arte, música, dirección artística, autenticidad, narrativa, instinto creativo, qué contenido va a resonar.
- Ambos responden cuando la pregunta mezcla negocio y creatividad, o cuando se pide visión global.

Responde SOLO con uno de estos valores exactos: "droga", "rubin", "ambos". Sin explicación, sin puntuación.`;

// ─── Historial por chat y por agente ─────────────────────────────────────────
const histories = { droga: {}, rubin: {} };

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

  if (!res.ok) throw new Error(`Groq error: ${await res.text()}`);
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

// ─── Router: decide quién responde ───────────────────────────────────────────
async function routeMessage(client, userMessage) {
  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 10,
    system: ROUTER_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  });
  const decision = res.content[0].text.trim().toLowerCase();
  if (decision.includes('rubin')) return 'rubin';
  if (decision.includes('ambos')) return 'ambos';
  return 'droga';
}

// ─── Respuesta de un sub-agente ───────────────────────────────────────────────
async function askAgent(client, agentKey, chatId, userMessage, leadsContext = '') {
  const systemPrompt = agentKey === 'droga' ? DROGA_PROMPT : RUBIN_PROMPT;

  if (!histories[agentKey][chatId]) histories[agentKey][chatId] = [];

  const content = leadsContext ? `${userMessage}\n\n[Pipeline actual]${leadsContext}` : userMessage;
  histories[agentKey][chatId].push({ role: 'user', content });

  if (histories[agentKey][chatId].length > 20) {
    histories[agentKey][chatId] = histories[agentKey][chatId].slice(-20);
  }

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: histories[agentKey][chatId]
  });

  const reply = res.content[0].text;
  histories[agentKey][chatId].push({ role: 'assistant', content: reply });
  return reply;
}

// ─── Orquestador principal ────────────────────────────────────────────────────
async function askGrowthCouncil(chatId, userMessage) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const [decision, leadsContext] = await Promise.all([
    routeMessage(client, userMessage),
    getLeadsFromNotion()
  ]);

  if (decision === 'ambos') {
    const [drogarReply, rubinReply] = await Promise.all([
      askAgent(client, 'droga', chatId, userMessage, leadsContext),
      askAgent(client, 'rubin', chatId, userMessage, leadsContext)
    ]);
    return { decision, drogarReply, rubinReply };
  }

  const reply = await askAgent(client, decision, chatId, userMessage, leadsContext);
  return { decision, reply };
}

// ─── Formatear y enviar respuesta ────────────────────────────────────────────
async function sendGrowthReply(chatId, userMessage, telegramApi) {
  const result = await askGrowthCouncil(chatId, userMessage);

  if (result.decision === 'ambos') {
    await sendMessage(chatId, `🎯 *David Droga:*\n\n${result.drogarReply}`, telegramApi);
    await sendMessage(chatId, `🎵 *Rick Rubin:*\n\n${result.rubinReply}`, telegramApi);
  } else {
    const label = result.decision === 'droga' ? '🎯 *David Droga:*' : '🎵 *Rick Rubin:*';
    await sendMessage(chatId, `${label}\n\n${result.reply}`, telegramApi);
  }
}

// ─── Handlers exportados ──────────────────────────────────────────────────────
export async function handleGrowthMessage(chatId, text, telegramApi) {
  await sendMessage(chatId, '💭 _Consultando al Growth Council..._', telegramApi);
  try {
    await sendGrowthReply(chatId, text, telegramApi);
  } catch (err) {
    console.error('Growth Council error:', err.message);
    await sendMessage(chatId, `Error: ${err.message}`, telegramApi);
  }
  return true;
}

export async function handleGrowthVoice(chatId, voiceFileId, telegramApi) {
  const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${voiceFileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result?.file_path;
  if (!filePath) {
    await sendMessage(chatId, 'No pude obtener el archivo de voz.', telegramApi);
    return true;
  }

  const audioRes = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`);
  const audioBuffer = await audioRes.arrayBuffer();

  await sendMessage(chatId, '🎙️ _Escuchando..._', telegramApi);
  let transcription;
  try {
    transcription = await transcribeVoice(audioBuffer, 'audio/ogg');
  } catch (err) {
    await sendMessage(chatId, `Error de transcripcion: ${err.message}`, telegramApi);
    return true;
  }

  if (!transcription?.trim()) {
    await sendMessage(chatId, 'No entendí el audio. Intenta de nuevo.', telegramApi);
    return true;
  }

  await sendMessage(chatId, `_"${transcription.trim()}"_`, telegramApi);
  await sendMessage(chatId, '💭 _Consultando al Growth Council..._', telegramApi);
  try {
    await sendGrowthReply(chatId, transcription.trim(), telegramApi);
  } catch (err) {
    console.error('Growth Council error:', err.message);
    await sendMessage(chatId, `Error: ${err.message}`, telegramApi);
  }
  return true;
}

async function sendMessage(chatId, text, telegramApi) {
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
