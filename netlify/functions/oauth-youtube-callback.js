// YouTube OAuth Callback - Netlify Function
// Exchanges code for tokens and stores YouTube channel info
// URL: /.netlify/functions/oauth-youtube-callback

import { validateUserSession, storeSocialAccountToken } from './utils/supabase.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const params = event.queryStringParameters || {};
    const { code, state, error, error_description } = params;

    if (error) {
      console.error('YouTube OAuth error:', error, error_description);
      return {
        statusCode: 302,
        headers: { Location: `/settings.html?error=${encodeURIComponent(error_description || error)}` }
      };
    }

    if (!code) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Missing authorization code' }) };
    }

    let userSession;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      userSession = stateData.session_token;
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid state parameter' }) };
    }

    const user = await validateUserSession(userSession);
    if (!user) {
      return { statusCode: 302, headers: { Location: '/login.html?error=session_expired&redirect=settings' } };
    }

    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-youtube-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('YouTube token exchange failed:', err);
      return {
        statusCode: 302,
        headers: { Location: '/settings.html?error=token_exchange_failed' }
      };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;

    // Get YouTube channel info
    const channelRes = await fetch(
      `${YOUTUBE_API}/channels?part=snippet,statistics&mine=true&access_token=${accessToken}`
    );
    const channelData = await channelRes.json();

    if (!channelData.items?.length) {
      return {
        statusCode: 302,
        headers: { Location: '/settings.html?error=no_youtube_channel&error_description=No+YouTube+channel+found+for+this+Google+account' }
      };
    }

    const channel = channelData.items[0];
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    await storeSocialAccountToken(user.id, 'youtube', {
      id: channel.id,
      name: channel.snippet.title || 'YouTube Channel',
      username: channel.snippet.customUrl || channel.id,
      access_token: accessToken,
      refresh_token: refreshToken || null,
      expires_at: expiresAt.toISOString(),
      profile_picture: channel.snippet.thumbnails?.default?.url || null
    });

    return {
      statusCode: 302,
      headers: { Location: '/dashboard.html?oauth_success=youtube' }
    };

  } catch (error) {
    console.error('YouTube OAuth callback error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal server error', error: error.message }) };
  }
};
