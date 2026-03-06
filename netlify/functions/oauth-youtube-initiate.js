// YouTube OAuth Initiate - Netlify Function
// Uses Google OAuth 2.0 with YouTube Data API v3 scope
// URL: /.netlify/functions/oauth-youtube-initiate

import { validateUserSession } from './utils/supabase.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
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
      platform: 'youtube',
      timestamp: Date.now()
    })).toString('base64');

    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-youtube-callback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', process.env.YOUTUBE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', state);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, authorization_url: authUrl.toString() })
    };

  } catch (error) {
    console.error('YouTube OAuth initiate error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal server error' }) };
  }
};
