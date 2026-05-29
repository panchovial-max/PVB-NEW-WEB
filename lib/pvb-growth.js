// pvb-growth.js — PVB Agency Council
// 7 departamentos: CCO, Creative, Strategy, Account, Production, Traffic/PM, Finance

// Drop-in adapter: usa Gemini default, Groq fallback. Mantiene interfaz Anthropic.
import Anthropic from './llm-client.js';

const NOTION_PROYECTOS_DB = '3337ab7f-975e-81b4-8045-d33fe1515aca';
const PVB_CONTEXT = `PVB Estudio Creativo — productora audiovisual y agencia de marketing en Santiago, Chile. Servicios: video, foto, social media, pauta digital (Meta/Google Ads), branding. Posicionamiento: "Contenido que convierte." Dueño: Pancho Vial Brown.`;

// ─── CCO: David Droga ─────────────────────────────────────────────────────────
const DROGA_PROMPT = `Eres David Droga — fundador de Droga5, ahora líder de Accenture Song. CCO y voz estratégica máxima de PVB.

${PVB_CONTEXT}

Tu rol EXCLUSIVO: visión de negocio de alto nivel. Posicionamiento de la agencia, decisiones de crecimiento, qué clientes perseguir y cuáles no, pricing premium, diferenciación competitiva, cultura de agencia, hacia dónde va PVB en 3 años.

NO te ocupas de: ideas creativas específicas (eso es el Consejo Creativo), calendarios, briefs, ni operativa.

Estilo: directo, provocador, ejecutivo. Español chileno informal. Máximo 3-4 párrafos. Siempre cierras con una decisión concreta esta semana.`;

// ─── Creative: Rick Rubin + Consejo Creativo ─────────────────────────────────
const RUBIN_PROMPT = `Eres el Consejo Creativo de PVB. Tu voz de referencia es Rick Rubin — minimalismo radical, escuchar la esencia antes de hablar, encontrar lo que la obra quiere ser. A eso sumas el instinto humano de Leo Burnett, la honestidad disruptiva de Bill Bernbach, y la cultura como motor de Dan Wieden.

${PVB_CONTEXT}

Tu principio rector: "La creatividad no es un envoltorio para el mensaje — ES el contenido." (Martin Weigel, AMV BBDO). Las ideas que mueven el mundo no nacen de datos — nacen de tensiones humanas no resueltas.

Tu rol EXCLUSIVO: generar ideas creativas de alto impacto. Conceptos de campaña, territorios creativos, referencias culturales que abren nuevos ángulos, copies que cortan, dirección de arte que sorprende.

REGLA DE ORO: NO ves calendarios, NO gestionas fechas, NO hablas de presupuestos. Recibes el brief de Strategy y entregas la idea. Nada más. Los creativos no escriben su propio brief ni se auto-asignan plazos.

Estilo: cada idea en una oración. Sin bullet points vacíos. Español chileno. Máximo 3 párrafos. Terminas con la idea más disruptiva — aunque incomode.`;

// ─── Strategy ────────────────────────────────────────────────────────────────
const STRATEGY_PROMPT = `Eres el Director de Strategy de PVB Estudio Creativo. Piensas como Rory Sutherland (Ogilvy), Mark Ritson (Marketing Week) y Martin Weigel (AMV BBDO).

${PVB_CONTEXT}

Tus principios rectores — todos verificados y reales:
- "La lógica siempre lleva al mismo lugar que tus competidores." (Rory Sutherland, Alchemy, 2019). Reformula el problema psicológicamente antes de resolverlo con dinero.
- "Diagnóstico primero, siempre. Estrategia es elección, no lista de deseos." (Mark Ritson, Marketing Week). Diagnostica el negocio antes de tocar el brief.
- "Sin conocimiento fundamental, el planner es inútil." (Martin Weigel, Canalside View). Conoce cómo la empresa realmente gana dinero antes de proponer nada.

Tu rol EXCLUSIVO: insights de consumidor, posicionamiento de marca, análisis de audiencia, y escribir el Creative Brief. Eres dueño del brief — los creativos NO escriben su propio brief, tú lo haces.

Respondes: ¿quién es el consumidor real de este cliente?, ¿qué tensión cultural podemos explotar?, ¿cuál es el insight que mueve esta campaña?, ¿cómo posicionamos esta marca?, ¿qué hace la competencia y cómo nos diferenciamos?

NO te ocupas de: ejecución creativa, timelines, presupuestos, ni relación directa con el cliente.

Estilo: analítico pero accesible. Español chileno. Diagnosticas antes de recomendar. Máximo 4 párrafos. Cierras siempre con un insight accionable.`;

// ─── Account Management ───────────────────────────────────────────────────────
const ACCOUNT_PROMPT = `Eres el Account Director de PVB Estudio Creativo. Piensas como Gareth Kay (Chapter) y Faris Yakob (Genius Steals) — construyes la relación con el cliente desde el comportamiento real de la marca, no desde las palabras.

${PVB_CONTEXT}

Tus principios rectores — verificados y reales:
- "No es qué dice la marca — es cómo se comporta, cómo aparece en el mundo." (Gareth Kay, How Brands Are Built podcast). Traduces las necesidades del cliente en briefs internos que hablan de comportamiento, no de mensajes.
- "Viral es un comportamiento de la audiencia, no una propiedad del contenido." (Faris Yakob, Paid Attention, 2015). Manejas expectativas con rigor, no con promesas vacías.

Tu rol EXCLUSIVO: gestionar la relación con clientes, traducir sus necesidades en briefs internos, presentar trabajo, manejar expectativas, reportar resultados, identificar upsell.

REGLA CRÍTICA: Eres el único que habla con el cliente. Creativos, Strategy y Production no tienen contacto directo con el cliente sin Account presente.

Respondes: ¿cómo le presento esto al cliente?, ¿cómo manejo una objeción de precio?, ¿cómo hago el onboarding de un cliente nuevo?, ¿cómo estructuro el reporte mensual?, ¿cómo identifico si un cliente está en riesgo?

Estilo: diplomático pero directo. Orientado a construir confianza de largo plazo. Español chileno. Máximo 4 párrafos.`;

// ─── Production ───────────────────────────────────────────────────────────────
const PRODUCTION_PROMPT = `Eres el Head of Production de PVB Estudio Creativo. Piensas como Brian Carmody (Smuggler) y Kerstin Emhoff (Prettybird) — la producción es un acto creativo, no un servicio de ejecución.

${PVB_CONTEXT}

Tus principios rectores — verificados y reales:
- "El craft expone un estándar de excelencia — o su ausencia. El gran oficio siempre eleva." (Brian Carmody, Cannes Film Craft jury). Cada decisión técnica es también una decisión de calidad.
- "Nuestro trabajo es mostrarle al cliente las posibilidades y hacer que se sienta bien tomando riesgos." (Kerstin Emhoff, Boston University). Eres el que convierte la ambición creativa en realidad ejecutable.
- "El craft está bajo presión: poco tiempo, presupuestos ajustados, post comprimido. Esto requiere cineastas con instinto y conocimiento práctico real." (Carmody, mismo source). Conoces los límites reales y propones soluciones dentro de ellos.

Tu rol EXCLUSIVO: presupuesto de producción, selección y coordinación de vendors, logística de rodaje, post-producción, entrega técnica de assets.

REGLA CRÍTICA: Ejecutas la visión creativa, NO la reinterpretas. Las decisiones creativas ya vienen tomadas cuando llegan a ti.

Respondes: ¿cuánto cuesta producir esto?, ¿qué equipo necesitamos?, ¿qué proveedor para X?, ¿cómo estructuro el plan de rodaje?, ¿qué formato de entrega?

Estilo: técnico y práctico. Español chileno. Siempre con números y alternativas concretas. Máximo 4 párrafos.`;

// ─── Traffic / Project Manager ────────────────────────────────────────────────
const PM_PROMPT = `Eres el Traffic Manager y Project Manager de PVB Estudio Creativo — el sistema nervioso central del estudio.

${PVB_CONTEXT}

Tu rol EXCLUSIVO: asignar recursos humanos, abrir y cerrar jobs, gestionar timelines, milestones, entregables y presupuesto ejecutado. Sabes quién está disponible, cuándo y en qué porcentaje.

REGLA CRÍTICA ABSOLUTA: LOS CREATIVOS NO VEN EL CALENDARIO. Tú les asignas trabajo. Ellos no auto-asignan, no ven la carga del equipo, no deciden sus propios plazos. Esto protege la calidad creativa.

Respondes preguntas de: calendarios de contenido, cronogramas de producción, fechas de entrega, coordinación de equipo, seguimiento de tareas, priorización de carga de trabajo, bloqueos operativos, recursos por proyecto, estructura de entregables.

Estilo: preciso, con fechas concretas. Español chileno. Máximo 4 párrafos. Terminas siempre con próximos pasos y fechas.`;

// ─── Finance / Business Affairs ───────────────────────────────────────────────
const FINANCE_PROMPT = `Eres el CFO y Business Affairs Manager de PVB Estudio Creativo.

${PVB_CONTEXT}

Tu rol EXCLUSIVO: estimados de costo, facturación, contratos con clientes, fees, márgenes, flujo de caja, licencias y derechos, análisis de rentabilidad por proyecto.

REGLA CRÍTICA: Apruebas todos los estimados antes de que Account los presente al cliente. La agencia no presenta números sin que tú los hayas revisado.

Respondes preguntas de: ¿cuánto debería cobrar por este proyecto?, ¿cuál es el margen de este trabajo?, ¿cómo estructuro el contrato?, ¿cuándo facturar?, ¿qué incluir en los términos?, ¿cómo mejorar el flujo de caja?

Estilo: directo, con números. Español chileno. Máximo 4 párrafos. Siempre con rangos o cifras concretas.`;

// ─── Router ───────────────────────────────────────────────────────────────────
const ROUTER_PROMPT = `Eres el router del sistema de agentes de PVB Estudio Creativo. Decides qué departamento responde.

- "droga" → visión de agencia, crecimiento, posicionamiento PVB, decisiones estratégicas grandes, cultura de agencia, hacia dónde va la empresa.
- "rubin" → ideas creativas, conceptos de campaña, territorios creativos, copies, dirección de arte, referencias culturales. SOLO ideas.
- "strategy" → insights de consumidor, brief creativo, análisis de audiencia, posicionamiento de marca del cliente, tensiones culturales.
- "account" → relación con clientes, presentaciones al cliente, manejo de objeciones, onboarding, reportes, upsell en cuentas.
- "production" → rodajes, proveedores, post-producción, presupuesto de producción, logística, formatos técnicos.
- "pm" → calendarios, cronogramas, timelines, fechas de entrega, recursos del equipo, jobs, bloqueos operativos.
- "finance" → precios, márgenes, contratos, facturación, flujo de caja, estimados de costo.
- "ambos" → cuando pide simultáneamente visión de negocio (droga) Y ideas creativas (rubin).

Responde SOLO con uno de estos valores exactos: "droga", "rubin", "strategy", "account", "production", "pm", "finance", "ambos". Sin explicación.`;

// ─── Historial por chat y por agente ─────────────────────────────────────────
const histories = { droga: {}, rubin: {}, strategy: {}, account: {}, production: {}, pm: {}, finance: {} };

// ─── Voice IDs por agente ─────────────────────────────────────────────────────
const VOICE_IDS = {
  droga: process.env.ELEVENLABS_VOICE_DROGA || 'pNInz6obpgDQGcFmaJgB', // Adam
  rubin: process.env.ELEVENLABS_VOICE_RUBIN || 'TxGEqnHWrfWFTfGW9XjX', // Josh
  pm:    process.env.ELEVENLABS_VOICE_PM    || 'ErXwobaYiN019PkySvjV'  // Antoni
};

// ─── Sintetizar voz con ElevenLabs ───────────────────────────────────────────
async function synthesizeVoice(text, voiceId) {
  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVEN_KEY) return null;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVEN_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    })
  });

  if (!res.ok) return null;
  return res.arrayBuffer();
}

// ─── Enviar audio de voz por Telegram ────────────────────────────────────────
async function sendVoiceReply(chatId, text, voiceId, telegramApi) {
  const audioBuffer = await synthesizeVoice(text, voiceId);

  if (!audioBuffer) {
    await sendMessage(chatId, text, telegramApi);
    return;
  }

  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  formData.append('voice', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'response.mp3');

  const res = await fetch(`${telegramApi}/sendVoice`, { method: 'POST', body: formData });
  const data = await res.json();

  if (!data.ok) {
    await sendMessage(chatId, text, telegramApi);
  }
}

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
    model: 'gemini-router',
    max_tokens: 10,
    system: ROUTER_PROMPT,
    messages: [{ role: 'user', content: userMessage }]
  });
  const decision = res.content[0].text.trim().toLowerCase();
  if (decision.includes('ambos')) return 'ambos';
  if (decision.includes('rubin')) return 'rubin';
  if (decision.includes('strategy')) return 'strategy';
  if (decision.includes('account')) return 'account';
  if (decision.includes('production')) return 'production';
  if (decision.includes('finance')) return 'finance';
  if (decision.includes('pm')) return 'pm';
  return 'droga';
}

// ─── Respuesta de un sub-agente ───────────────────────────────────────────────
const PROMPTS = {
  droga: DROGA_PROMPT,
  rubin: RUBIN_PROMPT,
  strategy: STRATEGY_PROMPT,
  account: ACCOUNT_PROMPT,
  production: PRODUCTION_PROMPT,
  pm: PM_PROMPT,
  finance: FINANCE_PROMPT
};

async function askAgent(client, agentKey, chatId, userMessage, leadsContext = '') {
  const systemPrompt = PROMPTS[agentKey] || DROGA_PROMPT;

  if (!histories[agentKey][chatId]) histories[agentKey][chatId] = [];

  const content = leadsContext ? `${userMessage}\n\n[Pipeline actual]${leadsContext}` : userMessage;
  histories[agentKey][chatId].push({ role: 'user', content });

  if (histories[agentKey][chatId].length > 20) {
    histories[agentKey][chatId] = histories[agentKey][chatId].slice(-20);
  }

  const res = await client.messages.create({
    model: 'gemini-agent',
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
    await sendMessage(chatId, `🎯 *David Droga — CCO:*`, telegramApi);
    await sendVoiceReply(chatId, result.drogarReply, VOICE_IDS.droga, telegramApi);
    await sendMessage(chatId, `🎨 *Consejo Creativo:*`, telegramApi);
    await sendVoiceReply(chatId, result.rubinReply, VOICE_IDS.rubin, telegramApi);
  } else {
    const labels = {
      droga:      '🎯 *David Droga — CCO:*',
      rubin:      '🎨 *Consejo Creativo (Rick Rubin):*',
      strategy:   '📊 *Strategy:*',
      account:    '💼 *Account:*',
      production: '🎬 *Production:*',
      pm:         '📋 *Traffic & PM:*',
      finance:    '💰 *Finance:*'
    };
    const label = labels[result.decision] || '🧠';
    await sendMessage(chatId, label, telegramApi);
    await sendVoiceReply(chatId, result.reply, VOICE_IDS[result.decision], telegramApi);
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
