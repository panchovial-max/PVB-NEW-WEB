// brain-clients.js — Master Brain internal endpoint
// Lists all clients with their connected social accounts and fetches live metrics
// Auth: HMAC brain token (same as brain-login.js)
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const HMAC_SECRET = process.env.SUPABASE_SERVICE_KEY;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function verifyBrainToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (decoded.scope !== 'brain') return false;
    if (decoded.expires < Date.now()) return false;
    const payload = `brain:${decoded.expires}`;
    const expectedSig = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
    return decoded.sig === expectedSig;
  } catch {
    return false;
  }
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.BASE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: '{"error":"Method not allowed"}' };

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || !verifyBrainToken(token)) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const action = event.queryStringParameters?.action || 'list';

  try {
    if (action === 'list') {
      // Get all clients with their profiles and connected social accounts
      const { data: profiles, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id, full_name, email, company, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get social accounts for all clients
      const { data: accounts, error: accError } = await supabaseAdmin
        .from('social_accounts')
        .select('user_id, platform, account_name, metadata, last_sync_at, is_active')
        .eq('is_active', true);

      if (accError) throw accError;

      // Group accounts by user
      const accountsByUser = {};
      for (const acc of accounts || []) {
        if (!accountsByUser[acc.user_id]) accountsByUser[acc.user_id] = [];
        accountsByUser[acc.user_id].push(acc);
      }

      const clients = (profiles || []).map(p => ({
        id: p.id,
        name: p.full_name || p.email || 'Cliente sin nombre',
        email: p.email,
        company: p.company,
        joined: p.created_at,
        platforms: (accountsByUser[p.id] || []).map(a => ({
          platform: a.platform,
          account_name: a.account_name,
          username: a.metadata?.username || '',
          profile_picture: a.metadata?.profile_picture || '',
          last_sync: a.last_sync_at
        }))
      }));

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, clients }) };
    }

    if (action === 'stats') {
      const userId = event.queryStringParameters?.user_id;
      const platform = event.queryStringParameters?.platform;
      if (!userId || !platform) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id and platform required' }) };
      }

      const { data: account, error } = await supabaseAdmin
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('is_active', true)
        .single();

      if (error || !account) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: `No ${platform} account for this client` }) };
      }

      let stats = {};
      if (platform === 'instagram') stats = await fetchInstagramStats(account.access_token, account.account_id);
      else if (platform === 'facebook') stats = await fetchFacebookStats(account.access_token, account.account_id);
      else if (platform === 'tiktok') stats = await fetchTikTokStats(account.access_token);
      else if (platform === 'youtube') stats = await fetchYouTubeStats(account.access_token, account.account_id);
      else return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unsupported platform' }) };

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, platform, stats }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };

  } catch (err) {
    console.error('brain-clients error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', detail: err.message }) };
  }
};

async function fetchInstagramStats(accessToken, igAccountId) {
  const profileRes = await fetch(
    `https://graph.facebook.com/v20.0/${igAccountId}?fields=followers_count,media_count,name,username,profile_picture_url&access_token=${accessToken}`
  );
  const profile = await profileRes.json();
  if (profile.error) throw new Error(profile.error.message);

  const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const until = Math.floor(Date.now() / 1000);
  const insightsRes = await fetch(
    `https://graph.facebook.com/v20.0/${igAccountId}/insights?metric=impressions,reach,profile_views&period=day&since=${since}&until=${until}&access_token=${accessToken}`
  );
  const insights = await insightsRes.json();

  let impressions = 0, reach = 0, profileViews = 0;
  if (insights.data) {
    for (const metric of insights.data) {
      const total = metric.values.reduce((sum, v) => sum + (v.value || 0), 0);
      if (metric.name === 'impressions') impressions = total;
      if (metric.name === 'reach') reach = total;
      if (metric.name === 'profile_views') profileViews = total;
    }
  }

  return {
    followers: profile.followers_count || 0,
    media_count: profile.media_count || 0,
    username: profile.username || '',
    impressions, reach, profile_views: profileViews,
    engagement_rate: profile.followers_count > 0
      ? ((reach / profile.followers_count) * 100).toFixed(2) : 0
  };
}

async function fetchTikTokStats(accessToken) {
  const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=follower_count,following_count,likes_count,video_count,display_name,username,avatar_url', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  const user = data.data?.user || {};
  return {
    followers: user.follower_count || 0,
    following: user.following_count || 0,
    likes: user.likes_count || 0,
    video_count: user.video_count || 0,
    username: user.username || user.display_name || ''
  };
}

async function fetchYouTubeStats(accessToken, channelId) {
  const idParam = channelId ? `&id=${channelId}` : '&mine=true';
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics${idParam}&access_token=${accessToken}`
  );
  const data = await res.json();
  const channel = data.items?.[0];
  if (!channel) throw new Error('No YouTube channel found');
  return {
    subscribers: parseInt(channel.statistics?.subscriberCount || 0),
    views: parseInt(channel.statistics?.viewCount || 0),
    video_count: parseInt(channel.statistics?.videoCount || 0),
    title: channel.snippet?.title || ''
  };
}

async function fetchFacebookStats(accessToken, pageId) {
  const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const until = Math.floor(Date.now() / 1000);
  const insightsRes = await fetch(
    `https://graph.facebook.com/v20.0/${pageId}/insights?metric=page_impressions,page_engaged_users,page_reach&period=day&since=${since}&until=${until}&access_token=${accessToken}`
  );
  const insights = await insightsRes.json();
  let impressions = 0, engagedUsers = 0, reach = 0;
  if (insights.data) {
    for (const metric of insights.data) {
      const total = metric.values.reduce((sum, v) => sum + (v.value || 0), 0);
      if (metric.name === 'page_impressions') impressions = total;
      if (metric.name === 'page_engaged_users') engagedUsers = total;
      if (metric.name === 'page_reach') reach = total;
    }
  }
  return { impressions, engaged_users: engagedUsers, reach };
}
