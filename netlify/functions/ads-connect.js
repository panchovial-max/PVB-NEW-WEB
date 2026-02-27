// Ads Platform Connect - Netlify Function
// Saves ad platform credentials to Supabase
// URL: /.netlify/functions/ads-connect

import { validateUserSession, ensureUserProfile, getSupabaseAdmin } from './utils/supabase.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  }

  try {
    // Validate session
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Missing authorization token' }) };
    }

    const sessionToken = authHeader.substring(7);
    const user = await validateUserSession(sessionToken);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid or expired session' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { platform, ...credentials } = body;

    if (!platform) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Missing platform' }) };
    }

    // Ensure user_profiles row exists
    await ensureUserProfile(user.id);

    const supabase = getSupabaseAdmin();

    // Upsert into social_accounts with platform key like 'linkedin-ads'
    const { error } = await supabase
      .from('social_accounts')
      .upsert({
        user_id: user.id,
        platform: `${platform}-ads`,
        account_id: credentials.account_id || credentials.ad_account_id || credentials.customer_id || credentials.advertiser_id || platform,
        account_name: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Ads`,
        account_username: credentials.client_id || credentials.app_id || credentials.api_key || '',
        access_token: credentials.access_token || '',
        refresh_token: credentials.refresh_token || null,
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform,account_id'
      });

    if (error) {
      console.error('ads-connect upsert error:', error);
      return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: error.message }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: `${platform} Ads connected successfully` })
    };

  } catch (error) {
    console.error('ads-connect error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal server error' }) };
  }
};
