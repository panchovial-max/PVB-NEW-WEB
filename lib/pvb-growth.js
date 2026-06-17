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

CRITERIOS DE CALIFICACIÓN PVB (úsalos para recomendar qué leads priorizar o descartar):
- Califica: budget mínimo $500.000 CLP producción puntual / $350.000/mes social media. Problema claramente audiovisual o marketing. Tomador de decisión accesible.
- Industrias afines: retail, gastronomía, inmobiliario, salud, educación, lifestyle, tecnología.
- Descalifica: budget <$300.000, quieren "solo el video" sin estrategia con mínimo, industrias ajenas (minería, sector público, industria pesada), piden exclusividad de sector gratis.
- Pipeline sano: 4-8 leads en Brief+Propuesta. Alarma si <3 o >12.
- Competencia en Santiago: productoras grandes (FilmChile, Storyboard) → PVB es más ágil y digital-first. Agencias (La Maquina, Porta) → PVB no tiene overhead de agencia. Freelancers → PVB entrega sistema completo, no solo ejecución.

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

MANEJO DE OBJECIONES PVB (respuestas concretas, no genéricas):
- "Es muy caro" → No bajar precio directo. Primero: preguntar qué parte del scope pueden reducir (versión light). Segundo: mostrar el ROI (¿cuánto les cuesta NO resolver esto?). Tercero si insisten: proponer plan de pago 50/25/25 o proyecto más acotado como entrada.
- "Lo estamos evaluando / lo pensamos" → Señal de que falta urgencia. Preguntar cuándo necesitan el resultado final. Si el deadline es pronto: crear urgencia real ("para entregar en esa fecha necesitamos arrancar antes del [fecha]"). Si no hay deadline: calificar si realmente es lead o solo curiosidad.
- "Ya tenemos proveedor" → No atacar al proveedor. Preguntar qué tan contentos están (escuchar). Posicionar PVB como complemento, no reemplazo. Ofrecer proyecto piloto pequeño para mostrar diferencia.
- "Mándame un presupuesto primero" → Sin reunión no hay propuesta. Pedir 20 minutos de llamada. Si no quieren: enviar rango de precios por servicio, no propuesta completa. La propuesta completa es post-reunión siempre.

PROTOCOLO POST-VENTA (7 días después de entrega):
1. Mensaje de cierre: preguntar cómo están usando el material
2. NPS informal: "¿Lo recomendarías a alguien?" → si sí, preguntar a quién
3. Incentivo de referido: si refieren cliente que cierra → descuento en próximo proyecto
4. Seguimiento 30 días: check-in con métricas del contenido entregado

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

- "droga" → visión de agencia, crecimiento, posicionamiento PVB, decisiones estratégicas grandes, cultura de agencia, hacia dónde va la empresa, qué leads perseguir o descartar, calificar prospectos, pipeline sano vs en riesgo, competencia en Santiago, nuevo vector de servicios IA.
- "rubin" → ideas creativas, conceptos de campaña, territorios creativos, copies, dirección de arte, referencias culturales. SOLO ideas.
- "strategy" → insights de consumidor, brief creativo, análisis de audiencia, posicionamiento de marca del cliente, tensiones culturales.
- "account" → relación con clientes, presentaciones al cliente, manejo de objeciones ("muy caro", "lo pensamos", "ya tenemos proveedor", "mándame presupuesto"), onboarding, reportes, upsell, post-venta, activar referidos.
- "production" → rodajes, proveedores, post-producción, presupuesto de producción, logística, formatos técnicos.
- "pm" → calendarios, cronogramas, timelines, fechas de entrega, recursos del equipo, jobs, bloqueos operativos, seguimiento de entregables.
- "finance" → precios, márgenes, contratos, facturación, flujo de caja, estimados de costo, propuestas comerciales, pricing.
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

// ─── Pipeline completo desde Notion ──────────────────────────────────────────
const PIPELINE_STAGES = ['Brief', 'Propuesta', 'Negociacion', 'Cierre', 'En Produccion', 'Entregado'];

async function queryStage(NOTION_KEY, stage) {
  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_PROYECTOS_DB}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filter: { property: 'Estado', select: { equals: stage } },
      page_size: 15
    })
  });
  const data = await res.json();
  return data.results || [];
}

async function getPipelineContext() {
  const NOTION_KEY = process.env.NOTION_API_KEY;
  if (!NOTION_KEY) return { summary: '', byStage: {}, alerts: [] };

  try {
    const results = await Promise.all(PIPELINE_STAGES.map(s => queryStage(NOTION_KEY, s)));
    const byStage = {};
    PIPELINE_STAGES.forEach((stage, i) => {
      byStage[stage] = results[i].map(p => {
        const nombre = p.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre';
        const tipo = p.properties.Tipo?.select?.name || '—';
        const created = p.created_time?.split('T')[0] || '';
        const daysInStage = Math.floor((Date.now() - new Date(p.created_time)) / 86400000);
        return { nombre, tipo, created, daysInStage };
      });
    });

    // Alertas de pipeline
    const alerts = [];
    const activeCount = (byStage['Brief']?.length || 0) + (byStage['Propuesta']?.length || 0);
    if (activeCount < 3) alerts.push('⚠️ Pipeline bajo: menos de 3 leads activos');
    if (activeCount > 12) alerts.push('⚠️ Pipeline saturado: más de 12 leads activos');
    const enNegociacion = byStage['Negociacion'] || [];
    enNegociacion.filter(l => l.daysInStage > 14).forEach(l =>
      alerts.push(`⚠️ "${l.nombre}" lleva ${l.daysInStage} días en Negociación`)
    );
    const enPropuesta = byStage['Propuesta'] || [];
    enPropuesta.filter(l => l.daysInStage > 7).forEach(l =>
      alerts.push(`⚠️ "${l.nombre}" sin respuesta hace ${l.daysInStage} días`)
    );
    const enProduccion = byStage['En Produccion'] || [];
    if (enProduccion.length > 6) alerts.push(`⚠️ Riesgo operacional: ${enProduccion.length} proyectos en producción simultánea`);

    // Texto resumen para inyectar en prompts
    const lines = PIPELINE_STAGES.map(stage => {
      const items = byStage[stage] || [];
      if (!items.length) return null;
      const detail = items.map(l => `  - ${l.nombre} (${l.tipo}, ${l.daysInStage}d)`).join('\n');
      return `${stage} (${items.length}):\n${detail}`;
    }).filter(Boolean);

    const summary = lines.length
      ? `\n[Pipeline PVB]\n${lines.join('\n')}${alerts.length ? '\n\n[Alertas]\n' + alerts.join('\n') : ''}`
      : '';

    return { summary, byStage, alerts };
  } catch {
    return { summary: '', byStage: {}, alerts: [] };
  }
}

// Compatibilidad con llamadas antiguas
async function getLeadsFromNotion() {
  const { summary } = await getPipelineContext();
  return summary;
}

// ─── Router: decide quién responde ───────────────────────────────────────────
async function routeMessage(client, userMessage) {
  const res = await client.messages.create({
    model: 'gemini-2.5-flash',
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
    model: 'gemini-2.5-flash',
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

  const [decision, { summary: pipelineContext }] = await Promise.all([
    routeMessage(client, userMessage),
    getPipelineContext()
  ]);

  if (decision === 'ambos') {
    const [drogarReply, rubinReply] = await Promise.all([
      askAgent(client, 'droga', chatId, userMessage, pipelineContext),
      askAgent(client, 'rubin', chatId, userMessage, pipelineContext)
    ]);
    return { decision, drogarReply, rubinReply };
  }

  const reply = await askAgent(client, decision, chatId, userMessage, pipelineContext);
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
export { getPipelineContext };

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
  console.log(`[Growth Voice] Recibido audio en chat ${chatId} con file_id ${voiceFileId}`);
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
