// telegram-bot.js — PVB Master Brain Bot
// Webhook Telegram → comandos conectados a Notion + Supabase
import { createClient } from '@supabase/supabase-js';
import {
  getProyectosActivos,
  getBoletasPendientes,
  getResumenFinanciero,
  createProyecto,
  updateProyectoEstado,
  addNotaProyecto
} from '../lib/notion-query.js';
import { askClaude } from '../lib/telegram-ai.js';
import { handleEsperanza, handleEsperanzaCommand, handleEsperanzaCallback } from '../lib/esperanza-bot.js';
import { handleGrowthMessage, getPipelineContext } from '../lib/pvb-growth.js';
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID;

let TELEGRAM_API;
let supabaseAdmin;
let NOTION_KEY;

function init() {
  TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  NOTION_KEY = process.env.NOTION_API_KEY;
  supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function transcribeAudio(fileId) {
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result?.file_path;
  if (!filePath) throw new Error('No se pudo obtener el archivo de voz');

  const audioRes = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`);
  const audioBuffer = await audioRes.arrayBuffer();

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) throw new Error('GROQ_API_KEY no configurada');

  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'es');
  formData.append('response_format', 'text');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}` },
    body: formData
  });
  if (!res.ok) throw new Error(`Groq Whisper error ${res.status}: ${await res.text()}`);
  return (await res.text()).trim();
}

function escapeMarkdown(text) {
  return String(text).replace(/[_*`[]/g, '\\$&');
}

async function sendMessage(chatId, text, options = {}) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...options })
  });
  const data = await res.json();
  if (!data.ok) console.error('❌ Telegram error:', data.description, '| text:', text.slice(0, 100));
  return data;
}

// ─── Session state para comandos multi-paso ───
const SESSION = {};

// ─── Keywords que activan el Growth Council ───────────────────────────────────
const GROWTH_KEYWORDS = [
  // Pipeline y leads
  'lead', 'leads', 'cliente nuevo', 'prospecto', 'pipeline', 'calificar', 'calificación',
  // Ventas
  'venta', 'vender', 'crecer', 'nuevos negocios', 'growth', 'outbound', 'propuesta comercial',
  'estrategia', 'referido', 'campaña de captación', 'escalar', 'escala', 'expandir',
  'ingresos', 'facturación', 'precio', 'tarifa', 'ticket', 'upsell', 'retención',
  // Objeciones
  'objeción', 'objeciones', 'muy caro', 'lo están evaluando', 'lo pensamos', 'ya tienen proveedor',
  'mándame presupuesto', 'mandame presupuesto',
  // Post-venta
  'post-venta', 'post venta', 'activar referido', 'cliente entregado', 'nps',
  // Posicionamiento y competencia
  'competencia', 'posicionamiento', 'mercado', 'canal', 'adquisición', 'captar',
  'ideas de negocio', 'oportunidad', 'diferenciación',
];

async function handleCommand(chatId, command, args) {
  switch (command) {
    case '/start':
    case '/help':
      await sendMessage(chatId,
        `🧠 *PVB Master Brain*\n\n` +
        `*Proyectos*\n` +
        `/proyectos — Proyectos activos\n` +
        `/nuevo — Crear proyecto en Notion\n` +
        `/estado — Cambiar estado de proyecto\n` +
        `/nota — Agregar nota a proyecto\n\n` +
        `*Finanzas*\n` +
        `/boletas — Boletas/facturas pendientes\n` +
        `/resumen — Resumen financiero del mes\n\n` +
        `*Clientes*\n` +
        `/clientes — Clientes con redes conectadas\n\n` +
        `*📈 Nuevos Negocios*\n` +
        `/pipeline — Estado completo del pipeline\n` +
        `/followup — Leads con follow-up urgente\n` +
        `/calificar — Calificar un prospecto\n` +
        `/propuesta — Generar propuesta comercial\n` +
        `/growth — Growth Council (texto libre)\n\n` +
        `*Agentes*\n` +
        `/agentes — Estado del equipo\n` +
        `/ping — Test de conexión\n\n` +
        `_O manda un audio para conversar estrategia_`
      );
      break;

    case '/ping':
      await sendMessage(chatId, '✅ Bot activo y respondiendo.');
      break;

    case '/growth':
      await sendMessage(chatId, '🎯🎵 _Growth Council activado — Droga, Rubin y el equipo listos. Cuéntame qué tienes en mente o mándame un audio._');
      break;

    case '/pipeline':
      await handlePipeline(chatId);
      break;

    case '/followup':
      await handleFollowup(chatId);
      break;

    case '/calificar':
      await handleCalificar(chatId, args);
      break;

    case '/propuesta':
      await handlePropuesta(chatId, args);
      break;

    case '/proyectos':
      await handleProyectos(chatId);
      break;

    case '/boletas':
      await handleBoletas(chatId);
      break;

    case '/resumen':
      await handleResumen(chatId);
      break;

    case '/clientes':
      await handleClientes(chatId);
      break;

    case '/agentes':
      await handleAgentes(chatId);
      break;

    case '/nuevo':
      await handleNuevoProyecto(chatId, args);
      break;

    case '/estado':
      await handleCambiarEstado(chatId, args);
      break;

    case '/nota':
      await handleAgregarNota(chatId, args);
      break;

    default:
      await sendMessage(chatId, `Comando no reconocido. Usa /help para ver los disponibles.`);
  }
}

async function handleProyectos(chatId) {
  try {
    const data = await getProyectosActivos(NOTION_KEY);
    if (!data.results?.length) {
      await sendMessage(chatId, '📭 No hay proyectos activos.');
      return;
    }

    const ESTADO_ICONS = {
      'Brief': '📋', 'Pre-produccion': '🔍',
      'Produccion': '🎬', 'Post-produccion': '✂️'
    };

    const lines = data.results.map(p => {
      const props = p.properties;
      const nombre = escapeMarkdown(props.Nombre?.title?.[0]?.plain_text || 'Sin nombre');
      const cliente = props.Cliente?.rich_text?.[0]?.plain_text || '';
      const estado = props.Estado?.select?.name || '';
      const entrega = props['Fecha Entrega']?.date?.start || '';
      const icon = ESTADO_ICONS[estado] || '▪️';
      return `${icon} *${nombre}*${cliente ? ' — ' + escapeMarkdown(cliente) : ''}\n   ${estado}${entrega ? ' · entrega ' + entrega : ''}`;
    });

    await sendMessage(chatId,
      `🎬 *Proyectos activos (${data.results.length})*\n\n${lines.join('\n\n')}`
    );
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleBoletas(chatId) {
  try {
    const data = await getBoletasPendientes(NOTION_KEY);
    if (!data.results?.length) {
      await sendMessage(chatId, '✅ No hay boletas/facturas pendientes.');
      return;
    }

    const lines = data.results.map(p => {
      const props = p.properties;
      const desc = escapeMarkdown(props.Descripcion?.title?.[0]?.plain_text || 'Sin descripción');
      const monto = props['Monto CLP']?.number ? `$${props['Monto CLP'].number.toLocaleString('es-CL')}` : '';
      const fecha = props.Fecha?.date?.start || '';
      const tipo = props['Tipo Documento']?.select?.name || '';
      return `• *${desc}*${monto ? ' — ' + monto : ''}\n  ${tipo}${fecha ? ' · ' + fecha : ''}`;
    });

    const total = data.results.reduce((s, p) => s + (p.properties['Monto CLP']?.number || 0), 0);

    await sendMessage(chatId,
      `🧾 *Pendientes (${data.results.length})*\n\n${lines.join('\n\n')}\n\n*Total: $${total.toLocaleString('es-CL')} CLP*`
    );
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleResumen(chatId) {
  try {
    const data = await getResumenFinanciero(NOTION_KEY);
    if (!data.results?.length) {
      await sendMessage(chatId, '📊 Sin registros procesados este mes.');
      return;
    }

    const porCategoria = {};
    let total = 0;
    for (const p of data.results) {
      const cat = p.properties.Categoria?.select?.name || 'Otro';
      const monto = p.properties['Monto CLP']?.number || 0;
      porCategoria[cat] = (porCategoria[cat] || 0) + monto;
      total += monto;
    }

    const mes = new Date().toLocaleString('es-CL', { month: 'long', year: 'numeric' });
    const lines = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, monto]) => `• ${cat}: $${monto.toLocaleString('es-CL')}`);

    await sendMessage(chatId,
      `📊 *Resumen ${mes}*\n\n${lines.join('\n')}\n\n*Total: $${total.toLocaleString('es-CL')} CLP*\n_${data.results.length} registros procesados_`
    );
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleClientes(chatId) {
  try {
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, email, company, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!profiles?.length) {
      await sendMessage(chatId, '📭 No hay clientes registrados.');
      return;
    }

    const { data: accounts } = await supabaseAdmin
      .from('social_accounts')
      .select('user_id, platform')
      .eq('is_active', true);

    const countByUser = {};
    for (const acc of accounts || []) {
      countByUser[acc.user_id] = (countByUser[acc.user_id] || 0) + 1;
    }

    const lines = profiles.map(p => {
      const name = escapeMarkdown(p.full_name || p.email || 'Sin nombre');
      const company = p.company ? ` — ${escapeMarkdown(p.company)}` : '';
      const redes = countByUser[p.id] ? ` *(${countByUser[p.id]} redes)*` : '';
      return `• ${name}${company}${redes}`;
    });

    await sendMessage(chatId, `👥 *Clientes (${profiles.length})*\n\n${lines.join('\n')}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handlePipeline(chatId) {
  try {
    await sendMessage(chatId, '📊 _Consultando pipeline..._');
    const { byStage, alerts } = await getPipelineContext();

    const ICONS = {
      'Brief': '📋', 'Propuesta': '📤', 'Negociacion': '🤝',
      'Cierre': '✅', 'En Produccion': '🎬', 'Entregado': '📦'
    };

    const lines = Object.entries(byStage).map(([stage, items]) => {
      if (!items.length) return `${ICONS[stage] || '▪️'} *${stage}*: vacío`;
      const detail = items.map(l => {
        const warning = (stage === 'Propuesta' && l.daysInStage > 7) || (stage === 'Negociacion' && l.daysInStage > 14) ? ' ⚠️' : '';
        return `  • ${escapeMarkdown(l.nombre)} (${l.daysInStage}d)${warning}`;
      }).join('\n');
      return `${ICONS[stage] || '▪️'} *${stage}* (${items.length})\n${detail}`;
    }).filter(Boolean);

    const activeCount = (byStage['Brief']?.length || 0) + (byStage['Propuesta']?.length || 0);
    const healthIcon = activeCount < 3 ? '🔴' : activeCount > 12 ? '🟡' : '🟢';

    let msg = `${healthIcon} *Pipeline PVB — ${activeCount} leads activos*\n\n${lines.join('\n\n')}`;
    if (alerts.length) msg += `\n\n${alerts.join('\n')}`;

    await sendMessage(chatId, msg);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleFollowup(chatId) {
  try {
    const { byStage } = await getPipelineContext();

    const urgentes = [];
    (byStage['Propuesta'] || []).filter(l => l.daysInStage > 3).forEach(l =>
      urgentes.push({ stage: 'Propuesta', ...l, accion: 'Follow-up — ¿vieron la propuesta?' })
    );
    (byStage['Negociacion'] || []).filter(l => l.daysInStage > 7).forEach(l =>
      urgentes.push({ stage: 'Negociación', ...l, accion: 'Definir si avanza o se cierra' })
    );
    (byStage['Entregado'] || []).filter(l => l.daysInStage >= 7 && l.daysInStage <= 14).forEach(l =>
      urgentes.push({ stage: 'Entregado', ...l, accion: 'Activar protocolo post-venta / referido' })
    );

    if (!urgentes.length) {
      await sendMessage(chatId, '✅ No hay follow-ups urgentes por ahora.');
      return;
    }

    const lines = urgentes.map(u =>
      `• *${escapeMarkdown(u.nombre)}* — ${u.stage} (${u.daysInStage}d)\n  → ${u.accion}`
    );
    await sendMessage(chatId, `🔔 *Follow-ups urgentes (${urgentes.length})*\n\n${lines.join('\n\n')}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleCalificar(chatId, args) {
  if (!args.length) {
    await sendMessage(chatId,
      `🎯 *Calificar lead*\n\nUso: /calificar [descripción del prospecto]\n\nEjemplo:\n/calificar Restaurante en Providencia, quiere videos para Instagram, presupuesto mensual, dueño directo disponible`
    );
    return;
  }
  const descripcion = args.join(' ');
  try {
    await sendMessage(chatId, '🎯 _Evaluando con criterios PVB..._');
    const prompt = `Califica este prospecto para PVB Estudio Creativo usando los criterios BANT y los criterios específicos PVB:

Prospecto: "${descripcion}"

Criterios PVB:
- Budget mínimo: $500.000 CLP producción / $350.000/mes social media
- Califica: retail, gastronomía, inmobiliario, salud, educación, lifestyle, tecnología
- Descalifica: budget <$300.000, industrias ajenas (minería, sector público), piden exclusividad gratis

Responde con:
1. VEREDICTO: Califica / Descalifica / Necesita más info
2. RAZÓN: En 1-2 oraciones
3. PRÓXIMO PASO: Acción concreta esta semana

Español chileno directo. Sin bullet points innecesarios.`;

    const reply = await askClaude(prompt, NOTION_KEY, process.env.ANTHROPIC_API_KEY, chatId);
    await sendMessage(chatId, reply);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handlePropuesta(chatId, args) {
  if (!args.length) {
    await sendMessage(chatId,
      `📄 *Generar propuesta*\n\nUso: /propuesta Cliente \\| Servicio \\| Alcance \\| Fecha entrega\n\nEjemplo:\n/propuesta Restaurante El Árbol \\| Video corporativo 2 min \\| 1 día rodaje \\| 2026-07-15`
    );
    return;
  }

  const full = args.join(' ');
  const [cliente, servicio, alcance, fecha] = full.split('|').map(s => s.trim());

  if (!cliente || !servicio) {
    await sendMessage(chatId, '❌ Mínimo necesito: Cliente | Servicio');
    return;
  }

  try {
    await sendMessage(chatId, '📄 _Generando propuesta..._');
    const prompt = `Genera una propuesta comercial completa para PVB Estudio Creativo.

Cliente: ${cliente}
Servicio: ${servicio}
Alcance: ${alcance || 'estándar para este servicio'}
Fecha entrega: ${fecha || 'por definir'}

Estructura:
1. Resumen ejecutivo (3 líneas)
2. Nuestra propuesta (desglose por fases con montos en CLP)
3. Inversión total + forma de pago (50/50)
4. Timeline aproximado
5. Cierre con datos de contacto PVB

Rangos de referencia:
- Video corporativo 1-2 min: $800.000-$1.500.000
- Video 2-3 días rodaje: $1.500.000-$3.000.000
- Social media mensual: $350.000-$1.200.000
- Fotografía half day: $400.000-$700.000

Español chileno profesional pero directo. Formato markdown.`;

    const reply = await askClaude(prompt, NOTION_KEY, process.env.ANTHROPIC_API_KEY, chatId);
    await sendMessage(chatId, reply);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleAgentes(chatId) {
  const depts = {
    creative: 8, marketing: 12, engineering: 19,
    production: 5, qa: 8, analytics: 5,
    product: 5, support: 5, sales: 3
  };
  const total = Object.values(depts).reduce((a, b) => a + b, 0);
  const lines = Object.entries(depts).map(([d, n]) => `• ${d}: ${n}`);
  await sendMessage(chatId,
    `🤖 *Master Brain — ${total} agentes*\n\n${lines.join('\n')}\n\n_panchovial.com/masterbrain_`
  );
}

async function handleNuevoProyecto(chatId, args) {
  // Uso: /nuevo NombreProyecto | Cliente | Tipo | Presupuesto | FechaEntrega
  if (!args.length) {
    await sendMessage(chatId,
      `📋 *Nuevo proyecto*\n\nUso:\n/nuevo Nombre \\| Cliente \\| Tipo \\| Presupuesto \\| Fecha\n\nEjemplo:\n/nuevo Campaña Kaya \\| Kaya Unite \\| Video \\| 2500000 \\| 2026-06-30\n\nTipos: Video, Foto, Branding, Web, Social Media, Print`
    );
    return;
  }

  const full = args.join(' ');
  const parts = full.split('|').map(s => s.trim());
  const [nombre, cliente, tipo, presupuesto, fechaEntrega] = parts;

  if (!nombre) {
    await sendMessage(chatId, '❌ Nombre del proyecto requerido.');
    return;
  }

  try {
    const page = await createProyecto(NOTION_KEY, { nombre, cliente, tipo, presupuesto, fechaEntrega });
    if (page.id) {
      await sendMessage(chatId,
        `✅ *Proyecto creado en Notion*\n\n*${escapeMarkdown(nombre)}*${cliente ? '\nCliente: ' + escapeMarkdown(cliente) : ''}${tipo ? '\nTipo: ' + tipo : ''}${presupuesto ? '\nPresupuesto: $' + parseInt(presupuesto).toLocaleString('es-CL') : ''}${fechaEntrega ? '\nEntrega: ' + fechaEntrega : ''}`
      );
    } else {
      await sendMessage(chatId, `❌ Error creando proyecto: ${escapeMarkdown(page.message || 'Error desconocido')}`);
    }
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleCambiarEstado(chatId, args) {
  // Uso: /estado NombreProyecto | NuevoEstado
  if (!args.length) {
    await sendMessage(chatId,
      `📋 *Cambiar estado*\n\nUso:\n/estado Nombre \\| Estado\n\nEstados: Brief, Pre-produccion, Produccion, Post-produccion, Entregado, Archivado`
    );
    return;
  }

  const [busqueda, nuevoEstado] = args.join(' ').split('|').map(s => s.trim());
  if (!busqueda || !nuevoEstado) {
    await sendMessage(chatId, '❌ Formato: /estado Nombre \\| Estado');
    return;
  }

  try {
    const data = await getProyectosActivos(NOTION_KEY);
    const proyecto = data.results?.find(p =>
      p.properties.Nombre?.title?.[0]?.plain_text?.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (!proyecto) {
      await sendMessage(chatId, `❌ No encontré proyecto con "${escapeMarkdown(busqueda)}"`);
      return;
    }

    const nombre = proyecto.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre';
    await updateProyectoEstado(NOTION_KEY, proyecto.id, nuevoEstado);
    await sendMessage(chatId, `✅ *${escapeMarkdown(nombre)}* → ${nuevoEstado}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleAgregarNota(chatId, args) {
  // Uso: /nota NombreProyecto | Texto de la nota
  if (!args.length) {
    await sendMessage(chatId, `📝 Uso: /nota NombreProyecto \\| Texto de la nota`);
    return;
  }

  const [busqueda, nota] = args.join(' ').split('|').map(s => s.trim());
  if (!busqueda || !nota) {
    await sendMessage(chatId, '❌ Formato: /nota Nombre \\| Texto');
    return;
  }

  try {
    const data = await getProyectosActivos(NOTION_KEY);
    const proyecto = data.results?.find(p =>
      p.properties.Nombre?.title?.[0]?.plain_text?.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (!proyecto) {
      await sendMessage(chatId, `❌ No encontré proyecto con "${escapeMarkdown(busqueda)}"`);
      return;
    }

    const nombre = proyecto.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre';
    await addNotaProyecto(NOTION_KEY, proyecto.id, nota);
    await sendMessage(chatId, `✅ Nota agregada en *${escapeMarkdown(nombre)}*`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

export default async function handler(req, res) {
  init();

  if (req.method !== 'POST') {
    return res.status(200).send('PVB Master Brain Bot OK');
  }

  try {
    const update = req.body;

    // ── Callback queries (botones inline de Esperanza) ──
    // Must be checked before message extraction — callback_query updates have no top-level message
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbChatId = cb.message.chat.id;
      if (cb.data?.startsWith('esp_')) {
        await handleEsperanzaCallback(cbChatId, cb.data, cb.from, TELEGRAM_API);
      }
      await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id })
      });
      return res.status(200).send('ok');
    }

    const message = update.message || update.edited_message;
    if (!message) return res.status(200).send('ok');

    const chatId = message.chat.id;

    // ── Mensajes de voz → transcribir con Groq Whisper, luego rutear igual que texto ──
    if (message.voice || message.audio) {
      res.status(200).send('ok');
      const fileId = (message.voice || message.audio).file_id;
      await sendMessage(chatId, '🎙️ _Transcribiendo..._');
      let transcribed;
      try {
        transcribed = await transcribeAudio(fileId);
      } catch (err) {
        await sendMessage(chatId, `❌ Error de transcripción: ${escapeMarkdown(err.message)}`);
        return;
      }
      if (!transcribed) {
        await sendMessage(chatId, '⚠️ No entendí el audio, intenta de nuevo.');
        return;
      }
      await sendMessage(chatId, `🗣 _"${transcribed}"_`);
      // Continuar procesamiento con el texto transcrito (mismo flujo que texto)
      const isOwner = String(chatId) === String(OWNER_CHAT_ID);
      if (isOwner) {
        const isGrowthQuery = GROWTH_KEYWORDS.some(k => transcribed.toLowerCase().includes(k));
        if (isGrowthQuery) {
          await sendMessage(chatId, '📈 _Consultando al Growth Council..._');
          await handleGrowthMessage(chatId, transcribed, TELEGRAM_API);
        } else {
          await sendMessage(chatId, '🧠 _Procesando..._');
          const reply = await askClaude(transcribed, NOTION_KEY, process.env.ANTHROPIC_API_KEY, chatId);
          await sendMessage(chatId, reply);
        }
      } else {
        await handleEsperanza(chatId, transcribed, message.from, TELEGRAM_API);
      }
      return;
    }

    if (!message.text) return res.status(200).send('ok');
    const text = message.text.trim();

    // ── Reply a mensaje de proveedor → guardar en portal ──
    const replyTo = message.reply_to_message;
    if (replyTo?.text && replyTo.text.includes('Mensaje de proveedor')) {
      const match = replyTo.text.match(/provider_id:([a-f0-9-]{36})/);
      if (match) {
        res.status(200).send('ok');
        await supabaseAdmin.from('provider_messages').insert({
          provider_id: match[1],
          from_role: 'admin',
          from_name: 'Francisco — PVB Estudio Creativo',
          body: text
        });
        await sendMessage(chatId, '✓ Mensaje enviado al proveedor en el portal.');
        return;
      }
    }

    const isOwner = String(chatId) === String(OWNER_CHAT_ID);

    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const command = parts[0].split('@')[0];
      const args = parts.slice(1);
      // Comandos rápidos responden 200 al final normalmente
      const handled = await handleEsperanzaCommand(chatId, command, TELEGRAM_API);
      if (!handled) await handleCommand(chatId, command, args);
      return res.status(200).send('ok');
    } else if (isOwner) {
      res.status(200).send('ok');
      const isGrowthQuery = GROWTH_KEYWORDS.some(k => text.toLowerCase().includes(k));
      try {
        if (isGrowthQuery) {
          await sendMessage(chatId, '📈 _Pensando..._');
          await handleGrowthMessage(chatId, text, TELEGRAM_API);
        } else {
          await sendMessage(chatId, '🧠 _Procesando..._');
          const reply = await askClaude(text, NOTION_KEY, process.env.ANTHROPIC_API_KEY, chatId);
          await sendMessage(chatId, reply);
        }
      } catch (err) {
        console.error('[owner-msg] error:', err.message);
        await sendMessage(chatId, `⚠️ Error: ${escapeMarkdown(err.message.slice(0, 200))}`);
      }
    } else {
      res.status(200).send('ok');
      const handled = await handleEsperanza(chatId, text, message.from, TELEGRAM_API);
      if (!handled) {
        try {
          await sendMessage(chatId, '🧠 _Procesando..._');
          const reply = await askClaude(text, NOTION_KEY, process.env.ANTHROPIC_API_KEY, chatId);
          await sendMessage(chatId, reply);
        } catch (err) {
          console.error('[user-msg] error:', err.message);
          await sendMessage(chatId, `⚠️ Error procesando tu mensaje.`);
        }
      }
    }
  } catch (err) {
    console.error('telegram-bot error:', err);
    if (!res.headersSent) res.status(200).send('ok');
  }
}
