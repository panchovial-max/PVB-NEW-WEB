// boleta-upload.js — OCR + Google Drive + Notion desde studio.html
// Recibe imagen en base64, analiza con Claude Vision, sube a Drive y guarda en Notion

import Anthropic from '@anthropic-ai/sdk';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';
import { createHmac } from 'crypto';

// ─── Auth PVB ─────────────────────────────────────────────────────────────────

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (payload.expires < Date.now()) return false;
    const secret = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const expected = createHmac('sha256', secret).update(`brain:${payload.expires}`).digest('hex');
    return payload.sig === expected;
  } catch {
    return false;
  }
}

// ─── Google Drive ─────────────────────────────────────────────────────────────

const DRIVE_ROOT_FOLDER_ID = '1n8CSParCJDBwQCZZi5ptw36QbaaatJLS';

async function getDriveClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  return google.drive({ version: 'v3', auth });
}

async function getOrCreateFolder(drive, name, parentId) {
  const q = [
    `name = '${name}'`,
    `mimeType = 'application/vnd.google-apps.folder'`,
    `trashed = false`,
    `'${parentId}' in parents`
  ].join(' and ');

  const list = await drive.files.list({ q, fields: 'files(id)', pageSize: 1 });
  if (list.data.files.length > 0) return list.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id'
  });
  return folder.data.id;
}

async function uploadToDrive(base64Data, mimeType, filename, proyectoNombre) {
  try {
    const drive = await getDriveClient();
    const { Readable } = await import('stream');

    // Determinar carpeta destino
    let folderId;
    if (!proyectoNombre || proyectoNombre === 'Sin proyecto') {
      folderId = await getOrCreateFolder(drive, 'Gastos Generales', DRIVE_ROOT_FOLDER_ID);
    } else {
      const proyectosId = await getOrCreateFolder(drive, 'Proyectos', DRIVE_ROOT_FOLDER_ID);
      folderId = await getOrCreateFolder(drive, proyectoNombre, proyectosId);
    }

    // Convertir base64 a buffer
    const rawBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(rawBase64, 'base64');
    const stream = Readable.from(buffer);

    const file = await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType, body: stream },
      fields: 'id,webViewLink'
    });

    return file.data.webViewLink;
  } catch (err) {
    console.error('Drive upload error:', err.message);
    return null;
  }
}

// ─── OCR con Claude Vision ────────────────────────────────────────────────────

async function extractBoletaData(base64Data, mimeType) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Limpiar el data URI prefix si viene
  const rawBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
  // Normalizar mimeType para Claude (solo acepta image/jpeg, image/png, image/gif, image/webp, application/pdf)
  const supportedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)
    ? mimeType
    : 'image/jpeg';

  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: supportedMime, data: rawBase64 }
        },
        {
          type: 'text',
          text: `Analiza este documento financiero chileno (boleta, factura, nota de crédito, ticket, comprobante).

Extrae exactamente estos campos y responde SOLO en JSON válido, sin texto extra:
{
  "tipo_documento": "Boleta|Factura|Nota Credito|Ticket|Otro",
  "descripcion": "descripción del item o servicio",
  "monto_total": 0,
  "fecha": "YYYY-MM-DD o null",
  "rut_emisor": "XX.XXX.XXX-X o null",
  "razon_social": "nombre del comercio o null",
  "categoria_sugerida": "Produccion|Catering|Movilizacion|Arte|Equipos|Software|Oficina|Marketing|Profesional|Otro",
  "confianza": "alta|media|baja"
}

Si el monto incluye IVA, incluye el total con IVA. Si es ticket, suma todos los items. Si no puedes leer algo, usa null.`
        }
      ]
    }]
  });

  const text = res.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No pude interpretar el documento');
  return JSON.parse(jsonMatch[0]);
}

// ─── Guardar en Notion ────────────────────────────────────────────────────────

const NOTION_BOLETAS_DB = '3337ab7f-975e-81e2-a15d-fb2e6071f1bf';

async function saveToNotion(analysis, descripcion, monto, categoria, tipo, proyectoId, driveLink) {
  const NOTION_KEY = process.env.NOTION_API_KEY;

  const props = {
    'Descripcion': { title: [{ text: { content: analysis?.descripcion || descripcion || 'Sin descripcion' } }] },
    'Monto CLP': { number: analysis?.monto_total || monto || 0 },
    'Tipo Documento': { select: { name: analysis?.tipo_documento || tipo || 'Boleta' } },
    'Categoria': { select: { name: analysis?.categoria_sugerida || categoria || 'Otro' } },
    'Estado': { select: { name: 'Pendiente' } },
    'Fecha': { date: { start: analysis?.fecha || new Date().toISOString().split('T')[0] } }
  };

  if (analysis?.rut_emisor) props['RUT Emisor'] = { rich_text: [{ text: { content: analysis.rut_emisor } }] };
  if (analysis?.razon_social) props['Razon Social'] = { rich_text: [{ text: { content: analysis.razon_social } }] };
  if (proyectoId) props['Proyecto'] = { relation: [{ id: proyectoId }] };
  if (driveLink) props['Archivo Drive'] = { url: driveLink };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ parent: { database_id: NOTION_BOLETAS_DB }, properties: props })
  });

  return res.json();
}

// ─── Handler principal ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verificar token
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token || !verifyToken(token)) return res.status(401).json({ error: 'No autorizado' });

  const { imagen, filename, descripcion, monto, categoria, tipo_documento, proyecto_id } = req.body || {};

  if (!imagen) return res.status(400).json({ error: 'Falta imagen' });

  try {
    // Detectar mimeType desde el data URI
    const mimeMatch = imagen.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // 1. OCR con Claude Vision
    let analysis = null;
    try {
      analysis = await extractBoletaData(imagen, mimeType);
    } catch (ocrErr) {
      console.error('OCR error (continuando sin analysis):', ocrErr.message);
    }

    // 2. Subir a Drive
    const fecha = analysis?.fecha || new Date().toISOString().split('T')[0];
    const nombreArchivo = filename || `${fecha}_boleta.jpg`;
    let driveLink = null;
    try {
      driveLink = await uploadToDrive(imagen, mimeType, nombreArchivo, null);
    } catch (driveErr) {
      console.error('Drive error (continuando sin Drive):', driveErr.message);
    }

    // 3. Guardar en Notion
    const notionResult = await saveToNotion(
      analysis, descripcion, monto, categoria, tipo_documento, proyecto_id, driveLink
    );

    if (!notionResult.id) {
      return res.status(500).json({ ok: false, error: notionResult.message || 'Error guardando en Notion' });
    }

    return res.status(200).json({
      ok: true,
      notion_id: notionResult.id,
      drive_link: driveLink,
      analysis
    });

  } catch (err) {
    console.error('boleta-upload error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
