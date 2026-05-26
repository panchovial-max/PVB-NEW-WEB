// Master Brain — Agent Run API
// Ejecuta agentes creativos: genera imagen via OpenAI DALL-E 3 o Adobe Firefly + sube a Google Drive
// POST /api/agent-run { agentId, prompt, action, projectName }

import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase env vars are required');
  return createClient(url, key);
}

// Extrae el folder ID de un link de Google Drive
// Soporta: /folders/ID, /drive/folders/ID, ?id=ID
function extractDriveFolderId(url) {
  if (!url) return null;
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// Busca el Drive Folder de un proyecto en Notion por nombre
async function getDriveFolderFromNotion(projectName) {
  const notionToken = process.env.NOTION_TOKEN;
  const dbId = '3337ab7f-975e-8179-9c77-000bca145820';
  if (!notionToken) return null;

  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: {
        property: 'Nombre',
        title: { contains: projectName },
      },
      page_size: 1,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const page = data.results?.[0];
  if (!page) return null;

  const driveUrl = page.properties?.['Drive Folder']?.url;
  return driveUrl ? { url: driveUrl, folderId: extractDriveFolderId(driveUrl) } : null;
}

function verifyBrainToken(token, secret) {
  try {
    const { scope, expires, sig } = JSON.parse(Buffer.from(token, 'base64').toString());
    if (scope !== 'brain') return false;
    if (Date.now() > expires) return false;
    const expected = createHmac('sha256', secret).update(`brain:${expires}`).digest('hex');
    return sig === expected;
  } catch {
    return false;
  }
}

async function generateImageFirefly(prompt, adobeToken) {
  const res = await fetch('https://firefly-api.adobe.io/v3/images/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adobeToken}`,
      'X-Api-Key': process.env.ADOBE_CLIENT_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      numVariations: 1,
      size: { width: 1024, height: 1024 },
      outputFormat: 'jpeg',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firefly error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const imageUrl = data.outputs?.[0]?.image?.url;
  if (!imageUrl) throw new Error('Firefly no retornó imagen');
  return imageUrl;
}

async function generateImageOpenAI(prompt) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'standard',
    n: 1,
    response_format: 'url',
  });

  const imageUrl = response.data?.[0]?.url;
  if (!imageUrl) throw new Error('OpenAI no retornó una URL de imagen');
  return imageUrl;
}

async function getFireflyToken() {
  const res = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ADOBE_CLIENT_ID,
      client_secret: process.env.ADOBE_CLIENT_SECRET,
      scope: 'openid,AdobeID,firefly_api',
    }),
  });

  if (!res.ok) throw new Error(`Adobe auth error ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function downloadImageSource(imageSource) {
  const imgRes = await fetch(imageSource);
  if (!imgRes.ok) throw new Error('No se pudo descargar la imagen de Firefly');
  return { imageBuffer: await imgRes.arrayBuffer(), contentType: imgRes.headers.get('content-type') || 'image/jpeg' };
}

async function uploadToDrive(imageSource, filename, driveToken, folderId = null) {
  const { imageBuffer, contentType } = await downloadImageSource(imageSource);

  // Crear metadata del archivo
  const metadata = {
    name: filename,
    mimeType: contentType.includes('png') ? 'image/png' : 'image/jpeg',
    parents: [folderId || 'root'],
  };

  // Multipart upload a Drive
  const boundary = '-------pvb_boundary';
  const metaPart = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const dataPart = `--${boundary}\r\nContent-Type: ${metadata.mimeType}\r\n\r\n`;
  const endPart = `\r\n--${boundary}--`;

  const encoder = new TextEncoder();
  const body = new Uint8Array([
    ...encoder.encode(metaPart),
    ...encoder.encode(dataPart),
    ...new Uint8Array(imageBuffer),
    ...encoder.encode(endPart),
  ]);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${driveToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Drive upload error ${uploadRes.status}: ${err}`);
  }

  const file = await uploadRes.json();

  // Hacer el archivo público
  await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${driveToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });

  return { fileId: file.id, name: file.name, link: file.webViewLink };
}

async function notifyTelegram(message) {
  const bot = process.env.TELEGRAM_TASKS_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID;
  if (!bot || !chat) return { ok: false, skipped: true, reason: 'Telegram not configured' };

  const res = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    }),
  });
  const data = await res.json();
  return { ok: res.ok && data.ok, telegram: data };
}

async function createQueuedRun(payload) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('agent_runs')
    .insert({
      action: payload.action,
      agent_id: payload.agentId || null,
      tool_id: payload.toolId || null,
      script_id: payload.scriptId || null,
      prompt: payload.prompt || null,
      project_name: payload.projectName || null,
      params: payload.params || {},
      status: 'queued',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function listRuns(limit = 20) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(Number(limit) || 20, 100));
  if (error) throw error;
  return data || [];
}

async function getRun(runId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('agent_runs')
    .select('*')
    .eq('id', runId)
    .single();
  if (error) throw error;
  return data;
}

async function cancelRun(runId) {
  const supabase = getSupabase();
  const existing = await getRun(runId);
  if (!['queued', 'running'].includes(existing.status)) return existing;

  const { data, error } = await supabase
    .from('agent_runs')
    .update({
      status: 'cancelled',
      cancel_requested_at: new Date().toISOString(),
      finished_at: existing.status === 'queued' ? new Date().toISOString() : existing.finished_at,
      logs: `${existing.logs || ''}\nCancel requested from Agent OS`.trim(),
    })
    .eq('id', runId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function getGoogleDriveToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    }),
  });

  if (!res.ok) throw new Error(`Google auth error ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.BASE_URL || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!verifyBrainToken(token, secret)) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { agentId, prompt, action = 'generate-image', projectName, notify = true } = req.body;

  try {
    if (action === 'status') {
      return res.status(200).json({
        ok: true,
        connections: {
          openai: Boolean(process.env.OPENAI_API_KEY),
          adobeFirefly: Boolean(process.env.ADOBE_CLIENT_ID && process.env.ADOBE_CLIENT_SECRET),
          googleDrive: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN),
          telegram: Boolean((process.env.TELEGRAM_TASKS_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN) && (process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_OWNER_CHAT_ID)),
          notionDriveLookup: Boolean(process.env.NOTION_TOKEN),
        },
      });
    }

    if (action === 'queue-image') {
      if (!prompt) return res.status(400).json({ error: 'Se requiere un prompt' });
      const run = await createQueuedRun({
        action: 'generate-image',
        agentId,
        prompt,
        projectName,
        params: { notify },
      });
      return res.status(200).json({ ok: true, run });
    }

    if (action === 'queue-script') {
      const { scriptId, toolId, params = {} } = req.body;
      if (!scriptId) return res.status(400).json({ error: 'scriptId required' });
      const run = await createQueuedRun({
        action: 'run-script',
        agentId,
        toolId,
        scriptId,
        params,
      });
      return res.status(200).json({ ok: true, run });
    }

    if (action === 'list-runs') {
      const runs = await listRuns(req.body?.limit || 20);
      return res.status(200).json({ ok: true, runs });
    }

    if (action === 'get-run') {
      const { runId } = req.body || {};
      if (!runId) return res.status(400).json({ error: 'runId required' });
      return res.status(200).json({ ok: true, run: await getRun(runId) });
    }

    if (action === 'cancel-run') {
      const { runId } = req.body || {};
      if (!runId) return res.status(400).json({ error: 'runId required' });
      return res.status(200).json({ ok: true, run: await cancelRun(runId) });
    }

    if (action === 'generate-image') {
      if (!prompt) return res.status(400).json({ error: 'Se requiere un prompt' });
      if (!process.env.GOOGLE_REFRESH_TOKEN) {
        return res.status(503).json({ error: 'Google Drive no configurado. Agrega GOOGLE_REFRESH_TOKEN en Vercel.' });
      }

      // 1. Obtener folder Drive desde Notion si se indicó proyecto
      let driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
      let driveFolderUrl = null;
      if (projectName) {
        const notion = await getDriveFolderFromNotion(projectName);
        if (notion?.folderId) {
          driveFolderId = notion.folderId;
          driveFolderUrl = notion.url;
        }
      }

      // 2. Obtener tokens en paralelo
      const driveToken = await getGoogleDriveToken();

      // 3. Generar imagen con OpenAI primero; Firefly queda como fallback
      let imageUrl = null;
      let imageProvider = 'openai';
      if (process.env.OPENAI_API_KEY) {
        imageUrl = await generateImageOpenAI(prompt);
      } else if (process.env.ADOBE_CLIENT_ID && process.env.ADOBE_CLIENT_SECRET) {
        const adobeToken = await getFireflyToken();
        imageUrl = await generateImageFirefly(prompt, adobeToken);
        imageProvider = 'firefly';
      } else {
        return res.status(503).json({ error: 'No hay proveedor de imagen configurado. Agrega OPENAI_API_KEY o ADOBE_CLIENT_ID/ADOBE_CLIENT_SECRET.' });
      }

      // 4. Subir a Drive (en la carpeta del proyecto si se encontró)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `pvb-${agentId || 'creative'}-${timestamp}.jpg`;
      const driveFile = await uploadToDrive(imageUrl, filename, driveToken, driveFolderId);
      const telegram = notify ? await notifyTelegram(
        `🎨 *Agent OS: imagen generada*\n\n*Agente:* ${agentId || 'creative'}\n*Proyecto:* ${projectName || 'sin proyecto'}\n*Prompt:* ${prompt.slice(0, 500)}\n\nDrive: ${driveFile.link}`
      ) : { ok: false, skipped: true };

      return res.status(200).json({
        ok: true,
        action: 'generate-image',
        agentId,
        prompt,
        project: projectName || null,
        result: {
          driveLink: driveFile.link,
          fileId: driveFile.fileId,
          filename: driveFile.name,
          previewUrl: imageUrl,
          projectFolderUrl: driveFolderUrl,
          provider: imageProvider,
          telegram,
        },
      });
    }

    return res.status(400).json({ error: `Acción desconocida: ${action}` });

  } catch (err) {
    console.error('[agent-run]', err);
    return res.status(500).json({ error: err.message });
  }
}
