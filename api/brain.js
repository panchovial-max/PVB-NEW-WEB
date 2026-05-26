// brain.js — Master Brain auth + clients + hub + chat
// POST /api/brain             → login (PIN)
// GET  /api/brain?action=...  → list, stats, hub (token requerido)
// POST /api/brain?action=...  → telegram, chat (token requerido)
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

function createBrainToken(secret) {
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const payload = `brain:${expires}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ scope: 'brain', expires, sig })).toString('base64');
}

function verifyBrainToken(token, secret) {
  if (!secret) return false;
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (decoded.scope !== 'brain') return false;
    if (decoded.expires < Date.now()) return false;
    const expectedSig = createHmac('sha256', secret).update(`brain:${decoded.expires}`).digest('hex');
    return decoded.sig === expectedSig;
  } catch { return false; }
}

async function fetchInstagramStats(accessToken, igAccountId) {
  const profileRes = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}?fields=followers_count,media_count,name,username,profile_picture_url&access_token=${accessToken}`);
  const profile = await profileRes.json();
  if (profile.error) throw new Error(profile.error.message);
  const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const until = Math.floor(Date.now() / 1000);
  const insightsRes = await fetch(`https://graph.facebook.com/v20.0/${igAccountId}/insights?metric=impressions,reach,profile_views&period=day&since=${since}&until=${until}&access_token=${accessToken}`);
  const insights = await insightsRes.json();
  let impressions = 0, reach = 0, profileViews = 0;
  if (insights.data) {
    for (const m of insights.data) {
      const total = m.values.reduce((s, v) => s + (v.value || 0), 0);
      if (m.name === 'impressions') impressions = total;
      if (m.name === 'reach') reach = total;
      if (m.name === 'profile_views') profileViews = total;
    }
  }
  return { followers: profile.followers_count || 0, media_count: profile.media_count || 0, username: profile.username || '', impressions, reach, profile_views: profileViews, engagement_rate: profile.followers_count > 0 ? ((reach / profile.followers_count) * 100).toFixed(2) : 0 };
}

async function fetchTikTokStats(accessToken) {
  const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,display_name,username,avatar_url', { headers: { 'Authorization': `Bearer ${accessToken}` } });
  const data = await res.json();
  const user = data.data?.user || {};
  return { followers: user.follower_count || 0, following: user.following_count || 0, likes: user.likes_count || 0, video_count: user.video_count || 0, username: user.username || user.display_name || '' };
}

async function fetchYouTubeStats(accessToken, channelId) {
  const idParam = channelId ? `&id=${channelId}` : '&mine=true';
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics${idParam}&access_token=${accessToken}`);
  const data = await res.json();
  const channel = data.items?.[0];
  if (!channel) throw new Error('No YouTube channel found');
  return { subscribers: parseInt(channel.statistics?.subscriberCount || 0), views: parseInt(channel.statistics?.viewCount || 0), video_count: parseInt(channel.statistics?.videoCount || 0), title: channel.snippet?.title || '' };
}

async function fetchFacebookStats(accessToken, pageId) {
  const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const until = Math.floor(Date.now() / 1000);
  const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/insights?metric=page_impressions,page_engaged_users,page_reach&period=day&since=${since}&until=${until}&access_token=${accessToken}`);
  const insights = await res.json();
  let impressions = 0, engagedUsers = 0, reach = 0;
  if (insights.data) {
    for (const m of insights.data) {
      const total = m.values.reduce((s, v) => s + (v.value || 0), 0);
      if (m.name === 'page_impressions') impressions = total;
      if (m.name === 'page_engaged_users') engagedUsers = total;
      if (m.name === 'page_reach') reach = total;
    }
  }
  return { impressions, engaged_users: engagedUsers, reach };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase env vars missing');
  return createClient(url, key);
}

export default async function handler(req, res) {
  const origin = process.env.BASE_URL || '*';
  const secret = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { action = '' } = req.query;

  // ── POST without action → login ───────────────────────────
  if (req.method === 'POST' && !action) {
    try {
      const { pin } = req.body;
      const expectedPin = (process.env.STUDIO_PIN || '1404').trim();
      if (String(pin).trim() !== expectedPin) return res.status(401).json({ error: 'PIN incorrecto' });
      const token = createBrainToken(secret);
      return res.status(200).json({ ok: true, token });
    } catch {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ── GET/POST with action → data actions (requires token) ──
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !verifyBrainToken(token, secret)) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(process.env.SUPABASE_URL, secret);
  const { user_id, platform } = req.query;
  const resolvedAction = action || 'list';

  try {
    if (resolvedAction === 'list') {
      const { data: profiles, error } = await supabase.from('user_profiles').select('id, full_name, email, company, created_at').order('created_at', { ascending: false });
      if (error) throw error;
      const { data: accounts } = await supabase.from('social_accounts').select('user_id, platform, account_name, metadata, last_sync_at, is_active').eq('is_active', true);
      const accountsByUser = {};
      for (const acc of accounts || []) {
        if (!accountsByUser[acc.user_id]) accountsByUser[acc.user_id] = [];
        accountsByUser[acc.user_id].push(acc);
      }
      const clients = (profiles || []).map(p => ({
        id: p.id, name: p.full_name || p.email || 'Cliente sin nombre', email: p.email, company: p.company, joined: p.created_at,
        platforms: (accountsByUser[p.id] || []).map(a => ({ platform: a.platform, account_name: a.account_name, username: a.metadata?.username || '', profile_picture: a.metadata?.profile_picture || '', last_sync: a.last_sync_at }))
      }));
      return res.status(200).json({ ok: true, clients });
    }

    if (resolvedAction === 'stats') {
      if (!user_id || !platform) return res.status(400).json({ error: 'user_id and platform required' });
      const { data: account, error } = await supabase.from('social_accounts').select('*').eq('user_id', user_id).eq('platform', platform).eq('is_active', true).single();
      if (error || !account) return res.status(404).json({ error: `No ${platform} account` });
      let stats = {};
      if (platform === 'instagram') stats = await fetchInstagramStats(account.access_token, account.account_id);
      else if (platform === 'facebook') stats = await fetchFacebookStats(account.access_token, account.account_id);
      else if (platform === 'tiktok') stats = await fetchTikTokStats(account.access_token);
      else if (platform === 'youtube') stats = await fetchYouTubeStats(account.access_token, account.account_id);
      else return res.status(400).json({ error: 'Unsupported platform' });
      return res.status(200).json({ ok: true, platform, stats });
    }

    // ── Hub: Notion tasks + projects + finances ───────────────
    if (resolvedAction === 'hub') {
      const NOTION_KEY = process.env.NOTION_API_KEY;
      const NOTION_VER = '2022-06-28';
      const nHeaders = {
        Authorization: `Bearer ${NOTION_KEY}`,
        'Notion-Version': NOTION_VER,
        'Content-Type': 'application/json',
      };
      const queryNotion = async (dbId, body) => {
        const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
          method: 'POST', headers: nHeaders, body: JSON.stringify(body),
        });
        return r.json();
      };
      const getText  = (p, name) => p?.properties?.[name]?.title?.[0]?.plain_text ?? p?.properties?.[name]?.rich_text?.[0]?.plain_text ?? null;
      const getSelect = (p, name) => p?.properties?.[name]?.select?.name ?? null;
      const getDate  = (p, name) => p?.properties?.[name]?.date?.start ?? null;
      const getNum   = (p, name) => p?.properties?.[name]?.number ?? null;

      const [tareasRes, proyectosRes, boletasRes] = await Promise.all([
        queryNotion('ddaabf23-19cd-4ca0-9765-f63976aa6c16', {
          filter: { property: 'Estado', select: { does_not_equal: 'Completada' } },
          sorts: [{ property: 'Fecha', direction: 'ascending' }],
          page_size: 15,
        }),
        queryNotion('3337ab7f-975e-81b4-8045-d33fe1515aca', {
          filter: { property: 'Estado', select: { does_not_equal: 'Completado' } },
          sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
          page_size: 10,
        }),
        queryNotion('3337ab7f-975e-81e2-a15d-fb2e6071f1bf', {
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
          page_size: 8,
        }),
      ]);

      const tareas = (tareasRes.results || []).map(p => ({
        id: p.id,
        tarea: getText(p, 'Tarea') || getText(p, 'Name') || '—',
        contexto: getSelect(p, 'Contexto'),
        prioridad: getSelect(p, 'Prioridad'),
        estado: getSelect(p, 'Estado'),
        fecha: getDate(p, 'Fecha'),
        url: p.url,
      }));

      const proyectos = (proyectosRes.results || []).map(p => ({
        id: p.id,
        nombre: getText(p, 'Nombre') || getText(p, 'Name') || getText(p, 'Proyecto') || '—',
        estado: getSelect(p, 'Estado'),
        cliente: getSelect(p, 'Cliente') || getText(p, 'Cliente'),
        fecha: getDate(p, 'Fecha inicio') || getDate(p, 'Fecha'),
        url: p.url,
      }));

      const boletas = (boletasRes.results || []).map(p => ({
        id: p.id,
        nombre: getText(p, 'Descripcion') || getText(p, 'Nombre') || getText(p, 'Name') || '—',
        monto: getNum(p, 'Monto') || getNum(p, 'Total') || getNum(p, 'Monto CLP'),
        tipo: getSelect(p, 'Tipo'),
        fecha: getDate(p, 'Fecha') || p.created_time?.slice(0, 10),
        url: p.url,
      }));

      return res.status(200).json({ ok: true, tareas, proyectos, boletas });
    }

    // ── Telegram: enviar mensaje directo desde Master Brain ──
    if (resolvedAction === 'telegram') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { message, chat_id } = req.body || {};
      if (!message) return res.status(400).json({ error: 'message required' });
      const BOT = process.env.TELEGRAM_TASKS_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
      const CHAT = chat_id || process.env.TELEGRAM_CHAT_ID;
      if (!BOT || !CHAT) return res.status(500).json({ error: 'Telegram not configured' });
      const r = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT, text: `🧠 *Master Brain*\n\n${message}`, parse_mode: 'Markdown' }),
      });
      const data = await r.json();
      return res.status(data.ok ? 200 : 500).json({ ok: data.ok, telegram: data });
    }

    // ── Esperanza — leads del agente de ventas ───────────────
    if (action === 'esperanza') {
      const sb = getSupabase();

      if (req.method === 'GET') {
        const statusFilter = req.query.status;
        let query = sb.from('esperanza_leads')
          .select('id,chat_id,username,name,service,interest,step,decision,status,notion_page_id,notes,conversation,created_at,updated_at')
          .order('updated_at', { ascending: false });
        if (statusFilter && statusFilter !== 'all') query = query.eq('status', statusFilter);
        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });

        const stats = { new: 0, warm: 0, hot: 0, converted: 0, lost: 0 };
        (data || []).forEach(l => { if (stats[l.status] !== undefined) stats[l.status]++; });
        return res.json({ ok: true, leads: data || [], stats });
      }

      if (req.method === 'POST') {
        const { id, sub } = req.body || {};
        if (!id) return res.status(400).json({ error: 'id required' });

        if (sub === 'status') {
          const { status } = req.body;
          if (!status) return res.status(400).json({ error: 'status required' });
          const { error } = await sb.from('esperanza_leads').update({ status }).eq('id', id);
          if (error) return res.status(500).json({ error: error.message });
          return res.json({ ok: true });
        }

        if (sub === 'note') {
          const { notes } = req.body;
          const { error } = await sb.from('esperanza_leads').update({ notes }).eq('id', id);
          if (error) return res.status(500).json({ error: error.message });
          return res.json({ ok: true });
        }
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Client Accounts — PVB-owned infrastructure ──────────
    if (resolvedAction === 'accounts') {
      const sb = getSupabase();

      if (req.method === 'GET') {
        const { data, error } = await sb
          .from('client_accounts')
          .select('id,client_name,client_slug,email_alias,status,service_type,monthly_budget_clp,contract_start,contract_end,ig_account_id,fb_access_token,tiktok_access_token,yt_refresh_token,notion_page_id,telegram_chat_id,notes,created_at')
          .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ ok: true, accounts: data || [] });
      }

      if (req.method === 'POST') {
        const sub = req.body?.sub;

        if (sub === 'create') {
          const { client_name, client_slug, email_alias, status, service_type, monthly_budget_clp, contract_start, notes } = req.body;
          if (!client_name || !client_slug) return res.status(400).json({ error: 'client_name and client_slug required' });
          const { data, error } = await sb.from('client_accounts').insert([{
            client_name, client_slug: client_slug.toLowerCase().replace(/\s+/g,'-'),
            email_alias, status: status || 'active', service_type, monthly_budget_clp, contract_start: contract_start || null, notes
          }]).select().single();
          if (error) return res.status(500).json({ error: error.message });
          return res.json({ ok: true, account: data });
        }

        if (sub === 'update') {
          const { id, ...fields } = req.body;
          if (!id) return res.status(400).json({ error: 'id required' });
          const allowed = ['status','email_alias','service_type','monthly_budget_clp','contract_start','contract_end','ig_account_id','notion_page_id','telegram_chat_id','notes'];
          const patch = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
          const { error } = await sb.from('client_accounts').update(patch).eq('id', id);
          if (error) return res.status(500).json({ error: error.message });
          return res.json({ ok: true });
        }

        if (sub === 'offboard') {
          const { id } = req.body;
          if (!id) return res.status(400).json({ error: 'id required' });
          const { error } = await sb.from('client_accounts').update({
            status: 'offboarded',
            ig_access_token: null, fb_access_token: null, tiktok_access_token: null, yt_refresh_token: null
          }).eq('id', id);
          if (error) return res.status(500).json({ error: error.message });
          return res.json({ ok: true });
        }
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Chat: Claude Haiku + Notion tool use ─────────────────
    if (resolvedAction === 'chat') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { message, history = [], proyecto = '' } = req.body || {};
      if (!message) return res.status(400).json({ error: 'message required' });

      const NOTION_KEY = process.env.NOTION_API_KEY;
      const NH = { Authorization: `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
      const DB_TASKS    = 'ddaabf23-19cd-4ca0-9765-f63976aa6c16';
      const DB_PROJECTS = '3337ab7f-975e-81b4-8045-d33fe1515aca';
      const getText = (p, n) => p?.properties?.[n]?.title?.[0]?.plain_text ?? p?.properties?.[n]?.rich_text?.[0]?.plain_text ?? null;

      const TOOLS = [
        {
          name: 'get_tasks',
          description: 'Obtiene tareas de Notion Tareas Personales. Usa para ver pendientes, buscar por contexto o prioridad.',
          input_schema: { type: 'object', properties: {
            contexto: { type: 'string', description: 'Personal | PVB | Salud | Familia | Finanzas | Idea — omitir para todos' },
            prioridad: { type: 'string', description: 'Alta | Media | Baja — omitir para todas' },
          }},
        },
        {
          name: 'get_projects',
          description: 'Obtiene proyectos de Notion Proyectos PVB con su estado actual.',
          input_schema: { type: 'object', properties: {
            estado: { type: 'string', description: 'Filtrar por estado (ej: "En producción"). Omitir para todos.' },
          }},
        },
        {
          name: 'complete_task',
          description: 'Marca una tarea como Completada en Notion.',
          input_schema: { type: 'object', required: ['task_id'], properties: {
            task_id: { type: 'string', description: 'ID de la tarea (viene de get_tasks)' },
          }},
        },
        {
          name: 'create_task',
          description: 'Crea una nueva tarea en Notion Tareas Personales.',
          input_schema: { type: 'object', required: ['tarea'], properties: {
            tarea:    { type: 'string' },
            contexto: { type: 'string', description: 'Personal | PVB | Salud | Familia | Finanzas | Idea' },
            prioridad:{ type: 'string', enum: ['Alta', 'Media', 'Baja'] },
            fecha:    { type: 'string', description: 'YYYY-MM-DD' },
          }},
        },
        {
          name: 'update_project_status',
          description: 'Actualiza el estado de un proyecto en Notion.',
          input_schema: { type: 'object', required: ['project_id', 'estado'], properties: {
            project_id: { type: 'string' },
            estado:     { type: 'string', description: 'Ej: "En producción", "Entregado", "En pausa"' },
          }},
        },
        {
          name: 'drive_save_file',
          description: 'Guarda un archivo o imagen en Google Drive PVB. Úsalo cuando generes o recibas un asset (imagen, PDF, video, diseño) que deba quedar registrado en el proyecto.',
          input_schema: { type: 'object', required: ['url', 'filename', 'mimeType'], properties: {
            url:      { type: 'string', description: 'URL pública del archivo' },
            filename: { type: 'string', description: 'Nombre del archivo con extensión (ej: banner-kaya.png)' },
            mimeType: { type: 'string', description: 'MIME type (ej: image/png, application/pdf, video/mp4)' },
            project:  { type: 'string', description: 'Nombre del proyecto PVB (ej: Kaya, Refugio Chiloé). Omitir para General.' },
          }},
        },
      ];

      async function runTool(name, input) {
        if (name === 'get_tasks') {
          const filters = [];
          if (input.contexto) filters.push({ property: 'Contexto', select: { equals: input.contexto } });
          if (input.prioridad) filters.push({ property: 'Prioridad', select: { equals: input.prioridad } });
          filters.push({ property: 'Estado', select: { does_not_equal: 'Completada' } });
          const body = { page_size: 20, sorts: [{ property: 'Fecha', direction: 'ascending' }], filter: { and: filters } };
          const r = await fetch(`https://api.notion.com/v1/databases/${DB_TASKS}/query`, { method: 'POST', headers: NH, body: JSON.stringify(body) });
          const data = await r.json();
          return (data.results || []).map(p => ({
            id: p.id,
            tarea: p.properties?.Tarea?.title?.[0]?.plain_text || '—',
            contexto: p.properties?.Contexto?.select?.name,
            prioridad: p.properties?.Prioridad?.select?.name,
            estado: p.properties?.Estado?.select?.name,
            fecha: p.properties?.Fecha?.date?.start,
          }));
        }
        if (name === 'get_projects') {
          const body = { page_size: 15, sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }] };
          if (input.estado) body.filter = { property: 'Estado', select: { equals: input.estado } };
          const r = await fetch(`https://api.notion.com/v1/databases/${DB_PROJECTS}/query`, { method: 'POST', headers: NH, body: JSON.stringify(body) });
          const data = await r.json();
          return (data.results || []).map(p => ({
            id: p.id,
            nombre: getText(p, 'Nombre') || getText(p, 'Name') || getText(p, 'Proyecto') || '—',
            estado: p.properties?.Estado?.select?.name,
            cliente: p.properties?.Cliente?.select?.name || getText(p, 'Cliente'),
            fecha: p.properties?.['Fecha inicio']?.date?.start || p.properties?.Fecha?.date?.start,
          }));
        }
        if (name === 'complete_task') {
          const r = await fetch(`https://api.notion.com/v1/pages/${input.task_id}`, {
            method: 'PATCH', headers: NH,
            body: JSON.stringify({ properties: { Estado: { select: { name: 'Completada' } } } }),
          });
          return { ok: r.ok };
        }
        if (name === 'create_task') {
          const props = { Tarea: { title: [{ text: { content: input.tarea } }] }, Estado: { select: { name: 'Pendiente' } } };
          if (input.contexto)  props.Contexto  = { select: { name: input.contexto } };
          if (input.prioridad) props.Prioridad = { select: { name: input.prioridad } };
          if (input.fecha)     props.Fecha     = { date: { start: input.fecha } };
          const r = await fetch('https://api.notion.com/v1/pages', { method: 'POST', headers: NH, body: JSON.stringify({ parent: { database_id: DB_TASKS }, properties: props }) });
          const data = await r.json();
          return { ok: r.ok, id: data.id };
        }
        if (name === 'update_project_status') {
          const r = await fetch(`https://api.notion.com/v1/pages/${input.project_id}`, {
            method: 'PATCH', headers: NH,
            body: JSON.stringify({ properties: { Estado: { select: { name: input.estado } } } }),
          });
          return { ok: r.ok };
        }
        if (name === 'drive_save_file') {
          const { uploadFromUrl } = await import('../lib/google-drive.js');
          const file = await uploadFromUrl({ url: input.url, filename: input.filename, mimeType: input.mimeType, project: input.project || null });
          return { ok: true, id: file.id, viewUrl: file.webViewLink, name: file.name };
        }
        return { error: 'Unknown tool' };
      }

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const proyectoCtx = proyecto ? `\n\nCONTEXTO ACTIVO: Proyecto "${proyecto}". Enfoca tus respuestas y acciones en este proyecto salvo que pidan otra cosa.` : '';
      const SYSTEM = `Eres el asistente de orquestación de campañas de PVB Estudio Creativo — agencia audiovisual en Santiago, Chile. Clientes típicos: Kaya Unite, Refugio Chiloé, Romerelli.

Tienes acceso a Notion: tareas personales y proyectos del estudio. Puedes consultar, crear, completar tareas y actualizar estado de proyectos.

Responde en español chileno, directo y conciso. Máximo 3-4 líneas salvo que pidan más detalle. Cuando completes una acción en Notion, confírmala brevemente.${proyectoCtx}`;

      const messages = [...history.slice(-12), { role: 'user', content: message }];
      let resp = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system: SYSTEM, tools: TOOLS, messages });

      const actionsPerformed = [];
      while (resp.stop_reason === 'tool_use') {
        const uses = resp.content.filter(b => b.type === 'tool_use');
        uses.forEach(t => { if (['complete_task','create_task','update_project_status'].includes(t.name)) actionsPerformed.push(t.name); });
        const results = await Promise.all(uses.map(async t => ({
          type: 'tool_result', tool_use_id: t.id, content: JSON.stringify(await runTool(t.name, t.input)),
        })));
        messages.push({ role: 'assistant', content: resp.content });
        messages.push({ role: 'user', content: results });
        resp = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system: SYSTEM, tools: TOOLS, messages });
      }

      const reply = resp.content.find(b => b.type === 'text')?.text || '';
      return res.status(200).json({ ok: true, reply, actionsPerformed });
    }

    // ── Drive upload ──────────────────────────────────────────
    if (resolvedAction === 'drive-upload') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { uploadFile, uploadFromUrl } = await import('../lib/google-drive.js');
      const { Readable } = await import('stream');
      const { url, base64, filename, mimeType, project, subfolder } = req.body || {};
      if (!filename || !mimeType) return res.status(400).json({ error: 'filename and mimeType required' });
      let file;
      if (url) {
        file = await uploadFromUrl({ url, filename, mimeType, project, subfolder });
      } else if (base64) {
        const content = Readable.from(Buffer.from(base64, 'base64'));
        file = await uploadFile({ content, filename, mimeType, project, subfolder });
      } else {
        return res.status(400).json({ error: 'Provide url or base64' });
      }
      return res.status(200).json({ id: file.id, name: file.name, viewUrl: file.webViewLink, downloadUrl: file.webContentLink });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('brain error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
