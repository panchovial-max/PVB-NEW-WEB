// brain-clients.js — Master Brain clients endpoint (Vercel)
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

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

export default async function handler(req, res) {
  const secret = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(process.env.SUPABASE_URL, secret);

  res.setHeader('Access-Control-Allow-Origin', process.env.BASE_URL || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !verifyBrainToken(token, secret)) return res.status(401).json({ error: 'Unauthorized' });

  const { action = 'list', user_id, platform } = req.query;

  try {
    if (action === 'list') {
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

    if (action === 'stats') {
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

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('brain-clients error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
