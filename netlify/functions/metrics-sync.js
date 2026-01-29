// Metrics Sync Function - Netlify Function
// Fetches metrics from social media APIs and stores in Supabase
// URL: /.netlify/functions/metrics-sync

import { validateUserSession, getSupabaseAdmin } from './utils/supabase.js';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get session token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing or invalid authorization token'
        })
      };
    }

    const sessionToken = authHeader.substring(7);

    // Validate user session
    const user = await validateUserSession(sessionToken);
    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid or expired session'
        })
      };
    }

    // Get request body (optional platform filter)
    let requestBody = {};
    if (event.body) {
      try {
        requestBody = JSON.parse(event.body);
      } catch (e) {
        // Ignore parse errors
      }
    }

    const targetPlatform = requestBody.platform; // Optional: sync only specific platform

    const supabase = getSupabaseAdmin();

    // Get user's active social accounts
    let query = supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (targetPlatform) {
      query = query.eq('platform', targetPlatform);
    }

    const { data: accounts, error: accountsError } = await query;

    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No accounts to sync',
          synced: 0,
          errors: 0
        })
      };
    }

    // Sync metrics for each account
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const account of accounts) {
      try {
        // Check if token is expired
        if (account.token_expires_at) {
          const expiresAt = new Date(account.token_expires_at);
          if (expiresAt < new Date()) {
            results.push({
              account_id: account.id,
              platform: account.platform,
              success: false,
              error: 'Token expired - need to refresh'
            });
            errorCount++;
            continue;
          }
        }

        // Fetch metrics based on platform
        let metrics;
        switch (account.platform) {
          case 'instagram':
            metrics = await fetchInstagramMetrics(account);
            break;
          case 'linkedin':
            metrics = await fetchLinkedInMetrics(account);
            break;
          case 'tiktok':
            metrics = await fetchTikTokMetrics(account);
            break;
          case 'facebook':
            metrics = await fetchFacebookMetrics(account);
            break;
          default:
            throw new Error(`Unsupported platform: ${account.platform}`);
        }

        // Store metrics in database
        const { error: insertError } = await supabase
          .from('social_metrics')
          .upsert({
            account_id: account.id,
            metric_date: new Date().toISOString().split('T')[0],
            ...metrics
          }, {
            onConflict: 'account_id,metric_date'
          });

        if (insertError) {
          throw insertError;
        }

        // Update last_sync_at
        await supabase
          .from('social_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account.id);

        results.push({
          account_id: account.id,
          platform: account.platform,
          success: true,
          metrics_updated: true
        });
        successCount++;

      } catch (error) {
        console.error(`Error syncing ${account.platform} account ${account.id}:`, error);
        results.push({
          account_id: account.id,
          platform: account.platform,
          success: false,
          error: error.message
        });
        errorCount++;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        synced: successCount,
        errors: errorCount,
        results
      })
    };

  } catch (error) {
    console.error('Metrics sync error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Failed to sync metrics',
        error: error.message
      })
    };
  }
};

// Fetch Instagram metrics
async function fetchInstagramMetrics(account) {
  const accessToken = account.access_token;

  // Get basic account info
  const accountResponse = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
  );

  if (!accountResponse.ok) {
    throw new Error('Failed to fetch Instagram account info');
  }

  const accountData = await accountResponse.json();

  // Get insights (followers, reach, impressions)
  const insightsResponse = await fetch(
    `https://graph.instagram.com/me/insights?metric=follower_count,impressions,reach,profile_views&period=day&access_token=${accessToken}`
  );

  let insights = {};
  if (insightsResponse.ok) {
    const insightsData = await insightsResponse.json();
    insightsData.data.forEach(insight => {
      const metric = insight.name;
      const value = insight.values?.[0]?.value || 0;
      insights[metric] = value;
    });
  }

  return {
    followers_count: insights.follower_count || 0,
    posts_count: accountData.media_count || 0,
    impressions_count: insights.impressions || 0,
    reach_count: insights.reach || 0,
    profile_views: insights.profile_views || 0,
    engagement_rate: null, // Calculate from posts data if needed
    platform_specific: { account_type: accountData.account_type }
  };
}

// Fetch LinkedIn metrics
async function fetchLinkedInMetrics(account) {
  const accessToken = account.access_token;

  // Get user profile
  const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0'
    }
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to fetch LinkedIn profile');
  }

  // Note: LinkedIn metrics require organization/company page access
  // For personal profiles, metrics are limited
  // This is a simplified version - full implementation would need company page ID

  return {
    followers_count: 0, // Would need company page API
    posts_count: 0,
    impressions_count: 0,
    reach_count: 0,
    engagement_rate: null,
    platform_specific: { note: 'Company page metrics require additional setup' }
  };
}

// Fetch TikTok metrics
async function fetchTikTokMetrics(account) {
  const accessToken = account.access_token;
  const openId = account.account_id;

  // Get user info
  const userInfoUrl = 'https://open.tiktokapis.com/v2/user/info/';
  const userInfoQuery = new URLSearchParams({
    fields: 'open_id,display_name,follower_count,following_count,likes_count,video_count'
  });

  const userInfoResponse = await fetch(`${userInfoUrl}?${userInfoQuery}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch TikTok user info');
  }

  const userInfoData = await userInfoResponse.json();
  const userData = userInfoData.data?.user || {};

  return {
    followers_count: userData.follower_count || 0,
    following_count: userData.following_count || 0,
    posts_count: userData.video_count || 0,
    likes_count: userData.likes_count || 0,
    impressions_count: 0, // Would need video-level insights
    reach_count: 0,
    engagement_rate: null,
    platform_specific: { display_name: userData.display_name }
  };
}

// Fetch Facebook metrics
async function fetchFacebookMetrics(account) {
  const accessToken = account.access_token;

  // Get page info (assuming account_id is a page ID)
  const pageResponse = await fetch(
    `https://graph.facebook.com/v18.0/${account.account_id}?fields=name,fan_count,followers_count&access_token=${accessToken}`
  );

  if (!pageResponse.ok) {
    throw new Error('Failed to fetch Facebook page info');
  }

  const pageData = await pageResponse.json();

  // Get page insights
  const insightsResponse = await fetch(
    `https://graph.facebook.com/v18.0/${account.account_id}/insights?metric=page_impressions,page_engaged_users,page_post_engagements&period=day&access_token=${accessToken}`
  );

  let insights = {};
  if (insightsResponse.ok) {
    const insightsData = await insightsResponse.json();
    insightsData.data?.forEach(insight => {
      const value = insight.values?.[0]?.value || 0;
      insights[insight.name] = value;
    });
  }

  return {
    followers_count: pageData.fan_count || pageData.followers_count || 0,
    posts_count: 0, // Would need separate posts API call
    impressions_count: insights.page_impressions || 0,
    reach_count: insights.page_engaged_users || 0,
    likes_count: insights.page_post_engagements || 0,
    engagement_rate: null,
    platform_specific: { page_name: pageData.name }
  };
}
