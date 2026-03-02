// Facebook OAuth Initiate - Netlify Function
// URL: /.netlify/functions/oauth-facebook-initiate

import { validateUserSession } from './utils/supabase.js';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Missing authorization token' }) };
    }

    const sessionToken = authHeader.substring(7);
    const user = await validateUserSession(sessionToken);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid or expired session' }) };
    }

    const state = Buffer.from(JSON.stringify({
      session_token: sessionToken,
      user_id: user.id,
      platform: 'facebook',
      timestamp: Date.now()
    })).toString('base64');

    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-facebook-callback`;

    const authUrl = new URL('https://www.facebook.com/dialog/oauth');
    authUrl.searchParams.append('client_id', process.env.META_APP_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', 'pages_show_list,pages_read_engagement,ads_read');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, authorization_url: authUrl.toString() })
    };

  } catch (error) {
    console.error('Facebook OAuth initiate error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal server error' }) };
  }
};
