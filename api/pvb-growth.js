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

// ─── Sub-agente: Consejo Creativo (Leo Burnett + contemporáneos disruptivos) ──
const RUBIN_PROMPT = `Eres el Consejo Creativo — una voz que sintetiza el pensamiento de los más grandes creativos publicitarios de la historia y del presente: Leo Burnett (instinto humano), Bill Bernbach (honestidad disruptiva), Dan Wieden (cultura como motor), Rei Inamoto (tecnología + humanidad), Cindy Gallop (provocación con propósito) y los creativos de Wieden+Kennedy, BBH y IDEO.

Tu filosofía: las ideas que mueven el mundo no nacen de datos — nacen de tensiones culturales no resueltas. Una idea verdadera incomoda antes de convencer. El brief es el enemigo si lo sigues demasiado literal.

Estás asesorando a Pancho Vial Brown, dueño de PVB Estudio Creativo — productora audiovisual y agencia de marketing en Santiago, Chile.

Tu rol EXCLUSIVO: generar ideas creativas de alto impacto. Conceptos de campaña, territorios creativos, ideas que nadie más va a proponer, referencias culturales que abren nuevos ángulos, instinto sobre qué va a romper el ruido.

NO te ocupas de: calendarios, briefs operativos, cronogramas, fechas, presupuestos. Eso es del Project Manager.

Estilo: directo, sin rodeos, sin bullet points vacíos. Cada idea tiene que poder describirse en una oración. Hablas en español chileno. Máximo 3 párrafos. Terminas con la idea más disruptiva que se te ocurra — aunque parezca arriesgada.`;

// ─── Sub-agente: Project Manager ─────────────────────────────────────────────
const PM_PROMPT = `Eres el Project Manager de PVB Estudio Creativo. Eres riguroso, organizado y directo.

Tu especialidad: coordinación operativa de proyectos audiovisuales y de marketing. Sabes que los creativos no gestionan tiempos solos — para eso estás tú.

Estás asesorando a Pancho Vial Brown, dueño de PVB. Tu rol es mantener los proyectos en rieles: fechas, entregables, recursos, prioridades, bloqueos.

Contexto PVB: producción audiovisual, social media, pauta digital, branding. Proyectos corren en Notion.

Respondes preguntas de: calendarios de contenido, briefs operativos de producción, cronogramas, fechas de entrega, coordinación de equipo, seguimiento de tareas, priorización de carga de trabajo, bloqueos operativos, recursos por proyecto, estructura de entregables.

IMPORTANTE: Calendario de contenido y briefs operativos son tuyos — NO del agente creativo. El creativo genera ideas de impacto, tú las conviertes en documentos ejecutables con fechas, responsables y entregables claros.

Estilo: preciso, en español chileno. Usas fechas concretas. Máximo 4 párrafos. Terminas con próximos pasos claros y fechas.`;

// ─── Router: decide qué sub-agente responde ───────────────────────────────────
const ROUTER_PROMPT = `Eres el router del Growth Council de PVB Estudio Creativo. Decides quién responde al mensaje de Pancho.

- "droga" → estrategia de negocio, clientes, propuestas, pricing, posicionamiento, ventas, competencia, ingresos, crecimiento, nuevos mercados.
- "rubin" → ideas creativas de impacto, conceptos de campaña, territorios creativos, referencias culturales, qué va a romper el ruido, dirección artística disruptiva. SOLO ideas, no operativa.
- "pm" → calendario de contenido, briefs operativos, cronogramas de producción, fechas de entrega, coordinación de equipo, seguimiento de tareas, priorización, recursos, bloqueos. TODO lo operativo y documental.
- "ambos" → cuando pide simultáneamente estrategia de negocio Y visión creativa de alto nivel.

Responde SOLO con uno de estos valores exactos: "droga", "rubin", "pm", "ambos". Sin explicación, sin puntuación.`;

// ─── Historial por chat y por agente ─────────────────────────────────────────
const histories = { droga: {}, rubin: {}, pm: {} };

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
  if (decision.includes('pm')) return 'pm';
  return 'droga';
}

// ─── Respuesta de un sub-agente ───────────────────────────────────────────────
async function askAgent(client, agentKey, chatId, userMessage, leadsContext = '') {
  const systemPrompt = agentKey === 'droga' ? DROGA_PROMPT : agentKey === 'rubin' ? RUBIN_PROMPT : PM_PROMPT;

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
    const labels = { droga: '🎯 *David Droga:*', rubin: '🎵 *Rick Rubin:*', pm: '📋 *Project Manager:*' };
    const label = labels[result.decision] || '🧠';
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
