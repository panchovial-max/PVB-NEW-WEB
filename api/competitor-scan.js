// competitor-scan.js — Escanea Instagram de competidores via Apify (Vercel)
// POST /api/competitor-scan
// Body: { client_id? } — omitir para escanear todos los clientes activos
// Auth: Authorization: Bearer <COMPETITOR_SCAN_SECRET>

import { createClient } from '@supabase/supabase-js';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR = 'apify/instagram-scraper';
const APIFY_BASE = 'https://api.apify.com/v2';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  );
}

async function runApifyScraper(handles) {
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

  // Esperar resultado (max 90s)
  for (let i = 0; i < 18; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const { data: status } = await fetch(`${APIFY_BASE}/actor-runs/${run.id}`, {
      headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` }
    }).then(r => r.json());

    if (status.status === 'SUCCEEDED') break;
    if (status.status === 'FAILED' || status.status === 'ABORTED') {
      throw new Error(`Apify run ${status.status}`);
    }
  }

  const dataRes = await fetch(
    `${APIFY_BASE}/actor-runs/${run.id}/dataset/items?clean=true&limit=200`,
    { headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` } }
  );
  if (!dataRes.ok) throw new Error(`Apify dataset failed: ${dataRes.status}`);
  return dataRes.json();
}

async function analyzePost(post) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { hook: 'Análisis no disponible', why_viral: 'Análisis no disponible', forecast: null };
  }
  const caption = (post.caption || '').slice(0, 500);
  const views = post.videoViewCount || post.likesCount || 0;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Post de Instagram viral (${views.toLocaleString()} views). Caption: "${caption}"\n\nResponde SOLO con JSON:\n{"hook":"qué mostró en los primeros 3 segundos","why_viral":"por qué se viralizó (1-2 oraciones)","forecast":número_estimado_si_agencia_lo_replica}`
        }]
      })
    });
    const data = await res.json();
    return JSON.parse(data.content[0].text);
  } catch {
    return { hook: 'Análisis no disponible', why_viral: 'Análisis no disponible', forecast: null };
  }
}

async function notifyViral(supabase, clientId, post, analysis) {
  // Email del cliente via Supabase Admin
  const { data: { user } } = await supabase.auth.admin.getUserById(clientId);
  const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', clientId).single();

  const message = `*Cliente: ${profile?.full_name || clientId}*\n\n🔥 Post viral de @${post.instagram_handle}\n\n📊 ${(post.views || 0).toLocaleString()} views\n🎣 Hook: ${analysis.hook}\n💡 ${analysis.why_viral}\n🔗 ${post.post_url}`;

  // Telegram al owner PVB
  await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://panchovial.com'}/api/telegram-notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BRAIN_SERVICE_TOKEN}`
    },
    body: JSON.stringify({ message, level: 'success' })
  }).catch(() => {});

  // Email al cliente (Resend)
  if (user?.email && process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'PVB Estudio Creativo <alertas@panchovial.com>',
        to: user.email,
        subject: `🔥 Post viral de @${post.instagram_handle} detectado`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#080808;color:#fff;padding:40px 32px;">
            <p style="font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#666;margin:0 0 24px">PVB ESTUDIO CREATIVO</p>
            <h2 style="margin:0 0 20px;font-size:20px">Post viral detectado</h2>
            <p style="color:#aaa;margin:0 0 8px"><strong style="color:#fff">Competidor:</strong> @${post.instagram_handle}</p>
            <p style="color:#aaa;margin:0 0 8px"><strong style="color:#fff">Views:</strong> ${(post.views || 0).toLocaleString()}</p>
            <p style="color:#aaa;margin:0 0 8px"><strong style="color:#fff">Hook:</strong> ${analysis.hook}</p>
            <p style="color:#aaa;margin:0 0 20px"><strong style="color:#fff">Por qué funcionó:</strong> ${analysis.why_viral}</p>
            ${analysis.forecast ? `<p style="color:#aaa;margin:0 0 20px"><strong style="color:#fff">Forecast si lo replicás:</strong> ~${analysis.forecast.toLocaleString()} views</p>` : ''}
            <a href="${post.post_url}" style="display:inline-block;background:#fff;color:#000;padding:12px 24px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;font-weight:600">Ver post →</a>
            <hr style="border:none;border-top:1px solid #1f1f1f;margin:32px 0">
            <p style="font-size:11px;color:#444;margin:0"><a href="https://panchovial.com" style="color:#666">panchovial.com</a></p>
          </div>
        `
      })
    }).catch(() => {});
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.COMPETITOR_SCAN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabase();

  try {
    const { client_id: targetClientId } = req.body || {};

    let query = supabase
      .from('competitor_trackers')
      .select('*')
      .eq('is_active', true);
    if (targetClientId) query = query.eq('client_id', targetClientId);

    const { data: trackers, error } = await query;
    if (error) throw error;
    if (!trackers?.length) return res.status(200).json({ ok: true, scanned: 0, new_viral_posts: 0 });

    // Agrupar por cliente
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

        const { data: existing } = await supabase
          .from('viral_posts')
          .select('id')
          .eq('post_url', postUrl)
          .maybeSingle();
        if (existing) continue;

        const analysis = await analyzePost({ ...post, instagram_handle: handle });
        const engagement = views > 0 ? ((likes + comments) / views * 100).toFixed(2) : 0;

        const { error: insertErr } = await supabase.from('viral_posts').insert({
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

        if (!insertErr) {
          totalNew++;
          await notifyViral(supabase, clientId, { instagram_handle: handle, post_url: postUrl, views }, analysis);
        }
      }
    }

    return res.status(200).json({ ok: true, scanned: trackers.length, new_viral_posts: totalNew });

  } catch (err) {
    console.error('competitor-scan error:', err);
    return res.status(500).json({ error: err.message });
  }
}
