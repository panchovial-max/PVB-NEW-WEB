// tasks-bot.js — pvb_tasks_bot
// Webhook Telegram → Tareas personales en Notion
// DB: ddaabf2319cd4ca09765f63976aa6c16
// Propiedades: Tarea (title), Estado (select), Prioridad (select), Fecha (date), Contexto (select)

const TASKS_DB_ID = 'ddaabf2319cd4ca09765f63976aa6c16';
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5999159507';

let TELEGRAM_API;
let NOTION_KEY;

function init() {
  TELEGRAM_API = `https://api.telegram.org/bot${process.env.TASKS_BOT_TOKEN}`;
  NOTION_KEY = process.env.NOTION_API_KEY;
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

  try {
    const update = req.body;
    const message = update.message || update.edited_message;
    if (!message?.text) return res.status(200).send('ok');

    const chatId = message.chat.id;
    const isOwner = String(chatId) === String(OWNER_CHAT_ID);

    // Solo responde al owner
    if (!isOwner) {
      await sendMessage(chatId, '🔒 Bot privado.');
      return res.status(200).send('ok');
    }

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

    return res.status(200).send('ok');
  } catch (err) {
    console.error('tasks-bot error:', err);
    return res.status(200).send('ok');
  }
}
