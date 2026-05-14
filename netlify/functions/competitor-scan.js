// competitor-scan.js — Escanea Instagram de competidores via Apify
// POST con { client_id? } para escanear un cliente específico, o vacío para todos
// Detecta posts virales, guarda en Supabase, notifica por email + Telegram

import { createClient } from '@supabase/supabase-js';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR = 'apify/instagram-scraper';
const APIFY_BASE = 'https://api.apify.com/v2';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runApifyScraper(handles) {
  // Iniciar run en Apify
  const startRes = await fetch(`${APIFY_BASE}/acts/${APIFY_ACTOR}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${APIFY_TOKEN}`
    },
    body: JSON.stringify({
      directUrls: handles.map(h => `https://www.instagram.com/${h.replace('@', '')}/`),
      resultsType: 'posts',
      resultsLimit: 12,
      addParentData: false
    })
  });

  if (!startRes.ok) throw new Error(`Apify start failed: ${startRes.status}`);
  const { data: run } = await startRes.json();

  // Esperar que termine (max 90 segundos)
  let attempts = 0;
  while (attempts < 18) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${run.id}`, {
      headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
    });
    const { data: status } = await statusRes.json();
    if (status.status === 'SUCCEEDED') break;
    if (status.status === 'FAILED' || status.status === 'ABORTED') {
      throw new Error(`Apify run ${status.status}`);
    }
    attempts++;
  }

  // Obtener resultados del dataset
  const dataRes = await fetch(
    `${APIFY_BASE}/actor-runs/${run.id}/dataset/items?clean=true&limit=200`,
    { headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` } }
  );
  if (!dataRes.ok) throw new Error(`Apify dataset fetch failed: ${dataRes.status}`);
  return dataRes.json();
}

async function analyzePostWithClaude(post) {
  // Análisis liviano del hook y por qué es viral
  const caption = (post.caption || '').slice(0, 500);
  const metrics = `${post.videoViewCount || post.likesCount || 0} views, ${post.likesCount || 0} likes, ${post.commentsCount || 0} comentarios`;

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Analiza este post de Instagram viral (${metrics}):
Caption: "${caption}"

Responde en JSON con exactamente estas claves:
{
  "hook": "qué dijo o mostró en los primeros 3 segundos (1 oración)",
  "why_viral": "por qué se viralizó (1-2 oraciones)",
  "forecast": número estimado de views si una agencia similar lo replica
}`
      }]
    });

    return JSON.parse(msg.content[0].text);
  } catch {
    return {
      hook: 'Análisis no disponible',
      why_viral: 'Análisis no disponible',
      forecast: null
    };
  }
}

async function notifyClient(clientId, post, analysis) {
  // Obtener datos del cliente
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', clientId)
    .single();

  const { data: authUser } = await supabase.auth.admin.getUserById(clientId);
  const email = authUser?.user?.email;

  const message = `🔥 Post viral detectado de @${post.instagram_handle}

📊 ${(post.videoViewCount || 0).toLocaleString()} views · ${(post.likesCount || 0).toLocaleString()} likes
🎣 Hook: ${analysis.hook}
💡 Por qué funcionó: ${analysis.why_viral}
🔗 ${post.url}`;

  // Telegram al owner de PVB con contexto del cliente
  const telegramMsg = `*Cliente: ${profile?.full_name || clientId}*\n${message}`;
  await fetch(`${process.env.URL}/.netlify/functions/telegram-notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BRAIN_SERVICE_TOKEN}`
    },
    body: JSON.stringify({ message: telegramMsg, level: 'success' })
  }).catch(() => {});

  // Email al cliente (via Supabase si está configurado, o log)
  if (email && process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'PVB Estudio Creativo <alertas@panchovial.com>',
        to: email,
        subject: `🔥 Post viral de @${post.instagram_handle} detectado`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1a1a1a">Post viral detectado</h2>
            <p><strong>Competidor:</strong> @${post.instagram_handle}</p>
            <p><strong>Views:</strong> ${(post.videoViewCount || 0).toLocaleString()}</p>
            <p><strong>Likes:</strong> ${(post.likesCount || 0).toLocaleString()}</p>
            <p><strong>Hook:</strong> ${analysis.hook}</p>
            <p><strong>Por qué funcionó:</strong> ${analysis.why_viral}</p>
            ${analysis.forecast ? `<p><strong>Forecast para tu cuenta:</strong> ~${analysis.forecast.toLocaleString()} views</p>` : ''}
            <a href="${post.url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px">Ver post →</a>
            <hr style="margin-top:32px;border:none;border-top:1px solid #eee">
            <p style="color:#999;font-size:12px">PVB Estudio Creativo · Inteligencia Competitiva</p>
          </div>
        `
      })
    }).catch(() => {});
  }
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  // Verificar que viene del sistema (cron o Master Brain)
  const authHeader = event.headers.authorization || '';
  const isServiceCall = authHeader === `Bearer ${process.env.COMPETITOR_SCAN_SECRET}`;
  if (!isServiceCall) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const targetClientId = body.client_id || null;

    // Obtener trackers activos
    let query = supabase
      .from('competitor_trackers')
      .select('*, user_profiles(full_name)')
      .eq('is_active', true);

    if (targetClientId) query = query.eq('client_id', targetClientId);

    const { data: trackers, error } = await query;
    if (error) throw error;
    if (!trackers?.length) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, scanned: 0 }) };
    }

    // Agrupar handles por cliente para minimizar llamadas a Apify
    const byClient = trackers.reduce((acc, t) => {
      if (!acc[t.client_id]) acc[t.client_id] = { threshold: t.viral_threshold, handles: [], trackerMap: {} };
      acc[t.client_id].handles.push(t.instagram_handle);
      acc[t.client_id].trackerMap[t.instagram_handle] = t.id;
      return acc;
    }, {});

    let totalNew = 0;

    for (const [clientId, { threshold, handles, trackerMap }] of Object.entries(byClient)) {
      const posts = await runApifyScraper(handles);

      for (const post of posts) {
        const handle = post.ownerUsername || post.username;
        const views = post.videoViewCount || 0;
        const likes = post.likesCount || 0;
        const comments = post.commentsCount || 0;
        const postUrl = post.url || `https://www.instagram.com/p/${post.shortCode}/`;

        if (views < threshold && likes < threshold) continue;

        // Evitar duplicados
        const { data: existing } = await supabase
          .from('viral_posts')
          .select('id')
          .eq('post_url', postUrl)
          .single();
        if (existing) continue;

        const analysis = await analyzePostWithClaude({ ...post, instagram_handle: handle });

        const engagement = views > 0 ? ((likes + comments) / views * 100).toFixed(2) : 0;

        const { error: insertError } = await supabase.from('viral_posts').insert({
          tracker_id: trackerMap[handle],
          client_id: clientId,
          instagram_handle: handle,
          post_url: postUrl,
          post_id: post.shortCode || post.id,
          thumbnail_url: post.displayUrl || post.thumbnailUrl,
          caption: (post.caption || '').slice(0, 1000),
          views,
          likes,
          comments,
          engagement_rate: engagement,
          hook_analysis: analysis.hook,
          why_viral: analysis.why_viral,
          views_forecast: analysis.forecast,
          posted_at: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : null
        });

        if (!insertError) {
          totalNew++;
          await notifyClient(clientId, { ...post, url: postUrl, instagram_handle: handle }, analysis);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, scanned: trackers.length, new_viral_posts: totalNew })
    };

  } catch (err) {
    console.error('competitor-scan error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
