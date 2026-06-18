// brain.js — Master Brain auth + clients + hub + chat
// POST /api/brain             → login (PIN)
// GET  /api/brain?action=...  → list, stats, hub (token requerido)
// POST /api/brain?action=...  → telegram, chat (token requerido)
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { LLMClient } from '../lib/llm-client.js';

async function notifyDiscordError(source, err, context = {}) {
  const webhook = process.env.DISCORD_WEBHOOK_ERRORES;
  if (!webhook) return;
  const fields = Object.entries(context).map(([name, value]) => ({
    name, value: String(value).slice(0, 1024), inline: true,
  }));
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: `🚨 Error en ${source}`,
        description: `\`\`\`${err.message}\`\`\``,
        color: 0xff4444,
        fields,
        timestamp: new Date().toISOString(),
      }],
    }),
  }).catch(() => {});
}

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

  // ── Webhook setup/status — solo admin key, sin token de sesión ──
  if (action === 'webhook-status' || action === 'webhook-setup') {
    const adminKey = req.headers['x-pvb-admin-key'];
    if (adminKey !== process.env.PVB_ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });

    const bots = [
      { name: 'tasks',    token: process.env.TELEGRAM_TASKS_BOT_TOKEN,    webhook: 'https://panchovial.com/api/bot-router/tasks' },
      { name: 'finances', token: process.env.TELEGRAM_FINANCES_BOT_TOKEN, webhook: 'https://panchovial.com/api/bot-router/finances' },
      { name: 'main',     token: process.env.TELEGRAM_BOT_TOKEN,          webhook: 'https://panchovial.com/api/telegram-bot' },
    ];

    if (action === 'webhook-status') {
      const results = await Promise.all(bots.map(async b => {
        if (!b.token) return { bot: b.name, error: 'no token' };
        const r = await fetch(`https://api.telegram.org/bot${b.token}/getWebhookInfo`);
        const d = await r.json();
        return { bot: b.name, url: d.result?.url || '(none)', pending: d.result?.pending_update_count, last_error: d.result?.last_error_message || null, expected: b.webhook, registered: d.result?.url === b.webhook };
      }));
      return res.json({ ok: true, bots: results });
    }

    if (action === 'webhook-setup') {
      const results = await Promise.all(bots.filter(b => b.name !== 'main').map(async b => {
        if (!b.token) return { bot: b.name, error: 'no token' };
        const r = await fetch(`https://api.telegram.org/bot${b.token}/setWebhook`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: b.webhook, allowed_updates: ['message'] }),
        });
        const d = await r.json();
        return { bot: b.name, ok: d.ok, description: d.description };
      }));
      return res.json({ ok: true, results });
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

      const [entregasRes, proyectosRes, boletasRes] = await Promise.all([
        queryNotion('3337ab7f-975e-812c-a0ed-e6af65288d67', {
          filter: { and: [
            { property: 'Estado', select: { does_not_equal: 'Entregado' } },
            { property: 'Estado', select: { does_not_equal: 'Cancelado' } },
          ]},
          sorts: [{ property: 'Deadline', direction: 'ascending' }],
          page_size: 12,
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

      const entregas = (entregasRes.results || []).map(p => ({
        id: p.id,
        titulo: getText(p, 'Título') || getText(p, 'Titulo') || getText(p, 'Name') || '—',
        estado: getSelect(p, 'Estado'),
        prioridad: getSelect(p, 'Prioridad'),
        deadline: getDate(p, 'Deadline') || getDate(p, 'Fecha Límite') || getDate(p, 'Fecha'),
        cliente: getText(p, 'Cliente') || getSelect(p, 'Cliente'),
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

      return res.status(200).json({ ok: true, entregas, proyectos, boletas });
    }

    if (resolvedAction === 'telegram') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { message, chat_id } = req.body || {};
      if (!message) return res.status(400).json({ error: 'message required' });
      const BOT = process.env.TELEGRAM_BOT_TOKEN;
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

    // ── Style Memory — reglas de estilo PVB ──────────────────
    if (action === 'style-memory') {
      const sb = getSupabase();

      if (req.method === 'GET') {
        const { data, error } = await sb
          .from('brain_style_memory')
          .select('id,type,rule,context,created_at')
          .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ rules: data || [] });
      }

      if (req.method === 'POST') {
        const { sub, id, type, rule, context } = req.body || {};

        if (sub === 'delete') {
          const { error } = await sb.from('brain_style_memory').delete().eq('id', id);
          if (error) return res.status(500).json({ error: error.message });
          return res.status(200).json({ ok: true });
        }

        if (sub === 'create') {
          if (!rule) return res.status(400).json({ error: 'rule required' });
          const { data, error } = await sb
            .from('brain_style_memory')
            .insert({ type: type || 'change', rule, context: context || null })
            .select()
            .single();
          if (error) return res.status(500).json({ error: error.message });
          return res.status(200).json({ ok: true, rule: data });
        }
      }
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
        // Table may not exist yet — return empty gracefully instead of 500
        if (error) {
          const stats = { new: 0, warm: 0, hot: 0, converted: 0, lost: 0 };
          return res.json({ ok: true, leads: [], stats, _tableNote: 'esperanza_leads table not found — run schema SQL in Supabase' });
        }

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

    // ── TTS — ElevenLabs voice synthesis ─────────────────────
    if (resolvedAction === 'tts') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { text } = req.body || {};
      if (!text) return res.status(400).json({ error: 'text required' });
      const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
      if (!ELEVEN_KEY) return res.status(503).json({ error: 'ElevenLabs not configured' });
      try {
        // voice param lets brainstorm mode use agent-specific voices
        const voiceParam = req.body?.voice;
        const VOICE_MAP = {
          droga: process.env.ELEVENLABS_VOICE_DROGA || 'pNInz6obpgDQGcFmaJgB', // Adam — David
          rubin: process.env.ELEVENLABS_VOICE_RUBIN || 'TxGEqnHWrfWFTfGW9XjX', // Josh — Rubín
        };
        const voiceId = VOICE_MAP[voiceParam] || process.env.ELEVENLABS_VOICE_ESPERANZA || 'XrExE9yKIg1WjnnlVkGX';
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.slice(0, 300),
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.8 }
          })
        });
        if (!ttsRes.ok) {
          const errBody = await ttsRes.text().catch(() => '');
          console.error('[TTS] ElevenLabs', ttsRes.status, errBody.slice(0, 200));
          return res.status(502).json({ error: `ElevenLabs ${ttsRes.status}`, detail: errBody.slice(0, 100) });
        }
        const audio = await ttsRes.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).send(Buffer.from(audio));
      } catch (ttsErr) {
        console.error('[TTS] exception:', ttsErr.message);
        return res.status(500).json({ error: ttsErr.message });
      }
    }

    // ── Notion Projects — public gallery feed ────────────────
    if (resolvedAction === 'notion-projects') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
      const NK = process.env.NOTION_API_KEY;
      if (!NK) return res.status(503).json({ error: 'Notion not configured' });
      const NH = { 'Authorization': `Bearer ${NK}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
      const DB_PROJ = process.env.NOTION_DB_PROJECTS || '3337ab7f-975e-81b4-8045-d33fe1515aca';
      try {
        const r = await fetch(`https://api.notion.com/v1/databases/${DB_PROJ}/query`, {
          method: 'POST', headers: NH,
          body: JSON.stringify({ page_size: 100, sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }] })
        });
        const data = await r.json();
        const getText = (p, key) => p.properties?.[key]?.title?.[0]?.plain_text || p.properties?.[key]?.rich_text?.[0]?.plain_text || '';
        const projects = (data.results || []).map(p => ({
          id: p.id,
          nombre: getText(p, 'Nombre') || getText(p, 'Name') || getText(p, 'Proyecto') || '—',
          estado: p.properties?.Estado?.select?.name || '—',
          cliente: p.properties?.Cliente?.select?.name || getText(p, 'Cliente') || '—',
          fecha: p.properties?.['Fecha inicio']?.date?.start || p.properties?.Fecha?.date?.start || null,
          launchDate: p.properties?.['Fecha lanzamiento']?.date?.start || p.properties?.['Launch Date']?.date?.start || null,
          objetivo: getText(p, 'Objetivo') || getText(p, 'Descripción') || '',
          cover: p.cover?.external?.url || p.cover?.file?.url || null,
          icon: p.icon?.emoji || null,
          last_edited: p.last_edited_time,
        }));
        return res.status(200).json({ ok: true, projects });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    // ── Brainstorm — David (Droga) + Rubín (Creative Council) ──
    if (resolvedAction === 'brainstorm') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { message, proyecto = '', history = [] } = req.body || {};
      if (!message) return res.status(400).json({ error: 'message required' });

      const PVB_CTX = `\n\nAgencia: PVB Estudio Creativo — productora audiovisual y agencia de marketing en Santiago, Chile. Clientes típicos: Kaya Unite, Refugio Chiloé, Romerelli.${proyecto ? `\nProyecto en foco: "${proyecto}"` : ''}`;

      const DROGA = `Eres David Droga — fundador de Droga5, ahora líder de Accenture Song. CCO y voz estratégica máxima de PVB.${PVB_CTX}\n\nTu rol EXCLUSIVO: visión de negocio de alto nivel. Posicionamiento de la agencia, decisiones de crecimiento, qué clientes perseguir y cuáles no, pricing premium, diferenciación competitiva, cultura de agencia.\n\nEstilo: directo, provocador, ejecutivo. Español chileno informal. Máximo 3-4 párrafos. Cierra con una decisión concreta esta semana.`;

      const RUBIN = `Eres el Consejo Creativo de PVB. Tu voz de referencia es Rick Rubin — minimalismo radical, escuchar la esencia antes de hablar, encontrar lo que la obra quiere ser. Sumas el instinto humano de Leo Burnett, la honestidad disruptiva de Bill Bernbach, y la cultura como motor de Dan Wieden.${PVB_CTX}\n\nTu rol EXCLUSIVO: generar ideas creativas de alto impacto. Conceptos de campaña, territorios creativos, referencias culturales, copies que cortan, dirección de arte que sorprende.\n\nEstilo: cada idea en una oración. Sin bullet points vacíos. Español chileno. Máximo 3 párrafos. Terminas con la idea más disruptiva — aunque incomode.`;

      const msgs = [...(history || []).slice(-6), { role: 'user', content: message }];
      const llm = new LLMClient();
      try {
        const [drogarResp, rubinResp] = await Promise.all([
          llm.messages.create({ max_tokens: 500, system: DROGA, messages: msgs }),
          llm.messages.create({ max_tokens: 500, system: RUBIN,  messages: msgs }),
        ]);
        const droga = drogarResp.content.find(b => b.type === 'text')?.text || '';
        const rubin  = rubinResp.content.find(b => b.type === 'text')?.text  || '';
        return res.status(200).json({ ok: true, droga, rubin });
      } catch (e) {
        return res.status(200).json({ ok: false, error: e.message });
      }
    }

    // ── Chat: Claude Haiku + Notion tool use ─────────────────
    if (resolvedAction === 'chat') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { message, history = [], proyecto = '', localProjects = [], reviewSession = null } = req.body || {};
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
        {
          name: 'create_project',
          description: 'Crea un nuevo proyecto en Notion Proyectos PVB.',
          input_schema: { type: 'object', required: ['nombre'], properties: {
            nombre:  { type: 'string', description: 'Nombre del proyecto' },
            cliente: { type: 'string', description: 'Nombre del cliente' },
            estado:  { type: 'string', description: 'Estado inicial (ej: "En pausa", "En producción", "Propuesta"). Por defecto: En pausa.' },
            fecha:   { type: 'string', description: 'Fecha de inicio YYYY-MM-DD' },
          }},
        },
        {
          name: 'update_task',
          description: 'Actualiza campos de una tarea en Notion: título, fecha, prioridad o estado.',
          input_schema: { type: 'object', required: ['task_id'], properties: {
            task_id:  { type: 'string', description: 'ID de la tarea (viene de get_tasks)' },
            tarea:    { type: 'string', description: 'Nuevo título' },
            fecha:    { type: 'string', description: 'Nueva fecha YYYY-MM-DD' },
            prioridad:{ type: 'string', enum: ['Alta', 'Media', 'Baja'] },
            estado:   { type: 'string', description: 'Ej: "Pendiente", "En progreso", "Completada"' },
          }},
        },
        {
          name: 'ui_navigate',
          description: 'Navega a una sección de Master Brain cambiando el tab activo. Úsalo cuando el usuario pida "ir a", "muéstrame", "abre" o "navega a".',
          input_schema: { type: 'object', required: ['tab'], properties: {
            tab: { type: 'string', enum: ['neural-map','hub','accounts','esperanza','proposals','proyectos','campaigns','departments','agents','clients','competitor-config','activity','routines','portfolio','learnings','audit'], description: 'Tab destino' },
          }},
        },
        {
          name: 'ui_toast',
          description: 'Muestra un mensaje flotante visual en Master Brain. Útil para confirmar acciones completadas o dar alertas cortas.',
          input_schema: { type: 'object', required: ['message'], properties: {
            message: { type: 'string', description: 'Texto del mensaje' },
            level:   { type: 'string', enum: ['info','success','warning','error'], description: 'Estilo visual' },
          }},
        },
        {
          name: 'create_project_local',
          description: 'Crea un nuevo proyecto de campaña en Master Brain (interfaz local). Úsalo cuando pidan crear un proyecto, campaña o cliente nuevo.',
          input_schema: { type: 'object', required: ['campaignName', 'client'], properties: {
            campaignName: { type: 'string', description: 'Nombre de la campaña' },
            client:       { type: 'string', description: 'Nombre del cliente o marca' },
            objective:    { type: 'string', description: 'Objetivo de la campaña' },
            budget:       { type: 'string', description: 'Presupuesto estimado (ej: $3.500.000 CLP)' },
            startDate:    { type: 'string', description: 'Fecha de inicio YYYY-MM-DD' },
            launchDate:   { type: 'string', description: 'Fecha de lanzamiento YYYY-MM-DD' },
            path:         { type: 'string', description: 'Path de producción: film-crew, ia o ambos' },
            kpis:         { type: 'string', description: 'KPIs o métricas de éxito' },
            notes:        { type: 'string', description: 'Notas adicionales' },
          }},
        },
        {
          name: 'open_project',
          description: 'Abre el detalle de un proyecto en Master Brain. Úsalo cuando el usuario pida ver un proyecto específico. Usa IDs de localProjects.',
          input_schema: { type: 'object', required: ['id'], properties: {
            id: { type: 'string', description: 'ID del proyecto de localProjects' },
          }},
        },
        {
          name: 'update_project_field',
          description: 'Actualiza campos de un proyecto en Master Brain: status, launchDate, budget, objective, kpis, notes.',
          input_schema: { type: 'object', required: ['id', 'fields'], properties: {
            id: { type: 'string' },
            fields: { type: 'object', description: 'Campos a actualizar. status: briefing|creative|preproduction|production|postproduction|delivery|live|measuring' },
          }},
        },
        {
          name: 'advance_gantt_phase',
          description: 'Avanza un proyecto a la siguiente fase del Gantt (activa → done, siguiente → active).',
          input_schema: { type: 'object', required: ['id'], properties: {
            id: { type: 'string', description: 'ID del proyecto' },
          }},
        },
        {
          name: 'start_review_session',
          description: 'Inicia una revisión ordenada de proyectos uno por uno. El bot presenta cada proyecto con su estado, fase activa y tareas de Notion.',
          input_schema: { type: 'object', properties: {
            filter_status: { type: 'string', description: 'Opcional: filtrar por estado. Omitir para todos los proyectos.' },
          }},
        },
        {
          name: 'review_advance',
          description: 'Avanza al siguiente proyecto en la sesión de revisión activa.',
          input_schema: { type: 'object', properties: {
            open_id: { type: 'string', description: 'ID del proyecto siguiente a abrir en la UI' },
          }},
        },
        {
          name: 'save_project_note',
          description: 'Guarda una nota o insight en el proyecto como entrada de notepad (.md). Úsalo cuando el usuario pida "guardar esto", "anotá", "guarda como nota", o cuando quieras registrar algo importante de la conversación.',
          input_schema: { type: 'object', required: ['project_id', 'note'], properties: {
            project_id: { type: 'string', description: 'ID del proyecto de localProjects' },
            note:       { type: 'string', description: 'Contenido de la nota en markdown. Puede incluir bullet points, ideas, decisiones.' },
            title:      { type: 'string', description: 'Título corto de la nota (opcional)' },
          }},
        },
        {
          name: 'delete_project_local',
          description: 'Elimina un proyecto de Master Brain. SIEMPRE advierte al usuario antes de confirmar la eliminación. Solo ejecuta si el usuario confirma explícitamente.',
          input_schema: { type: 'object', required: ['id'], properties: {
            id:      { type: 'string', description: 'ID del proyecto a eliminar (de localProjects)' },
            confirm: { type: 'boolean', description: 'true solo si el usuario confirmó explícitamente la eliminación' },
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
        if (name === 'create_project') {
          const props = {
            Nombre: { title: [{ text: { content: input.nombre } }] },
            Estado: { select: { name: input.estado || 'En pausa' } },
          };
          if (input.cliente) props.Cliente = { select: { name: input.cliente } };
          if (input.fecha) props['Fecha inicio'] = { date: { start: input.fecha } };
          const r = await fetch('https://api.notion.com/v1/pages', { method: 'POST', headers: NH, body: JSON.stringify({ parent: { database_id: DB_PROJECTS }, properties: props }) });
          const data = await r.json();
          return { ok: r.ok, id: data.id };
        }
        if (name === 'update_task') {
          const props = {};
          if (input.tarea)     props.Tarea     = { title: [{ text: { content: input.tarea } }] };
          if (input.fecha)     props.Fecha     = { date: { start: input.fecha } };
          if (input.prioridad) props.Prioridad = { select: { name: input.prioridad } };
          if (input.estado)    props.Estado    = { select: { name: input.estado } };
          const r = await fetch(`https://api.notion.com/v1/pages/${input.task_id}`, { method: 'PATCH', headers: NH, body: JSON.stringify({ properties: props }) });
          return { ok: r.ok };
        }
        if (name === 'ui_navigate') {
          return { command: { type: 'navigate_tab', tab: input.tab } };
        }
        if (name === 'ui_toast') {
          return { command: { type: 'show_toast', message: input.message, level: input.level || 'info' } };
        }
        // ── Local Master Brain UI commands ──
        if (name === 'create_project_local') {
          return { command: { type: 'create_project_local', data: input } };
        }
        if (name === 'open_project') {
          return { command: { type: 'open_project', id: input.id } };
        }
        if (name === 'update_project_field') {
          return { command: { type: 'update_project_field', id: input.id, fields: input.fields } };
        }
        if (name === 'advance_gantt_phase') {
          return { command: { type: 'advance_gantt_phase', id: input.id } };
        }
        if (name === 'start_review_session') {
          return { command: { type: 'start_review_session', filter_status: input.filter_status } };
        }
        if (name === 'review_advance') {
          return { command: { type: 'review_advance', open_id: input.open_id } };
        }
        if (name === 'save_project_note') {
          return { command: { type: 'save_project_note', id: input.project_id, note: input.note, title: input.title || null } };
        }
        if (name === 'delete_project_local') {
          if (!input.confirm) return { command: { type: 'show_toast', message: '⚠️ ¿Confirmas eliminar el proyecto? Responde "sí, eliminar" para confirmar.', level: 'warning' } };
          return { command: { type: 'delete_project_local', id: input.id } };
        }
        return { error: 'Unknown tool' };
      }

      const llm = new LLMClient();

      // Cargar reglas de estilo activas desde Supabase
      let styleRulesBlock = '';
      try {
        const sb = getSupabase();
        const { data: rules } = await sb.from('brain_style_memory').select('type,rule').order('created_at', { ascending: false });
        if (rules && rules.length) {
          const neverRules = rules.filter(r => r.type === 'never').map(r => `• NUNCA: ${r.rule}`).join('\n');
          const changeRules = rules.filter(r => r.type === 'change').map(r => `• SIEMPRE: ${r.rule}`).join('\n');
          styleRulesBlock = `\n\nREGLAS DE ESTILO PVB (permanentes — respétalas en toda propuesta creativa):\n${[neverRules, changeRules].filter(Boolean).join('\n')}`;
        }
      } catch { /* no bloquear el chat si falla */ }

      const proyectoCtx = proyecto ? `\n\nCONTEXTO ACTIVO: Proyecto "${proyecto}". Enfoca tus respuestas y acciones en este proyecto salvo que pidan otra cosa.` : '';

      const localProjectsCtx = localProjects.length
        ? `\n\nPROYECTOS EN MASTER BRAIN (${localProjects.length} proyectos):\n${localProjects.map((p, i) => `${i + 1}. [${p.id}] "${p.name}" — Cliente: ${p.client} — Estado: ${p.status} — Fase: ${p.activePhase || '—'} — ${p.progress}% completado — Lanzamiento: ${p.launchDate || '—'}`).join('\n')}`
        : '\n\nPROYECTOS EN MASTER BRAIN: ninguno todavía.';

      const reviewCtx = reviewSession
        ? `\n\nSESIÓN DE REVISIÓN ACTIVA: proyecto ${reviewSession.currentIndex + 1} de ${reviewSession.projects?.length || 0} (ID actual: ${reviewSession.projects?.[reviewSession.currentIndex] || 'fin'}). Cuando el usuario diga "siguiente", "próximo" o "dale", usa review_advance con el ID del siguiente proyecto y preséntalo completo.`
        : '';

      const SYSTEM = `Eres el asistente de orquestación de PVB Estudio Creativo — agencia audiovisual en Santiago, Chile. Clientes típicos: Kaya Unite, Refugio Chiloé, Romerelli.

Tienes acceso completo a Notion y a la interfaz de Master Brain:
- Tareas Notion: consultar, crear, completar y actualizar (get_tasks, create_task, complete_task, update_task).
- Proyectos Notion: consultar, crear, actualizar estado (get_projects, create_project, update_project_status).
- Proyectos Master Brain (LOCAL): crear con create_project_local, abrir con open_project, actualizar campos con update_project_field, avanzar Gantt con advance_gantt_phase, eliminar con delete_project_local (siempre pedir confirmación primero — confirm:false muestra aviso, confirm:true ejecuta). Usa los IDs de localProjects.
- Navegación: ui_navigate para cambiar tabs (neural-map, hub, accounts, esperanza, proposals, proyectos, campaigns, departments, agents, clients, activity, routines, portfolio, learnings).
- Notificaciones: ui_toast para confirmaciones visuales.
- Revisión de proyectos: start_review_session para iniciar revisión ordenada uno por uno, review_advance para siguiente.
- Notepad de proyecto: save_project_note para guardar ideas, insights o decisiones como nota .md en un proyecto. Úsalo cuando el usuario diga "anotá", "guardá esto", "quiero dejar registro" o al terminar una sesión creativa importante.

Al revisar un proyecto, presenta: nombre, cliente, estado, fase activa, % progreso, próximas tareas de Notion, y pregunta qué decidir.
Responde en español chileno, directo y conciso. Máximo 3-4 líneas salvo revisión de proyectos. Confirma cada acción brevemente.${styleRulesBlock}${proyectoCtx}${localProjectsCtx}${reviewCtx}`;

      const messages = [...history.slice(-12), { role: 'user', content: message }];
      let resp;
      try {
        resp = await llm.messages.create({ max_tokens: 1024, system: SYSTEM, tools: TOOLS, messages });
      } catch (llmErr) {
        console.error('LLM chat error:', llmErr.message);
        return res.status(200).json({ ok: false, error: `LLM: ${llmErr.message}` });
      }

      const actionsPerformed = [];
      const commands = [];
      const notionActions = new Set(['complete_task','create_task','update_project_status','create_project','update_task','create_project_local','update_project_field','advance_gantt_phase']);
      while (resp.stop_reason === 'tool_use') {
        const uses = resp.content.filter(b => b.type === 'tool_use');
        const results = await Promise.all(uses.map(async t => {
          const result = await runTool(t.name, t.input);
          if (result.command) commands.push(result.command);
          if (notionActions.has(t.name)) actionsPerformed.push(t.name);
          return { type: 'tool_result', tool_use_id: t.id, content: JSON.stringify(result) };
        }));
        messages.push({ role: 'assistant', content: resp.content });
        messages.push({ role: 'user', content: results });
        resp = await llm.messages.create({ max_tokens: 1024, system: SYSTEM, tools: TOOLS, messages });
      }

      const reply = resp.content.find(b => b.type === 'text')?.text || '';
      return res.status(200).json({ ok: true, reply, actionsPerformed, commands });
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

    if (action === 'creative-session') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { brief, iterate } = req.body || {};
      if (!brief) return res.status(400).json({ error: 'brief required' });

      const ant = new LLMClient({ preferred: 'groq' });

      const briefSummary = `
Cliente: ${brief.client}
Contacto: ${brief.contact?.name} (${brief.contact?.role})
Objetivo: ${brief.objective}
KPIs: ${brief.kpis}
Presupuesto: ${brief.budget}
Lanzamiento: ${brief.launchDate}
Formatos: ${Array.isArray(brief.formats) ? brief.formats.join(', ') : brief.formats}
Path: ${brief.path}
Referencias: ${brief.references || '—'}
Notas de reunión: ${brief.notes || '—'}`.trim();

      const existingSession = brief.creativeSession || [];
      const historyContext = existingSession.length > 0
        ? '\n\nSesión previa:\n' + existingSession.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
        : '';
      const iterateContext = iterate ? `\n\nDirectriz adicional del equipo: ${iterate}` : '';

      const davidRes = await ant.messages.create({
        max_tokens: 800,
        system: `Eres David, estratega creativo senior de PVB Estudio Creativo. Tienes el estilo de David Droga: directo, exigente con la estrategia, brillante con los insights de consumidor. Analizas briefs y entregas perspectiva estratégica clara. Tu output debe incluir:
1. **Insight clave** — la verdad humana que conecta con la audiencia
2. **Territorio de marca** — el espacio emocional donde vive esta campaña
3. **Mensaje núcleo** — una frase que resume la campaña (no tagline, sino el "qué queremos que piensen/sientan")
4. **Dirección para Ruby** — instrucción clara sobre el territorio creativo que debe explorar
Sé conciso y poderoso. No hagas preguntas. Toma posición.`,
        messages: [{ role: 'user', content: `Brief:\n${briefSummary}${historyContext}${iterateContext}` }],
      });
      const davidContent = davidRes.content[0].text;

      const rubyRes = await ant.messages.create({
        max_tokens: 800,
        system: `Eres Ruby, Directora Creativa de PVB Estudio Creativo. Eres visual, audaz, y siempre piensas en cómo las ideas se verán en pantalla. Recibes el brief del cliente y la dirección estratégica de David y las conviertes en una idea creativa ejecutable. Tu output debe incluir:
1. **Concepto** — nombre de la campaña + idea en 1 frase poderosa
2. **Ejecución** — cómo se ve esto en cada formato (video, foto, social, etc.)
3. **Tono visual** — paleta emocional, referencias de estilo, textura visual
4. **Necesidades de pre-producción** — lo que necesitas del Art Director, wardrobe, casting, locaciones
Sé específica y visionaria. Sin ambigüedades.`,
        messages: [{ role: 'user', content: `Brief:\n${briefSummary}\n\nDirección estratégica de David:\n${davidContent}${historyContext}${iterateContext}` }],
      });
      const rubyContent = rubyRes.content[0].text;

      const session = [
        ...existingSession,
        { role: 'david', content: davidContent },
        { role: 'ruby', content: rubyContent },
      ];

      const conceptRes = await ant.messages.create({
        max_tokens: 400,
        system: 'Eres un sintetizador creativo. A partir de la sesión entre David (estrategia) y Ruby (creativo), genera un CONCEPTO FINAL de campaña en formato ejecutivo: 1 párrafo conciso que un Gerente de Marketing puede leer, entender y aprobar en 30 segundos. Incluye: nombre de la campaña, idea central, y por qué va a funcionar.',
        messages: [{ role: 'user', content: `Sesión creativa:\nDavid: ${davidContent}\n\nRuby: ${rubyContent}` }],
      });

      return res.status(200).json({
        ok: true,
        session,
        concept: conceptRes.content[0].text,
      });
    }

    // ── Sync Project → Notion (Gantt phases as Entregas) ─────
    if (action === 'sync-project') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
      const { project } = req.body || {};
      if (!project) return res.status(400).json({ error: 'project required' });

      const NOTION_KEY = process.env.NOTION_API_KEY;
      const NH = { Authorization: `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
      const DB_PROYECTOS = '3337ab7f-975e-81b4-8045-d33fe1515aca';
      const DB_ENTREGAS  = '3337ab7f-975e-812c-a0ed-e6af65288d67';

      // Exact Estado values from Notion schema
      const STATUS_MAP_PROYECTO = {
        briefing: 'Brief', creative: 'Brainstorming', preproduction: 'Pre-produccion',
        production: 'Produccion', postproduction: 'Post-produccion',
        delivery: 'Entregado', live: 'Facturado', measuring: 'Facturado',
      };
      // Entregas only has: Pendiente, Exportado, Entregado, Aprobado
      const STATUS_MAP_ENTREGA = {
        pending: 'Pendiente', active: 'Pendiente', done: 'Entregado',
        review: 'Exportado', risk: 'Pendiente',
      };
      const PHASE_NAMES = {
        descubrimiento: 'Descubrimiento', estrategia: 'Estrategia Creativa',
        presentacion: 'Presentación Cliente', preprod: 'Pre-Producción',
        produccion: 'Producción', postprod: 'Post-Producción',
        revisiones: 'Revisiones', aprobacion: 'Aprobación Final',
        lanzamiento: 'Lanzamiento', medicion: 'Medición & Reporte',
      };

      // Title is "Cuentas" in Notion, format: "Cliente — Campaña"
      const titleText = project.client && project.name !== project.client
        ? `${project.client} — ${project.name}`
        : (project.client || project.name || 'Sin nombre');

      let notionPageId = project.notion_page_id || null;
      const proyectoProps = {
        'Cuentas': { title: [{ text: { content: titleText } }] },
        'Estado':  { select: { name: STATUS_MAP_PROYECTO[project.status] || 'Brief' } },
        'Responsable': { rich_text: [{ text: { content: project.contact?.name || 'PVB' } }] },
      };
      if (project.startDate)  proyectoProps['Fecha Inicio']   = { date: { start: project.startDate } };
      if (project.launchDate) proyectoProps['Fecha Entrega']  = { date: { start: project.launchDate } };
      if (project.budget)     proyectoProps['Presupuesto CLP'] = { number: parseInt(String(project.budget).replace(/\D/g, '')) || null };
      if (project.notes)      proyectoProps['Notas'] = { rich_text: [{ text: { content: project.notes.slice(0, 2000) } }] };

      if (notionPageId) {
        await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
          method: 'PATCH', headers: NH,
          body: JSON.stringify({ properties: proyectoProps }),
        });
      } else {
        const r = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST', headers: NH,
          body: JSON.stringify({ parent: { database_id: DB_PROYECTOS }, properties: proyectoProps }),
        });
        const d = await r.json();
        if (d.id) notionPageId = d.id;
      }

      // Create/update Entrega pages for each gantt phase
      const ganttIds = project.notion_gantt_ids ? { ...project.notion_gantt_ids } : {};
      const gantt = Array.isArray(project.gantt) ? project.gantt : [];

      await Promise.all(gantt.map(async (phase) => {
        const phaseName = PHASE_NAMES[phase.phaseId] || phase.phaseId;
        const entregaProps = {
          'Nombre':  { title: [{ text: { content: `${project.client} — ${phaseName}` } }] },
          'Estado':  { select: { name: STATUS_MAP_ENTREGA[phase.status] || 'Pendiente' } },
          'Notas':   { rich_text: [{ text: { content: phase.notes || '' } }] },
        };
        if (phase.endDate) entregaProps['Fecha Entrega'] = { date: { start: phase.endDate } };
        // Link to parent project page if we have its ID
        if (notionPageId) {
          entregaProps['Proyecto'] = { relation: [{ id: notionPageId }] };
        }

        const existingId = ganttIds[phase.phaseId];
        if (existingId) {
          await fetch(`https://api.notion.com/v1/pages/${existingId}`, {
            method: 'PATCH', headers: NH,
            body: JSON.stringify({ properties: entregaProps }),
          });
        } else {
          const r = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST', headers: NH,
            body: JSON.stringify({ parent: { database_id: DB_ENTREGAS }, properties: entregaProps }),
          });
          const d = await r.json();
          if (d.id) ganttIds[phase.phaseId] = d.id;
        }
      }));

      return res.status(200).json({ ok: true, notion_page_id: notionPageId, notion_gantt_ids: ganttIds });
    }

    // ── Import Projects from Notion → Master Brain ────────────
    if (action === 'import-notion-projects') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });

      const NOTION_KEY = process.env.NOTION_API_KEY;
      const NH = { Authorization: `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };
      const DB_PROYECTOS = '3337ab7f-975e-81b4-8045-d33fe1515aca';

      const GANTT_PHASES = [
        { id: 'descubrimiento', days: 3 }, { id: 'estrategia', days: 5 },
        { id: 'presentacion', days: 3 },   { id: 'preprod', days: 10 },
        { id: 'produccion', days: 2 },     { id: 'postprod', days: 7 },
        { id: 'revisiones', days: 5 },     { id: 'aprobacion', days: 2 },
        { id: 'lanzamiento', days: 1 },    { id: 'medicion', days: 30 },
      ];

      const STATUS_MAP_FROM_NOTION = {
        'Lead': 'briefing', 'Brief': 'briefing', 'Brainstorming': 'creative',
        'Pre-produccion': 'preproduction', 'Produccion': 'production',
        'Post-produccion': 'postproduction', 'Entregado': 'delivery',
        'Factura Enviada': 'delivery', 'Facturado': 'live', 'En pausa': 'briefing',
      };

      const r = await fetch(`https://api.notion.com/v1/databases/${DB_PROYECTOS}/query`, {
        method: 'POST', headers: NH,
        body: JSON.stringify({
          filter: { property: 'Estado', select: { does_not_equal: 'Archivado' } },
          sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
          page_size: 50,
        }),
      });
      const data = await r.json();

      const getTitle = (p, name) => p?.properties?.[name]?.title?.[0]?.plain_text || '';
      const getText  = (p, name) => p?.properties?.[name]?.rich_text?.[0]?.plain_text || '';
      const getSel   = (p, name) => p?.properties?.[name]?.select?.name || null;
      const getDate  = (p, name) => p?.properties?.[name]?.date?.start || null;
      const getNum   = (p, name) => p?.properties?.[name]?.number || null;
      const getMulti = (p, name) => (p?.properties?.[name]?.multi_select || []).map(o => o.name);

      const projects = (data.results || []).map(page => {
        const cuentas = getTitle(page, 'Cuentas');
        // Split "Cliente — Campaña" if pattern exists
        const sep = cuentas.includes(' — ') ? cuentas.indexOf(' — ') : -1;
        const client = sep > -1 ? cuentas.slice(0, sep) : cuentas;
        const name   = sep > -1 ? cuentas.slice(sep + 3) : cuentas;

        const startDate = getDate(page, 'Fecha Inicio') || new Date().toISOString().split('T')[0];
        let d = new Date(startDate + 'T12:00:00');
        const gantt = GANTT_PHASES.map((phase, i) => {
          const phaseStart = d.toISOString().split('T')[0];
          d.setDate(d.getDate() + phase.days);
          const phaseEnd = d.toISOString().split('T')[0];
          d.setDate(d.getDate() + 1);
          return { phaseId: phase.id, startDate: phaseStart, endDate: phaseEnd, status: i === 0 ? 'active' : 'pending', notes: '' };
        });

        return {
          id: 'notion_' + page.id.replace(/-/g, ''),
          notion_page_id: page.id,
          name,
          client,
          contact: { name: getText(page, 'Responsable'), role: '', email: '' },
          objective: getText(page, 'Notas').split('\n')[0] || '',
          kpis: '',
          budget: getNum(page, 'Presupuesto CLP') ? String(getNum(page, 'Presupuesto CLP')) : '',
          startDate,
          launchDate: getDate(page, 'Fecha Entrega') || '',
          formats: getMulti(page, 'Tipo').map(t => t.toLowerCase().replace(' ', '_')),
          path: '',
          references: '',
          notes: getText(page, 'Notas'),
          status: STATUS_MAP_FROM_NOTION[getSel(page, 'Estado')] || 'briefing',
          createdAt: page.created_time,
          concept: null,
          creativeSession: [],
          gantt,
          driveFolder: page.properties?.['Drive Folder']?.url || '',
        };
      });

      return res.status(200).json({ ok: true, projects });
    }

    if (action === 'notion-hub') {
      if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
      const NOTION_KEY = process.env.NOTION_API_KEY;
      const NH = { Authorization: `Bearer ${NOTION_KEY}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' };

      const DB = {
        clientes:       '185296d3-8790-420b-aa31-9ccc55ceb468',
        campanas:       '2fc7ab7f-975e-80fa-8d59-dfc2dee19a1c',
        tareas:         '072b0f71-b1fe-4c78-bd06-c60d7475f4c6',
        ucars_campanas: 'd1f9c377-8c0b-40a8-9f5a-6df2d766c95e',
      };

      const queryDB = async (id, sorts = []) => {
        const body = { page_size: 100 };
        if (sorts.length) body.sorts = sorts;
        const r = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
          method: 'POST', headers: NH, body: JSON.stringify(body),
        });
        const d = await r.json();
        return d.results || [];
      };

      const getT   = (p, n) => p?.properties?.[n]?.title?.[0]?.plain_text || '';
      const getTxt = (p, n) => p?.properties?.[n]?.rich_text?.[0]?.plain_text || '';
      const getSel = (p, n) => p?.properties?.[n]?.select?.name || null;
      const getMul = (p, n) => (p?.properties?.[n]?.multi_select || []).map(o => o.name);
      const getNum = (p, n) => p?.properties?.[n]?.number ?? null;
      const getDt  = (p, n) => p?.properties?.[n]?.date?.start || null;
      const getCbx = (p, n) => p?.properties?.[n]?.checkbox ?? false;
      const getEml = (p, n) => p?.properties?.[n]?.email || null;

      const [rawClientes, rawCampanas, rawTareas, rawUcars] = await Promise.all([
        queryDB(DB.clientes),
        queryDB(DB.campanas, [{ property: 'Deadline', direction: 'ascending' }]),
        queryDB(DB.tareas),
        queryDB(DB.ucars_campanas),
      ]);

      const clientes = rawClientes.map(p => ({
        id: p.id,
        nombre:    getT(p,   'Brand Name'),
        industria: getSel(p, 'Industry'),
        status:    getSel(p, 'Status'),
        contacto:  getTxt(p, 'Contact Name'),
        email:     getEml(p, 'Contact Email'),
        valores:   getTxt(p, 'Brand Values'),
        audiencia: getTxt(p, 'Target Audience'),
        colores:   getTxt(p, 'Brand Colors'),
        budget:    getNum(p, 'Monthly Budget'),
        desde:     getDt(p,  'Client Since'),
        url: p.url,
      }));

      const campanas = rawCampanas.map(p => ({
        id:          p.id,
        nombre:      getT(p,   'Campaña'),
        cliente:     getTxt(p, 'Cliente'),
        status:      getSel(p, 'Status'),
        plataformas: getMul(p, 'Plataformas'),
        leadsObj:    getNum(p, 'Leads Objetivo'),
        leadsAct:    getNum(p, 'Leads Actuales'),
        progreso:    getNum(p, 'Progreso'),
        budget:      getNum(p, 'Budget'),
        costoReal:   getNum(p, 'Costo Real'),
        deadline:    getDt(p,  'Deadline'),
        url: p.url,
      }));

      const tareas = rawTareas.map(p => ({
        id:        p.id,
        tarea:     getT(p,   'Tarea'),
        frecuencia: getSel(p, 'Frecuencia'),
        completada: getCbx(p, 'Completada'),
        ultimaVez:  getDt(p,  'Última vez completada'),
        notas:     getTxt(p, 'Notas'),
        url: p.url,
      }));

      const ucars_campanas = rawUcars.map(p => ({
        id:          p.id,
        nombre:      getT(p,   'Campaña'),
        tipo:        getSel(p, 'Tipo'),
        estado:      getSel(p, 'Estado'),
        objetivo:    getSel(p, 'Objetivo Meta'),
        formatos:    getMul(p, 'Formato'),
        audiencia:   getTxt(p, 'Audiencia'),
        presupuesto: getNum(p, 'Presupuesto CLP'),
        cplObj:      getNum(p, 'CPL Objetivo CLP'),
        cplReal:     getNum(p, 'CPL Real CLP'),
        leads:       getNum(p, 'Leads Generados'),
        notas:       getTxt(p, 'Notas / Copy'),
        fechaInicio: getDt(p,  'Fecha Inicio'),
        fechaFin:    getDt(p,  'Fecha Fin'),
        url: p.url,
      }));

      return res.status(200).json({ ok: true, clientes, campanas, tareas, ucars_campanas });
    }

    // ── Meta Ads ──────────────────────────────────────────────────────────────
    if (action === 'meta-ads') {
      const metaToken = process.env.META_ACCESS_TOKEN;
      const acctId   = process.env.META_AD_ACCOUNT_ID;
      const sub      = req.query.sub || req.body?.sub || 'campaigns';

      if (!metaToken || !acctId) {
        return res.status(200).json({ ok: false, needsSetup: true, message: 'Configura META_ACCESS_TOKEN y META_AD_ACCOUNT_ID en Vercel → Settings → Environment Variables.' });
      }

      const BASE = 'https://graph.facebook.com/v20.0';

      if (req.method !== 'POST') {
        if (sub === 'campaigns') {
          const fields = 'name,status,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights.date_preset(last_7d){impressions,reach,clicks,ctr,cpm,spend,actions}';
          const r = await fetch(`${BASE}/act_${acctId}/campaigns?fields=${encodeURIComponent(fields)}&access_token=${metaToken}`);
          const data = await r.json();
          if (data.error) return res.status(200).json({ ok: false, error: data.error.message });
          return res.status(200).json({ ok: true, campaigns: data.data || [] });
        }
        if (sub === 'insights') {
          const fields = 'impressions,reach,clicks,ctr,cpm,cpp,spend,actions,frequency';
          const r = await fetch(`${BASE}/act_${acctId}/insights?fields=${encodeURIComponent(fields)}&date_preset=last_7d&access_token=${metaToken}`);
          const data = await r.json();
          if (data.error) return res.status(200).json({ ok: false, error: data.error.message });
          return res.status(200).json({ ok: true, insights: data.data?.[0] || {} });
        }
        if (sub === 'account') {
          const r = await fetch(`${BASE}/act_${acctId}?fields=name,currency,account_status,amount_spent,balance&access_token=${metaToken}`);
          const data = await r.json();
          if (data.error) return res.status(200).json({ ok: false, error: data.error.message });
          return res.status(200).json({ ok: true, account: data });
        }
      }

      if (req.method === 'POST') {
        const { campaignId, newStatus } = req.body || {};
        if (sub === 'toggle' && campaignId && newStatus) {
          const r = await fetch(`${BASE}/${campaignId}?access_token=${metaToken}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          const data = await r.json();
          return res.status(200).json({ ok: !!data.success, data });
        }
      }
      return res.status(400).json({ error: 'Unknown meta-ads sub' });
    }

    // ── Valentina Chat (Meta Ads specialist) ──────────────────────────────────
    if (action === 'valentina-chat') {
      if (req.method !== 'POST') return res.status(405).end();
      const { message, history = [] } = req.body || {};
      if (!message) return res.status(400).json({ error: 'message required' });

      const metaToken = process.env.META_ACCESS_TOKEN;
      const acctId   = process.env.META_AD_ACCOUNT_ID;

      let adsCtx = '';
      if (metaToken && acctId) {
        try {
          const BASE = 'https://graph.facebook.com/v20.0';
          const fields = 'name,status,effective_status,objective,daily_budget,insights.date_preset(last_7d){impressions,reach,clicks,ctr,cpm,spend,frequency}';
          const r = await fetch(`${BASE}/act_${acctId}/campaigns?fields=${encodeURIComponent(fields)}&access_token=${metaToken}`);
          const data = await r.json();
          if (data.data?.length) {
            const lines = data.data.map(c => {
              const ins = c.insights?.data?.[0] || {};
              return `• ${c.name} [${c.effective_status}] — Gasto: $${ins.spend||0} | Alcance: ${ins.reach||0} | CTR: ${ins.ctr||0}% | CPM: $${ins.cpm||0} | Freq: ${ins.frequency||0}`;
            }).join('\n');
            adsCtx = `\n\nCAMPAÑAS META ADS (últimos 7 días):\n${lines}`;
          }
        } catch { /* no bloquear si falla */ }
      }

      const VSYSTEM = `Eres Valentina, Directora de Performance de PVB Estudio Creativo (Santiago, Chile). Especialista en Meta Ads.

CLIENTES ACTIVOS:
- UCars: campaña awareness + leads en preparación. Target: compradores auto usado Santiago. Budget ~$50-100/día. Objetivo: leads calificados vía Lead Form.
- Kaya Unite: campaña Invierno 2026 en producción. Ropa outdoor premium.
- Refugio Chiloé: temporada baja, mantención audiencias warm.

ALERTAS AUTOMÁTICAS:
- Frecuencia > 3.5 → fatiga creativa, recomendar rotar creativos
- CTR < 0.8% → copy débil, revisar hook
- CPM > $8 → saturación de audiencia, expandir targeting
- ROAS < 2x → revisar embudo de conversión

Responde en español directo. Máximo 4 líneas salvo que pidan análisis completo. Da datos concretos y recomendaciones accionables.${adsCtx}`;

      const llm = new LLMClient();
      const messages = [...history.slice(-8), { role: 'user', content: message }];
      let resp;
      try {
        resp = await llm.messages.create({ max_tokens: 512, system: VSYSTEM, messages });
      } catch (err) {
        return res.status(200).json({ ok: false, error: err.message });
      }
      const reply = resp.content.find(b => b.type === 'text')?.text || '';
      return res.status(200).json({ ok: true, reply });
    }

    // ── Figma ─────────────────────────────────────────────────────────────────
    if (action === 'figma') {
      const figmaToken = process.env.FIGMA_TOKEN;
      const sub = req.query.sub || 'files';

      if (!figmaToken) {
        return res.status(200).json({ ok: false, needsSetup: true, message: 'Configura FIGMA_TOKEN en Vercel. Obtén tu token en figma.com → Account Settings → Personal Access Tokens.' });
      }

      const FH = { 'X-Figma-Token': figmaToken };
      const FBASE = 'https://api.figma.com/v1';

      if (sub === 'projects') {
        const teamId = process.env.FIGMA_TEAM_ID;
        if (!teamId) return res.status(200).json({ ok: false, needsSetup: true, message: 'Agrega FIGMA_TEAM_ID en Vercel (lo encuentras en la URL del team: figma.com/files/team/XXXXX/).' });
        const r = await fetch(`${FBASE}/teams/${teamId}/projects`, { headers: FH });
        const data = await r.json();
        if (data.err) return res.status(200).json({ ok: false, error: data.err });
        const projects = data.projects || [];
        const withFiles = await Promise.all(projects.map(async proj => {
          const fr = await fetch(`${FBASE}/projects/${proj.id}/files`, { headers: FH });
          const fd = await fr.json();
          return { id: proj.id, name: proj.name, files: (fd.files || []).map(f => ({ key: f.key, name: f.name, thumbnail_url: f.thumbnail_url, last_modified: f.last_modified })) };
        }));
        return res.status(200).json({ ok: true, projects: withFiles });
      }

      if (sub === 'file') {
        const { fileKey } = req.query;
        if (!fileKey) return res.status(400).json({ error: 'fileKey required' });
        const r = await fetch(`${FBASE}/files/${fileKey}?depth=1`, { headers: FH });
        const data = await r.json();
        if (data.err) return res.status(200).json({ ok: false, error: data.err });
        return res.status(200).json({ ok: true, name: data.name, pages: (data.document?.children || []).map(p => ({ id: p.id, name: p.name })), lastModified: data.lastModified });
      }

      return res.status(400).json({ error: 'Unknown figma sub' });
    }

    // ── Higgsfield ────────────────────────────────────────────────────────────
    if (action === 'higgsfield') {
      const hKey = process.env.HIGGSFIELD_API_KEY;
      const sub  = req.query.sub || req.body?.sub || 'generate';

      if (!hKey) {
        return res.status(200).json({ ok: false, needsSetup: true, message: 'Configura HIGGSFIELD_API_KEY en Vercel. Obtén tu key en higgsfield.ai → Settings.' });
      }

      const HH = { 'Authorization': `Bearer ${hKey}`, 'Content-Type': 'application/json' };

      if (sub === 'generate' && req.method === 'POST') {
        const { prompt, style = 'cinematic', aspect_ratio = '9:16', duration = 6 } = req.body || {};
        if (!prompt) return res.status(400).json({ error: 'prompt required' });
        const r = await fetch('https://api.higgsfield.ai/v1/generation', {
          method: 'POST', headers: HH,
          body: JSON.stringify({ prompt, style, aspect_ratio, duration })
        });
        if (!r.ok) {
          const txt = await r.text();
          return res.status(200).json({ ok: false, error: `Higgsfield ${r.status}: ${txt.slice(0, 200)}` });
        }
        const data = await r.json();
        return res.status(200).json({ ok: true, jobId: data.id || data.job_id, status: data.status, data });
      }

      if (sub === 'status') {
        const { jobId } = req.query;
        if (!jobId) return res.status(400).json({ error: 'jobId required' });
        const r = await fetch(`https://api.higgsfield.ai/v1/generation/${jobId}`, { headers: HH });
        const data = await r.json();
        return res.status(200).json({ ok: true, status: data.status, videoUrl: data.video_url || data.url, thumbnailUrl: data.thumbnail_url, data });
      }

      return res.status(400).json({ error: 'Unknown higgsfield sub' });
    }

    // ── Codex / GPT-4o Dev Agent ──────────────────────────────────────────────
    if (action === 'codex') {
      if (req.method !== 'POST') return res.status(405).end();
      const key = process.env.OPENAI_API_KEY;
      if (!key) return res.status(200).json({ ok: false, error: 'OPENAI_API_KEY no configurada' });
      const { prompt, context = '', model = 'gpt-4o' } = req.body || {};
      if (!prompt) return res.status(400).json({ error: 'prompt required' });
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model, max_tokens: 2048,
          messages: [
            { role: 'system', content: `Eres Codex, agente de desarrollo de PVB Estudio Creativo. Stack: HTML/CSS/JS vanilla, Vercel serverless (api/), Supabase PostgreSQL, Node.js. Genera código limpio y funcional. Sin comentarios innecesarios.${context ? `\n\nCONTEXTO DE ARCHIVO:\n${context}` : ''}` },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (!r.ok) {
        const txt = await r.text();
        return res.status(200).json({ ok: false, error: `OpenAI ${r.status}: ${txt.slice(0, 200)}` });
      }
      const data = await r.json();
      return res.status(200).json({ ok: true, reply: data.choices?.[0]?.message?.content || '', model });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('brain error:', err);
    await notifyDiscordError('brain.js', err, { action: req.body?.action || req.query?.action || 'unknown' });
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
