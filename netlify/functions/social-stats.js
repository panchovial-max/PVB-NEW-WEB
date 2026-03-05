// Social Stats — Netlify Function
// Fetches real stats from Instagram/Facebook using stored tokens
// URL: /.netlify/functions/social-stats?platform=instagram

import { createClient } from '@supabase/supabase-js';
import { validateUserSession } from './utils/supabase.js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing token' }) };
    }

    const user = await validateUserSession(authHeader.substring(7));
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };

    const platform = event.queryStringParameters?.platform || 'instagram';

    // Get stored token from Supabase
    const { data: account, error: dbError } = await supabaseAdmin
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    if (dbError || !account) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: `No connected ${platform} account` }) };
    }

    let stats = {};

    if (platform === 'instagram') {
      stats = await fetchInstagramStats(account.access_token, account.account_id);
    } else if (platform === 'facebook') {
      stats = await fetchFacebookStats(account.access_token, account.account_id);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, platform, stats }) };

  } catch (error) {
    console.error('social-stats error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', detail: error.message }) };
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
    name: profile.name || '',
    profile_picture: profile.profile_picture_url || '',
    impressions,
    reach,
    profile_views: profileViews,
    engagement_rate: profile.followers_count > 0
      ? ((reach / profile.followers_count) * 100).toFixed(2)
      : 0
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
