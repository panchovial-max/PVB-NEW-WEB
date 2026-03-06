// Instagram OAuth Callback - Netlify Function
// Handles Meta Graph API callback to get Instagram Business Account
// URL: /.netlify/functions/oauth-instagram-callback

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
      console.error('Instagram OAuth error:', error, error_description);
      return {
        statusCode: 302,
        headers: { Location: `/settings.html?error=${encodeURIComponent(error_description || error)}` }
      };
    }

    if (!code) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Missing authorization code' }) };
    }

    // Decode state
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

    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-instagram-callback`;

    // 1. Exchange code for short-lived access token
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

    // 3. Get Facebook Pages managed by user
    const pagesRes = await fetch(`${META_API}/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesRes.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return {
        statusCode: 302,
        headers: { Location: '/settings.html?error=no_pages&error_description=No+Facebook+Pages+found.+Connect+a+Facebook+Page+linked+to+your+Instagram+Business+account.' }
      };
    }

    // 4. For each page, get linked Instagram Business Account
    let instagramConnected = 0;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    const debugInfo = [];

    for (const page of pages) {
      const igRes = await fetch(
        `${META_API}/${page.id}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${page.access_token || accessToken}`
      );
      const igData = await igRes.json();
      debugInfo.push({ page_id: page.id, page_name: page.name, ig_response: igData });
      console.log(`Page ${page.name} (${page.id}) IG data:`, JSON.stringify(igData));

      if (igData.instagram_business_account) {
        const igAccount = igData.instagram_business_account;
        await storeSocialAccountToken(user.id, 'instagram', {
          id: igAccount.id,
          name: igAccount.name || igAccount.username || 'Instagram Business',
          username: igAccount.username || null,
          access_token: page.access_token || accessToken,
          refresh_token: null,
          expires_at: expiresAt.toISOString(),
          profile_picture: igAccount.profile_picture_url || null
        });
        instagramConnected++;
      }
    }

    if (instagramConnected === 0) {
      const debugStr = debugInfo.map(d => `Page "${d.page_name}": ${JSON.stringify(d.ig_response)}`).join(' | ');
      return {
        statusCode: 302,
        headers: { Location: `/settings.html?error=no_instagram&error_description=${encodeURIComponent('No Instagram Business account found. Debug: ' + debugStr)}`}
      };
    }

    return {
      statusCode: 302,
      headers: { Location: '/dashboard.html?oauth_success=instagram' }
    };

  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal server error', error: error.message }) };
  }
};
