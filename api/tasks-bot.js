// tasks-bot.js — pvb_tasks_bot
// Webhook Telegram → Tareas personales en Notion
// DB: ddaabf2319cd4ca09765f63976aa6c16
// Propiedades: Tarea (title), Estado (select), Prioridad (select), Fecha (date), Contexto (select)

import { uploadFromUrl } from '../lib/google-drive.js';
import { notifyNotion } from '../lib/notion-query.js';

async function notifyDiscordError(source, err, context = {}) {
  const webhook = process.env.DISCORD_WEBHOOK_ERRORES;
  if (!webhook) return;
  const fields = Object.entries(context).map(([name, value]) => ({ name, value: String(value).slice(0, 1024), inline: true }));
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [{ title: `🚨 Error en ${source}`, description: `\`\`\`${err.message}\`\`\``, color: 0xff4444, fields, timestamp: new Date().toISOString() }] }),
  }).catch(() => {});
}

const TASKS_DB_ID = 'ddaabf2319cd4ca09765f63976aa6c16';
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5999159507';

let TELEGRAM_API;
let NOTION_KEY;
let GROQ_API_KEY;

function init() {
  TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TASKS_BOT_TOKEN}`;
  NOTION_KEY = process.env.NOTION_API_KEY;
  GROQ_API_KEY = process.env.GROQ_API_KEY;
}

// ─── Transcripción de audio con Groq Whisper ──────────────
async function transcribeAudio(fileId) {
  // 1. Obtener URL del archivo desde Telegram
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  if (!fileData.ok) throw new Error('No se pudo obtener el archivo de Telegram');

  const filePath = fileData.result.file_path;
  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TASKS_BOT_TOKEN}/${filePath}`;

  // 2. Descargar el audio
  const audioRes = await fetch(fileUrl);
  const audioBuffer = await audioRes.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });

  // 3. Enviar a Groq Whisper para transcripción
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.ogg');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'es');
  formData.append('response_format', 'json');

  const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: formData
  });

  const groqData = await groqRes.json();
  if (!groqData.text) throw new Error('Transcripción vacía');
  return groqData.text.trim();
}

// ─── Parsear texto libre en tarea con Claude ─────────────
async function parsearTareaConClaude(texto) {
  const hoy = new Date().toISOString().split('T')[0];
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Extrae la información de esta tarea personal en JSON. Hoy es ${hoy}.

Texto: "${texto}"

Responde SOLO con JSON válido, sin markdown:
{
  "nombre": "nombre de la tarea",
  "contexto": "Familia|Personal|Salud|Casa|Finanzas|Trabajo|null",
  "prioridad": "Alta|Media|Baja",
  "fecha": "YYYY-MM-DD o null"
}

Si no puedes determinar un campo, usa null para contexto/fecha y "Media" para prioridad.`
      }]
    })
  });

  const data = await res.json();
  const content = data.content?.[0]?.text || '{}';
  try {
    return JSON.parse(content);
  } catch {
    return { nombre: texto, prioridad: 'Media', contexto: null, fecha: null };
  }
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

async function notionQuery(filter = {}, sorts = []) {
  const body = { page_size: 50 };
  if (filter && Object.keys(filter).length) body.filter = filter;
  if (sorts.length) body.sorts = sorts;

  const res = await fetch(`https://api.notion.com/v1/databases/${TASKS_DB_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function notionCreate(props) {
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: { database_id: TASKS_DB_ID },
      properties: props
    })
  });
  return res.json();
}

async function notionUpdate(pageId, props) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties: props })
  });
  return res.json();
}

function parseTask(page) {
  const p = page.properties;
  return {
    id: page.id,
    nombre: p.Tarea?.title?.[0]?.plain_text || 'Sin nombre',
    estado: p.Estado?.select?.name || 'Sin estado',
    prioridad: p.Prioridad?.select?.name || '',
    fecha: p.Fecha?.date?.start || '',
    contexto: p.Contexto?.select?.name || ''
  };
}

const PRIORIDAD_ICON = { 'Alta': '🔴', 'Media': '🟡', 'Baja': '🟢' };
const ESTADO_ICON = { 'Pendiente': '⏳', 'En progreso': '🔄', 'Completada': '✅', 'Cancelada': '❌' };
const CONTEXTO_ICON = { 'Familia': '👨‍👩‍👧', 'Personal': '👤', 'Salud': '💪', 'Casa': '🏠', 'Finanzas': '💰', 'Trabajo': '💼' };

function formatTask(t) {
  const pri = PRIORIDAD_ICON[t.prioridad] || '▪️';
  const ctx = CONTEXTO_ICON[t.contexto] || '';
  const fecha = t.fecha ? ` · ${t.fecha}` : '';
  const contexto = t.contexto ? ` _${escapeMarkdown(t.contexto)}_` : '';
  return `${pri} *${escapeMarkdown(t.nombre)}*${contexto}${fecha}`;
}

// ─── Comandos ───────────────────────────────────────────

async function handleStart(chatId) {
  await sendMessage(chatId,
    `✅ *PVB Tasks Bot*\n\n` +
    `*Ver tareas*\n` +
    `/tareas — Todas las pendientes\n` +
    `/hoy — Tareas de hoy\n` +
    `/semana — Tareas de esta semana\n` +
    `/contexto Familia — Por contexto\n\n` +
    `*Gestionar*\n` +
    `/agregar Tarea | Contexto | Prioridad | Fecha\n` +
    `/completar nombre — Marcar completada\n` +
    `/borrar nombre — Cancelar tarea\n\n` +
    `*Contextos:* Familia, Personal, Salud, Casa, Finanzas, Trabajo\n` +
    `*Prioridades:* Alta, Media, Baja\n\n` +
    `/ping — Test de conexión`
  );
}

async function handleTareas(chatId) {
  try {
    const data = await notionQuery(
      {
        and: [
          { property: 'Estado', select: { does_not_equal: 'Completada' } },
          { property: 'Estado', select: { does_not_equal: 'Cancelada' } }
        ]
      },
      [{ property: 'Fecha', direction: 'ascending' }, { property: 'Prioridad', direction: 'ascending' }]
    );

    if (!data.results?.length) {
      await sendMessage(chatId, '🎉 No tienes tareas pendientes.');
      return;
    }

    const tareas = data.results.map(parseTask);

    // Agrupar por contexto
    const porContexto = {};
    for (const t of tareas) {
      const ctx = t.contexto || 'Sin contexto';
      if (!porContexto[ctx]) porContexto[ctx] = [];
      porContexto[ctx].push(t);
    }

    const lines = [];
    for (const [ctx, ts] of Object.entries(porContexto)) {
      const icon = CONTEXTO_ICON[ctx] || '📌';
      lines.push(`\n${icon} *${escapeMarkdown(ctx)}*`);
      for (const t of ts) lines.push(formatTask(t));
    }

    await sendMessage(chatId, `📋 *Tareas pendientes (${tareas.length})*\n${lines.join('\n')}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleHoy(chatId) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const data = await notionQuery({
      and: [
        { property: 'Fecha', date: { equals: hoy } },
        { property: 'Estado', select: { does_not_equal: 'Completada' } },
        { property: 'Estado', select: { does_not_equal: 'Cancelada' } }
      ]
    });

    if (!data.results?.length) {
      await sendMessage(chatId, `📅 No hay tareas para hoy (${hoy}).`);
      return;
    }

    const tareas = data.results.map(parseTask);
    const lines = tareas.map(formatTask);
    await sendMessage(chatId, `📅 *Hoy (${hoy}) — ${tareas.length} tareas*\n\n${lines.join('\n')}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleSemana(chatId) {
  try {
    const hoy = new Date();
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() + 7);
    const desde = hoy.toISOString().split('T')[0];
    const hasta = fin.toISOString().split('T')[0];

    const data = await notionQuery({
      and: [
        { property: 'Fecha', date: { on_or_after: desde } },
        { property: 'Fecha', date: { on_or_before: hasta } },
        { property: 'Estado', select: { does_not_equal: 'Completada' } },
        { property: 'Estado', select: { does_not_equal: 'Cancelada' } }
      ]
    }, [{ property: 'Fecha', direction: 'ascending' }]);

    if (!data.results?.length) {
      await sendMessage(chatId, `📅 No hay tareas para los próximos 7 días.`);
      return;
    }

    const tareas = data.results.map(parseTask);
    const lines = tareas.map(formatTask);
    await sendMessage(chatId, `📅 *Esta semana — ${tareas.length} tareas*\n\n${lines.join('\n')}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handlePorContexto(chatId, contexto) {
  try {
    if (!contexto) {
      await sendMessage(chatId, `❌ Indica un contexto. Ej: /contexto Familia\n\nContextos: Familia, Personal, Salud, Casa, Finanzas, Trabajo`);
      return;
    }

    const data = await notionQuery({
      and: [
        { property: 'Contexto', select: { equals: contexto } },
        { property: 'Estado', select: { does_not_equal: 'Completada' } },
        { property: 'Estado', select: { does_not_equal: 'Cancelada' } }
      ]
    }, [{ property: 'Fecha', direction: 'ascending' }]);

    if (!data.results?.length) {
      await sendMessage(chatId, `📭 No hay tareas pendientes en _${escapeMarkdown(contexto)}_.`);
      return;
    }

    const tareas = data.results.map(parseTask);
    const icon = CONTEXTO_ICON[contexto] || '📌';
    const lines = tareas.map(formatTask);
    await sendMessage(chatId, `${icon} *${escapeMarkdown(contexto)} (${tareas.length})*\n\n${lines.join('\n')}`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleAgregar(chatId, args) {
  // /agregar Nombre | Contexto | Prioridad | Fecha
  if (!args.length) {
    await sendMessage(chatId,
      `📝 *Agregar tarea*\n\nUso:\n/agregar Nombre \\| Contexto \\| Prioridad \\| Fecha\n\nEjemplo:\n/agregar Ir al dentista \\| Salud \\| Alta \\| 2026-06-01\n\n_Contexto y Prioridad opcionales_`
    );
    return;
  }

  const parts = args.join(' ').split('|').map(s => s.trim());
  const [nombre, contexto, prioridad, fecha] = parts;

  if (!nombre) {
    await sendMessage(chatId, '❌ El nombre de la tarea es requerido.');
    return;
  }

  try {
    const props = {
      Tarea: { title: [{ text: { content: nombre } }] },
      Estado: { select: { name: 'Pendiente' } }
    };
    if (contexto) props.Contexto = { select: { name: contexto } };
    if (prioridad) props.Prioridad = { select: { name: prioridad } };
    if (fecha) props.Fecha = { date: { start: fecha } };

    const page = await notionCreate(props);
    if (page.id) {
      const icon = CONTEXTO_ICON[contexto] || '✅';
      await sendMessage(chatId,
        `${icon} *Tarea creada*\n\n*${escapeMarkdown(nombre)}*` +
        (contexto ? `\nContexto: ${escapeMarkdown(contexto)}` : '') +
        (prioridad ? `\nPrioridad: ${prioridad}` : '') +
        (fecha ? `\nFecha: ${fecha}` : '')
      );
    } else {
      await sendMessage(chatId, `❌ Error creando tarea: ${escapeMarkdown(page.message || 'Error desconocido')}`);
    }
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleCompletar(chatId, args) {
  if (!args.length) {
    await sendMessage(chatId, '✅ Uso: /completar nombre de la tarea');
    return;
  }

  const busqueda = args.join(' ').trim();
  try {
    const data = await notionQuery({
      and: [
        { property: 'Estado', select: { does_not_equal: 'Completada' } },
        { property: 'Estado', select: { does_not_equal: 'Cancelada' } }
      ]
    });

    const tarea = data.results?.map(parseTask).find(t =>
      t.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (!tarea) {
      await sendMessage(chatId, `❌ No encontré tarea con "_${escapeMarkdown(busqueda)}_"`);
      return;
    }

    await notionUpdate(tarea.id, { Estado: { select: { name: 'Completada' } } });
    await sendMessage(chatId, `✅ *${escapeMarkdown(tarea.nombre)}* marcada como completada.`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

async function handleBorrar(chatId, args) {
  if (!args.length) {
    await sendMessage(chatId, '❌ Uso: /borrar nombre de la tarea');
    return;
  }

  const busqueda = args.join(' ').trim();
  try {
    const data = await notionQuery({
      and: [
        { property: 'Estado', select: { does_not_equal: 'Completada' } },
        { property: 'Estado', select: { does_not_equal: 'Cancelada' } }
      ]
    });

    const tarea = data.results?.map(parseTask).find(t =>
      t.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    if (!tarea) {
      await sendMessage(chatId, `❌ No encontré tarea con "_${escapeMarkdown(busqueda)}_"`);
      return;
    }

    await notionUpdate(tarea.id, { Estado: { select: { name: 'Cancelada' } } });
    await sendMessage(chatId, `🗑️ *${escapeMarkdown(tarea.nombre)}* cancelada.`);
  } catch (err) {
    await sendMessage(chatId, `❌ Error: ${escapeMarkdown(err.message)}`);
  }
}

// ─── Handler principal ──────────────────────────────────

export default async function handler(req, res) {
  init();

  if (req.method !== 'POST') {
    return res.status(200).send('PVB Tasks Bot OK');
  }

  // Responder 200 inmediatamente para evitar timeout de Telegram (5s)
  res.status(200).send('ok');

  try {
    const update = req.body;
    const message = update.message || update.edited_message;
    if (!message) return;

    const chatId = message.chat.id;
    const isOwner = String(chatId) === String(OWNER_CHAT_ID);

    // Solo responde al owner
    if (!isOwner) {
      await sendMessage(chatId, '🔒 Bot privado.');
      return;
    }

    // ── Audio/voz → transcribir y crear tarea ──
    if (message.voice || message.audio) {
      const fileId = (message.voice || message.audio).file_id;
      await sendMessage(chatId, '🎙️ _Transcribiendo audio..._');
      try {
        const transcripcion = await transcribeAudio(fileId);
        await sendMessage(chatId, `📝 _"${escapeMarkdown(transcripcion)}"_\n\n🧠 _Procesando tarea..._`);

        const tarea = await parsearTareaConClaude(transcripcion);

        const props = {
          Tarea: { title: [{ text: { content: tarea.nombre } }] },
          Estado: { select: { name: 'Pendiente' } }
        };
        if (tarea.contexto) props.Contexto = { select: { name: tarea.contexto } };
        if (tarea.prioridad) props.Prioridad = { select: { name: tarea.prioridad } };
        if (tarea.fecha) props.Fecha = { date: { start: tarea.fecha } };

        const page = await notionCreate(props);
        if (page.id) {
          const icon = CONTEXTO_ICON[tarea.contexto] || '✅';
          await sendMessage(chatId,
            `${icon} *Tarea creada desde audio*\n\n*${escapeMarkdown(tarea.nombre)}*` +
            (tarea.contexto ? `\nContexto: ${escapeMarkdown(tarea.contexto)}` : '') +
            (tarea.prioridad ? `\nPrioridad: ${tarea.prioridad}` : '') +
            (tarea.fecha ? `\nFecha: ${tarea.fecha}` : '')
          );
        } else {
          await sendMessage(chatId, `❌ Error creando tarea: ${escapeMarkdown(page.message || 'Error desconocido')}`);
        }
      } catch (err) {
        await sendMessage(chatId, `❌ Error procesando audio: ${escapeMarkdown(err.message)}`);
      }
      return;
    }

    // ── Fotos → guardar en Drive ───────────────────────────────
    if (message.photo) {
      const photo = message.photo[message.photo.length - 1]; // mayor resolución
      try {
        const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${photo.file_id}`);
        const fileData = await fileRes.json();
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TASKS_BOT_TOKEN}/${fileData.result.file_path}`;
        const filename = `foto-${Date.now()}.jpg`;
        const file = await uploadFromUrl({ url: fileUrl, filename, mimeType: 'image/jpeg', project: null });
        await sendMessage(chatId, `📁 Foto guardada en Drive\n[Ver archivo](${file.webViewLink})`);
        if (NOTION_KEY) notifyNotion(NOTION_KEY, { tipo: 'archivo_recibido', titulo: `Foto recibida: ${filename}`, detalle: file.webViewLink, origen: 'tasks-bot' });
      } catch (err) {
        await sendMessage(chatId, `❌ Error guardando foto: ${err.message}`);
      }
      return;
    }

    // ── Documentos → guardar en Drive ─────────────────────────
    if (message.document) {
      const doc = message.document;
      try {
        const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${doc.file_id}`);
        const fileData = await fileRes.json();
        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TASKS_BOT_TOKEN}/${fileData.result.file_path}`;
        const file = await uploadFromUrl({ url: fileUrl, filename: doc.file_name || `doc-${Date.now()}`, mimeType: doc.mime_type || 'application/octet-stream', project: null });
        await sendMessage(chatId, `📁 Documento guardado en Drive\n[Ver archivo](${file.webViewLink})`);
        if (NOTION_KEY) notifyNotion(NOTION_KEY, { tipo: 'archivo_recibido', titulo: `Documento: ${doc.file_name || 'sin nombre'}`, detalle: file.webViewLink, origen: 'tasks-bot' });
      } catch (err) {
        await sendMessage(chatId, `❌ Error guardando documento: ${err.message}`);
      }
      return;
    }

    if (!message.text) return;
    const text = message.text.trim();

    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const command = parts[0].split('@')[0].toLowerCase();
      const args = parts.slice(1);

      switch (command) {
        case '/start':
        case '/help':
          await handleStart(chatId);
          break;
        case '/ping':
          await sendMessage(chatId, '✅ Tasks bot activo y conectado a Notion.');
          break;
        case '/tareas':
          await handleTareas(chatId);
          break;
        case '/hoy':
          await handleHoy(chatId);
          break;
        case '/semana':
          await handleSemana(chatId);
          break;
        case '/contexto':
          await handlePorContexto(chatId, args.join(' ').trim());
          break;
        case '/agregar':
          await handleAgregar(chatId, args);
          break;
        case '/completar':
          await handleCompletar(chatId, args);
          break;
        case '/borrar':
          await handleBorrar(chatId, args);
          break;
        default:
          await sendMessage(chatId, `Comando no reconocido. Usa /help para ver los disponibles.`);
      }
    } else {
      await sendMessage(chatId, '💬 Usa los comandos del bot. Envía /help para ver opciones.');
    }

    return;
  } catch (err) {
    console.error('tasks-bot error:', err);
    await notifyDiscordError('tasks-bot.js', err);
    return;
  }
}
