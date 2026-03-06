// Facebook OAuth Callback - Netlify Function
// URL: /.netlify/functions/oauth-facebook-callback

import { validateUserSession, storeSocialAccountToken } from './utils/supabase.js';

const META_API = 'https://graph.facebook.com/v20.0';

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const { code, state, error, error_description } = params;

    if (error) {
      console.error('Facebook OAuth error:', error, error_description);
      return {
        statusCode: 302,
        headers: { Location: `/settings.html?error=${encodeURIComponent(error_description || error)}` }
      };
    }

    if (!code) {
      console.error('Missing code. Full query params:', JSON.stringify(params));
      return { statusCode: 302, headers: { Location: `/settings.html?error=missing_code&error_description=${encodeURIComponent('No authorization code received from Meta. Params: ' + JSON.stringify(params))}` } };
    }

    // Decode state
    let userSession;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      userSession = stateData.session_token;
    } catch {
      return { statusCode: 302, headers: { Location: '/settings.html?error=invalid_state&error_description=Invalid+state+parameter' } };
    }

    const user = await validateUserSession(userSession);
    if (!user) {
      return { statusCode: 302, headers: { Location: '/login.html?error=session_expired&redirect=settings' } };
    }

    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-facebook-callback`;

    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(`${META_API}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Meta token exchange failed:', err);
      return {
        statusCode: 302,
        headers: { Location: `/settings.html?error=token_exchange&error_description=${encodeURIComponent('Meta rejected the authorization. Check that the app Redirect URI matches the Netlify URL. Details: ' + err)}` }
      };
    }

    const { access_token: shortToken } = await tokenRes.json();

    // 2. Exchange for long-lived token (60 days)
    const longTokenRes = await fetch(
      `${META_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${shortToken}`
    );
    const longTokenData = await longTokenRes.json();
    const accessToken = longTokenData.access_token || shortToken;
    const expiresIn = longTokenData.expires_in || 5184000;

    // 3. Get Facebook user info
    const meRes = await fetch(`${META_API}/me?fields=id,name,email,picture&access_token=${accessToken}`);
    const meData = await meRes.json();

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    await storeSocialAccountToken(user.id, 'facebook', {
      id: meData.id,
      name: meData.name || 'Facebook Account',
      username: meData.email || null,
      access_token: accessToken,
      refresh_token: null,
      expires_at: expiresAt.toISOString(),
      profile_picture: meData.picture?.data?.url || null
    });

    return {
      statusCode: 302,
      headers: { Location: '/dashboard.html?oauth_success=facebook' }
    };

  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal server error', error: error.message }) };
  }
};
