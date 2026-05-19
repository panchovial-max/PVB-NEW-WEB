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
} from './notion-query.js';
import { askClaude } from './telegram-ai.js';

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
        `*Agentes*\n` +
        `/agentes — Estado del equipo\n` +
        `/ping — Test de conexión`
      );
      break;

    case '/ping':
      await sendMessage(chatId, '✅ Bot activo y respondiendo.');
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
    const message = update.message || update.edited_message;
    if (!message?.text) return res.status(200).send('ok');

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const command = parts[0].split('@')[0];
      const args = parts.slice(1);
      await handleCommand(chatId, command, args);
    } else {
      await sendMessage(chatId, '🧠 _Procesando..._');
      const reply = await askClaude(text, NOTION_KEY, process.env.ANTHROPIC_API_KEY);
      await sendMessage(chatId, reply);
    }

    return res.status(200).send('ok');
  } catch (err) {
    console.error('telegram-bot error:', err);
    return res.status(200).send('ok');
  }
}
