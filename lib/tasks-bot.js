// tasks-bot.js — PVB Tasks Bot
// Agente personal: tareas personales via texto o audio
// Notion DB: ✅ Tareas Personales | Obsidian: PVB-Brain/🧘 Personal/Ideas.md

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import os from 'os';

const NOTION_TASKS_DB = 'ddaabf23-19cd-4ca0-9765-f63976aa6c16';
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TASKS_BOT_TOKEN}`;

const SYSTEM_PROMPT = `Eres el asistente personal de Francisco (Pancho) Vial Brown — gestionas sus tareas personales en Notion y captura ideas en Obsidian.

Contextos disponibles: Personal, PVB, Salud, Familia, Finanzas
Estados: Pendiente, En Progreso, Completada, Cancelada
Prioridades: Alta, Media, Baja

Acciones disponibles:
- CREAR: agregar tarea con nombre, contexto, prioridad, fecha (si la menciona)
- LISTAR: mostrar tareas pendientes o por contexto
- COMPLETAR: marcar tarea como completada
- IDEA: capturar una idea o reflexión (va a Obsidian, no a Notion como tarea)
- NINGUNA: respuesta conversacional

Cuando el usuario hable por audio o texto, determina si es una TAREA (acción concreta a hacer) o una IDEA (pensamiento, reflexión, insight).
Las tareas van a Notion. Las ideas van a Obsidian.

Responde siempre en español chileno, directo y breve. Máximo 3-4 líneas.

Al final de cada respuesta incluye JSON de acción:
{"action": "create|list|complete|idea|none", "data": {...}}

Para "create": {"action":"create","data":{"tarea":"nombre","contexto":"Personal","prioridad":"Media","fecha":"2026-06-01","transcripcion":"texto original"}}
Para "idea": {"action":"idea","data":{"idea":"texto de la idea o reflexión"}}
Para "list": {"action":"list","data":{"contexto":"todas|Personal|PVB|..."}}
Para "complete": {"action":"complete","data":{"tarea":"nombre parcial"}}
Para "none": {"action":"none","data":{}}`;

// ─── Historial de conversación ────────────────────────────────────────────────
const histories = {};

// ─── Transcribir audio de Telegram ───────────────────────────────────────────
async function transcribeAudio(fileId) {
  // 1. Obtener URL del archivo en Telegram
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result?.file_path;
  if (!filePath) throw new Error('No se pudo obtener el archivo de audio');

  const botToken = process.env.TELEGRAM_TASKS_BOT_TOKEN;
  const audioUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

  // 2. Descargar el audio
  const audioRes = await fetch(audioUrl);
  const audioBuffer = await audioRes.arrayBuffer();
  const tmpPath = path.join(os.tmpdir(), `pvb_audio_${Date.now()}.ogg`);
  fs.writeFileSync(tmpPath, Buffer.from(audioBuffer));

  // 3. Transcribir con Whisper via OpenAI API
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  form.append('file', fs.createReadStream(tmpPath), { filename: 'audio.ogg', contentType: 'audio/ogg' });
  form.append('model', 'whisper-1');
  form.append('language', 'es');

  const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, ...form.getHeaders() },
    body: form,
  });

  fs.unlinkSync(tmpPath);
  const whisperData = await whisperRes.json();
  return whisperData.text || '';
}

// ─── Guardar idea en Notion (Tareas Personales, Contexto=Idea) ───────────────
// Vercel no tiene acceso al filesystem local, así que las ideas van a Notion.
// El plugin Notion-Obsidian sync puede jalarlas al vault PVB-Brain desde ahí.
async function saveIdeaToNotion(idea) {
  try {
    const NOTION_KEY = process.env.NOTION_API_KEY;
    const fecha = new Date().toISOString().split('T')[0];
    await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_TASKS_DB },
        properties: {
          Tarea: { title: [{ text: { content: idea.slice(0, 100) } }] },
          Estado: { select: { name: 'Pendiente' } },
          Contexto: { select: { name: 'Idea' } },
          Prioridad: { select: { name: 'Media' } },
          Fecha: { date: { start: fecha } },
          Transcripción: { rich_text: [{ text: { content: idea } }] },
        },
      }),
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Notion: crear tarea ──────────────────────────────────────────────────────
async function createTask(data) {
  const NOTION_KEY = process.env.NOTION_API_KEY;
  const props = {
    Tarea: { title: [{ text: { content: data.tarea || 'Sin nombre' } }] },
    Estado: { select: { name: 'Pendiente' } },
  };
  if (data.contexto) props['Contexto'] = { select: { name: data.contexto } };
  if (data.prioridad) props['Prioridad'] = { select: { name: data.prioridad } };
  if (data.fecha) props['Fecha'] = { date: { start: data.fecha } };
  if (data.transcripcion) props['Transcripción'] = { rich_text: [{ text: { content: data.transcripcion } }] };

  await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ parent: { database_id: NOTION_TASKS_DB }, properties: props }),
  });
}

// ─── Notion: listar tareas ────────────────────────────────────────────────────
async function listTasks(data) {
  const NOTION_KEY = process.env.NOTION_API_KEY;
  const filters = [];

  if (data.estado && data.estado !== 'todas') {
    filters.push({ property: 'Estado', select: { equals: data.estado } });
  }
  if (data.categoria && data.categoria !== 'todas') {
    filters.push({ property: 'Categoría', select: { equals: data.categoria } });
  }

  const body = {
    sorts: [{ property: 'Fecha', direction: 'ascending' }],
    page_size: 15
  };
  if (filters.length === 1) body.filter = filters[0];
  else if (filters.length > 1) body.filter = { and: filters };

  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_TASKS_DB}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return (json.results || []).map(p => ({
    id: p.id,
    tarea: p.properties.Tarea?.title?.[0]?.plain_text || '—',
    categoria: p.properties['Categoría']?.select?.name || '—',
    estado: p.properties.Estado?.select?.name || '—',
    prioridad: p.properties.Prioridad?.select?.name || '—',
    fecha: p.properties.Fecha?.date?.start || null
  }));
}

// ─── Notion: completar tarea ──────────────────────────────────────────────────
async function completeTask(data) {
  const NOTION_KEY = process.env.NOTION_API_KEY;
  const tasks = await listTasks({ estado: 'todas', categoria: 'todas' });
  const match = tasks.find(t =>
    t.tarea.toLowerCase().includes((data.tarea || '').toLowerCase())
  );
  if (!match) return false;

  await fetch(`https://api.notion.com/v1/pages/${match.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ properties: { Estado: { select: { name: '✅ Listo' } } } })
  });
  return match.tarea;
}

// ─── Claude: procesar mensaje ─────────────────────────────────────────────────
async function processMessage(chatId, userMessage) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  if (!histories[chatId]) histories[chatId] = [];
  histories[chatId].push({ role: 'user', content: userMessage });
  if (histories[chatId].length > 20) histories[chatId] = histories[chatId].slice(-20);

  const res = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: histories[chatId]
  });

  const reply = res.content[0].text;
  histories[chatId].push({ role: 'assistant', content: reply });

  // Extraer JSON de acción del final del reply
  let action = { action: 'none', data: {} };
  const jsonMatch = reply.match(/\{[\s\S]*"action"[\s\S]*\}(?:\s*)$/);
  if (jsonMatch) {
    try { action = JSON.parse(jsonMatch[0]); } catch {}
  }

  // Texto limpio sin el JSON — busca la primera línea que empieza con {"action"
  const lines = reply.split('\n');
  const jsonLine = lines.findIndex(l => l.trim().startsWith('{"action"'));
  const cleanReply = (jsonLine >= 0 ? lines.slice(0, jsonLine) : lines).join('\n').trim();

  // Ejecutar acción en Notion
  let notionResult = '';
  if (action.action === 'create') {
    await createTask(action.data);
    notionResult = '✅ Guardado en Notion.';
  } else if (action.action === 'idea') {
    const ok = await saveIdeaToNotion(action.data.idea || userMessage);
    notionResult = ok ? '💡 Idea guardada en Notion (sync a Obsidian).' : '⚠️ No pude guardar la idea.';
  } else if (action.action === 'list') {
    const tasks = await listTasks(action.data);
    if (tasks.length === 0) {
      notionResult = '_Sin tareas que mostrar._';
    } else {
      notionResult = tasks.map(t => {
        const fecha = t.fecha ? ` — ${t.fecha}` : '';
        return `${t.categoria} *${t.tarea}* ${t.prioridad}${fecha}`;
      }).join('\n');
    }
  } else if (action.action === 'complete') {
    const nombre = await completeTask(action.data);
    notionResult = nombre ? `✅ *${nombre}* marcada como lista.` : '⚠️ No encontré esa tarea.';
  }

  return notionResult
    ? `${cleanReply}\n\n${notionResult}`
    : cleanReply;
}

// ─── Enviar mensaje Telegram ──────────────────────────────────────────────────
async function sendMessage(chatId, text) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
  const data = await res.json();
  if (!data.ok) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  }
}

// ─── Webhook handler ──────────────────────────────────────────────────────────
export async function handleTasksMessage(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const { message } = req.body || {};
  if (!message) return res.status(200).json({ ok: true });

  const chatId = message.chat?.id;
  let text = message.text?.trim();
  const voice = message.voice || message.audio;

  if (!chatId) return res.status(200).json({ ok: true });

  if (text === '/start') {
    await sendMessage(chatId, '👋 Hola Pancho. Soy tu asistente personal.\n\nMándame un *audio* o escríbeme:\n— _"tengo que llamar al doctor el lunes"_ → tarea en Notion\n— _"se me ocurrió una idea para la campaña..."_ → idea en Obsidian\n— _"qué tengo pendiente"_ → lista tus tareas');
    return res.status(200).json({ ok: true });
  }

  // Transcribir audio si viene uno
  if (voice && !text) {
    await sendMessage(chatId, '🎙️ _Transcribiendo audio..._');
    try {
      text = await transcribeAudio(voice.file_id);
      await sendMessage(chatId, `📝 _"${text}"_`);
    } catch (err) {
      await sendMessage(chatId, '⚠️ No pude transcribir el audio. Intenta de nuevo.');
      return res.status(200).json({ ok: true });
    }
  }

  if (!text) return res.status(200).json({ ok: true });

  await sendMessage(chatId, '⏳ _Procesando..._');
  try {
    const reply = await processMessage(chatId, text);
    await sendMessage(chatId, reply);
  } catch (err) {
    console.error('Tasks bot error:', err.message);
    await sendMessage(chatId, `Error: ${err.message}`);
  }

  return res.status(200).json({ ok: true });
}
