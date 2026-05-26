// finances-bot.js — PVB Finances Bot
// OCR de boletas/facturas via OpenAI gpt-5.5 Vision → Notion + Google Drive
// Personal Finance + Corporate Finance para PVB

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Supabase (estado persistente entre requests) ─────────────────────────────
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getPending(chatId) {
  const sb = getSupabase();
  const { data } = await sb.from('ocr_pending').select('*').eq('chat_id', chatId).single();
  return data || null;
}

async function setPending(chatId, payload) {
  const sb = getSupabase();
  await sb.from('ocr_pending').upsert({ chat_id: chatId, ...payload });
}

async function deletePending(chatId) {
  const sb = getSupabase();
  await sb.from('ocr_pending').delete().eq('chat_id', chatId);
}

// ─── Google Drive (Service Account) ──────────────────────────────────────────
const SA_KEY_PATH = join(__dirname, 'pvb-finances-sa.json');
const DRIVE_ROOT_FOLDER_ID = '1n8CSParCJDBwQCZZi5ptw36QbaaatJLS';

let _driveClient = null;

async function getDriveClient() {
  if (_driveClient) return _driveClient;

  let credentials;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else {
    const { readFileSync } = await import('fs');
    credentials = JSON.parse(readFileSync(SA_KEY_PATH, 'utf8'));
  }

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  _driveClient = google.drive({ version: 'v3', auth });
  return _driveClient;
}

// Busca o crea una carpeta en Drive
async function getOrCreateFolder(drive, name, parentId = null) {
  const q = [
    `name = '${name}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    parentId ? `'${parentId}' in parents` : `'root' in parents`
  ].join(' and ');

  const list = await drive.files.list({ q, fields: 'files(id,name)', pageSize: 1 });
  if (list.data.files.length > 0) return list.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {})
    },
    fields: 'id'
  });
  return folder.data.id;
}

// Sube un archivo de boleta a la carpeta correcta
async function uploadBoletaToDrive(buffer, mimeType, filename, proyectoNombre) {
  try {
    const drive = await getDriveClient();
    const { Readable } = await import('stream');

    const rootId = DRIVE_ROOT_FOLDER_ID;
    let folderId;
    if (!proyectoNombre || proyectoNombre === 'Gasto general') {
      folderId = await getOrCreateFolder(drive, 'Gastos Generales', rootId);
    } else if (proyectoNombre === 'Personal') {
      folderId = await getOrCreateFolder(drive, 'Personal', rootId);
    } else {
      const proyectosId = await getOrCreateFolder(drive, 'Proyectos', rootId);
      folderId = await getOrCreateFolder(drive, proyectoNombre, proyectosId);
    }

    const stream = Readable.from(Buffer.from(buffer));
    const file = await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType, body: stream },
      fields: 'id,webViewLink'
    });

    return file.data.webViewLink;
  } catch (err) {
    console.error('Drive upload error:', err.message, err.stack);
    return `ERROR_DRIVE: ${err.message}`;
  }
}

const NOTION_BOLETAS_DB = '3337ab7f-975e-8159-abea-000b02680220';
const NOTION_PROYECTOS_DB = '3337ab7f-975e-8179-9c77-000bca145820';
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_FINANCES_BOT_TOKEN}`;

const FINANCE_SYSTEM_PROMPT = `Eres el CFO y Business Affairs Manager de PVB Estudio Creativo.

PVB Estudio Creativo — productora audiovisual y agencia de marketing en Santiago, Chile.

Manejas dos dimensiones:
- FINANZAS PERSONALES: presupuesto personal de Pancho, ahorro, flujo familiar
- FINANZAS CORPORATIVAS: cómo PVB levanta capital, gasta y asigna recursos para crecer

Tus principios:
- Apruebas todos los estimados antes de que Account los presente al cliente
- La agencia no presenta números sin que tú los hayas revisado
- Diagnósticas el flujo de caja antes de recomendar cualquier gasto

Respondes: ¿cuánto cobrar?, ¿cuál es el margen?, ¿cómo estructuro el contrato?, ¿cuándo facturar?, ¿cómo mejorar el flujo de caja?, ¿conviene este gasto?, análisis de rentabilidad por proyecto.

Estilo: directo, con números concretos. Español chileno. Máximo 4 párrafos.`;

// ─── Historial de conversación ────────────────────────────────────────────────
const histories = {};

// ─── Descargar archivo de Telegram ───────────────────────────────────────────
async function downloadTelegramFile(fileId) {
  const fileRes = await fetch(`${TELEGRAM_API}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  const filePath = fileData.result?.file_path;
  if (!filePath) throw new Error('No se pudo obtener el archivo');

  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_FINANCES_BOT_TOKEN}/${filePath}`;
  const res = await fetch(fileUrl);
  const buffer = await res.arrayBuffer();
  return { buffer, filePath, mimeType: getMimeType(filePath) };
}

function getMimeType(filePath) {
  if (filePath.endsWith('.pdf')) return 'application/pdf';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

// ─── OCR con OpenAI gpt-5.5 Vision ────────────────────────────────────────────
async function extractBoletaData(imageBuffer, mimeType) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const base64 = Buffer.from(imageBuffer).toString('base64');
  const supportedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)
    ? mimeType : 'image/jpeg';

  const response = await client.responses.create({
    model: 'gpt-5.5',
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_image',
            image_url: `data:${supportedMime};base64,${base64}`
          },
          {
            type: 'input_text',
            text: `Analiza este documento financiero chileno (boleta, factura, nota de crédito, ticket, comprobante).

Extrae exactamente estos campos y responde SOLO en JSON válido, sin texto extra:
{
  "tipo": "Boleta|Factura|Nota Credito|Ticket|Otro",
  "descripcion": "descripción del item o servicio comprado",
  "monto_clp": 0,
  "fecha": "YYYY-MM-DD o null si no se ve",
  "rut_emisor": "XX.XXX.XXX-X o null",
  "razon_social": "nombre del comercio/empresa o null",
  "categoria_sugerida": "Produccion|Catering|Movilizacion|Arte|Equipos|Software|Oficina|Marketing|Profesional|Otro",
  "confianza": "alta|media|baja",
  "notas": "cualquier observación relevante o null"
}

Si el monto incluye IVA, incluye el total con IVA. Si es ticket de supermercado, suma todos los items. Si no puedes leer algo, usa null.`
          }
        ]
      }
    ]
  });

  const text = response.output_text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No pude interpretar el documento');
  return JSON.parse(jsonMatch[0]);
}

// ─── Obtener proyectos activos de Notion ──────────────────────────────────────
async function getProyectosActivos() {
  const NOTION_KEY = process.env.NOTION_API_KEY;
  const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_PROYECTOS_DB}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filter: {
        or: [
          { property: 'Estado', select: { equals: 'En curso' } },
          { property: 'Estado', select: { equals: 'Brief' } },
          { property: 'Estado', select: { equals: 'Producción' } }
        ]
      },
      page_size: 15
    })
  });
  const data = await res.json();
  return (data.results || []).map(p => ({
    id: p.id,
    nombre: p.properties.Nombre?.title?.[0]?.plain_text || p.properties.Name?.title?.[0]?.plain_text || 'Sin nombre'
  }));
}

// ─── Guardar boleta en Notion ─────────────────────────────────────────────────
async function saveBoletaToNotion(data, proyectoId = null) {
  const NOTION_KEY = process.env.NOTION_API_KEY;

  const props = {
    Descripcion: { title: [{ text: { content: data.descripcion || 'Sin descripción' } }] },
    'Tipo Documento': { select: { name: data.tipo || 'Otro' } },
    Categoria: { select: { name: data.categoria_sugerida || 'Otro' } },
    Estado: { select: { name: 'Pendiente' } }
  };

  if (data.monto_clp) props['Monto CLP'] = { number: data.monto_clp };
  if (data.fecha) props['Fecha'] = { date: { start: data.fecha } };
  if (data.rut_emisor) props['RUT Emisor'] = { rich_text: [{ text: { content: data.rut_emisor } }] };
  if (data.razon_social) props['Razon Social'] = { rich_text: [{ text: { content: data.razon_social } }] };
  if (proyectoId) props['Proyecto'] = { relation: [{ id: proyectoId }] };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ parent: { database_id: NOTION_BOLETAS_DB }, properties: props })
  });

  const result = await res.json();
  return result.url;
}

// ─── Estado pendiente por chat ────────────────────────────────────────────────
// Persistido en Supabase tabla ocr_pending (stateless entre requests Vercel)

// ─── Procesar mensaje de texto ────────────────────────────────────────────────
async function processTextMessage(chatId, text) {
  // Si hay una boleta pendiente de asignar proyecto
  const pending = await getPending(chatId);
  if (pending) {
    const { boleta_data: boletaData, proyectos, filename, mime_type: mimeType, file_id: fileId } = pending;

    const num = parseInt(text);
    let proyectoId = null;
    let proyectoNombre = 'Sin proyecto';

    if (!isNaN(num) && num >= 1 && num <= proyectos.length) {
      proyectoId = proyectos[num - 1].id;
      proyectoNombre = proyectos[num - 1].nombre;
    } else if (text.toLowerCase().includes('general') || text === '0') {
      proyectoId = null;
      proyectoNombre = 'Gasto general';
    } else {
      return '❓ Escribe el número del proyecto o "0" para gasto general.';
    }

    // Re-descargar el archivo desde Telegram para subir a Drive
    let driveLink = null;
    if (fileId) {
      try {
        const { buffer, mimeType: mt } = await downloadTelegramFile(fileId);
        driveLink = await uploadBoletaToDrive(buffer, mt || mimeType, filename, proyectoNombre);
      } catch (e) {
        console.error('Re-download error:', e.message);
      }
    }

    const [notionUrl] = await Promise.all([
      saveBoletaToNotion(boletaData, proyectoId),
      deletePending(chatId)
    ]);

    const montoFormato = boletaData.monto_clp
      ? `$${boletaData.monto_clp.toLocaleString('es-CL')}`
      : 'monto no detectado';

    let msg = `✅ *Boleta guardada*\n\n📋 ${boletaData.descripcion}\n💰 ${montoFormato}\n📁 Proyecto: ${proyectoNombre}\n🏷️ ${boletaData.categoria_sugerida}`;
    if (notionUrl) msg += `\n\n[Ver en Notion](${notionUrl})`;
    if (driveLink && !driveLink.startsWith('ERROR_DRIVE')) {
      msg += `\n[Ver en Drive](${driveLink})`;
    } else if (driveLink?.startsWith('ERROR_DRIVE')) {
      msg += `\n⚠️ Drive: ${driveLink}`;
    }

    return msg;
  }

  // Consulta financiera normal
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  if (!histories[chatId]) histories[chatId] = [];
  histories[chatId].push({ role: 'user', content: text });
  if (histories[chatId].length > 20) histories[chatId] = histories[chatId].slice(-20);

  const response = await client.responses.create({
    model: 'gpt-5.5',
    instructions: FINANCE_SYSTEM_PROMPT,
    input: histories[chatId]
  });

  const reply = response.output_text;
  histories[chatId].push({ role: 'assistant', content: reply });
  return reply;
}

// ─── Procesar imagen/documento ────────────────────────────────────────────────
async function processDocument(chatId, fileId, isPhoto = false) {
  await sendMessage(chatId, '🔍 _Leyendo el documento..._');

  const { buffer, mimeType, filePath } = await downloadTelegramFile(fileId);
  const boletaData = await extractBoletaData(buffer, mimeType);

  const confianzaEmoji = { alta: '🟢', media: '🟡', baja: '🔴' }[boletaData.confianza] || '🟡';
  const montoFormato = boletaData.monto_clp
    ? `$${boletaData.monto_clp.toLocaleString('es-CL')}`
    : 'No detectado';

  let preview = `${confianzaEmoji} *Documento detectado:*\n\n`;
  preview += `📄 Tipo: ${boletaData.tipo}\n`;
  preview += `🏷️ ${boletaData.descripcion}\n`;
  preview += `💰 ${montoFormato}\n`;
  preview += `📅 ${boletaData.fecha || 'Fecha no detectada'}\n`;
  preview += `🏢 ${boletaData.razon_social || 'Comercio no detectado'}\n`;
  preview += `📁 Categoría sugerida: ${boletaData.categoria_sugerida}\n`;
  if (boletaData.notas) preview += `📝 ${boletaData.notas}\n`;

  // Obtener proyectos activos
  const proyectos = await getProyectosActivos();

  let proyectosMsg = '\n*¿A qué proyecto asignar?*\n\n';
  proyectosMsg += '`0` — Gasto general\n';
  proyectos.forEach((p, i) => {
    proyectosMsg += `\`${i + 1}\` — ${p.nombre}\n`;
  });

  // Generar nombre de archivo para Drive
  const fecha = boletaData.fecha || new Date().toISOString().split('T')[0];
  const ext = filePath?.split('.').pop() || (mimeType === 'application/pdf' ? 'pdf' : 'jpg');
  const filename = `${fecha}_${(boletaData.razon_social || 'boleta').replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;

  // Guardar estado en Supabase (persistente entre requests)
  await setPending(chatId, {
    boleta_data: boletaData,
    proyectos,
    filename,
    mime_type: mimeType,
    file_id: fileId
  });

  await sendMessage(chatId, preview, true);
  await sendMessage(chatId, proyectosMsg, true);
}

// ─── Enviar mensaje ───────────────────────────────────────────────────────────
async function sendMessage(chatId, text, markdown = false) {
  const body = { chat_id: chatId, text };
  if (markdown) body.parse_mode = 'Markdown';

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.ok && markdown) {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  }
}

// ─── Handler exportado (se importa en telegram-bot.js) ───────────────────────
export async function handleFinancesMessage(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const update = req.body || {};
  const message = update.message;
  if (!message) return res.status(200).json({ ok: true });

  const chatId = message.chat?.id;
  if (!chatId) return res.status(200).json({ ok: true });

  try {
    // /start
    if (message.text?.trim() === '/start') {
      await sendMessage(chatId, '💰 Hola Pancho. Soy tu CFO personal.\n\nMándame una foto de una boleta o factura y la registro en Notion automáticamente.\n\nTambién puedo responder consultas de finanzas personales y corporativas de PVB.', false);
      return res.status(200).json({ ok: true });
    }

    // Foto
    if (message.photo) {
      const fileId = message.photo[message.photo.length - 1].file_id;
      await processDocument(chatId, fileId, true);
      return res.status(200).json({ ok: true });
    }

    // Documento (PDF, imagen como archivo)
    if (message.document) {
      const mime = message.document.mime_type || '';
      if (mime.startsWith('image/') || mime === 'application/pdf') {
        await processDocument(chatId, message.document.file_id, false);
      } else {
        await sendMessage(chatId, '⚠️ Solo acepto imágenes (JPG, PNG) o PDFs de boletas/facturas.');
      }
      return res.status(200).json({ ok: true });
    }

    // Texto
    if (message.text) {
      await sendMessage(chatId, '⏳ _Un momento..._', true);
      const reply = await processTextMessage(chatId, message.text.trim());
      await sendMessage(chatId, reply, true);
    }

  } catch (err) {
    console.error('Finances bot error:', err.message);
    await sendMessage(chatId, `❌ Error: ${err.message}`);
  }

  return res.status(200).json({ ok: true });
}
