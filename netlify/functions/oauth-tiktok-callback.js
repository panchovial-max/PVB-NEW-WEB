// TikTok OAuth Callback - Netlify Function
// Handles OAuth callback from TikTok
// URL: /.netlify/functions/oauth-tiktok-callback

import { validateUserSession, storeSocialAccountToken } from './utils/supabase.js';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get OAuth code and state from query parameters
    const params = event.queryStringParameters || {};
    const code = params.code;
    const state = params.state;
    const error = params.error;
    const errorDescription = params.error_description;

    // Check for OAuth errors
    if (error) {
      console.error('TikTok OAuth error:', error, errorDescription);
      return {
        statusCode: 302,
        headers: {
          Location: `/login.html?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || 'Authentication failed')}`
        }
      };
    }

    // Validate required parameters
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Missing authorization code'
        })
      };
    }

    // Decode state to get user session token and code_verifier
    let userSession, codeVerifier;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      userSession = stateData.session_token;
      codeVerifier = stateData.code_verifier;
    } catch (err) {
      console.error('Invalid state parameter:', err);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Invalid state parameter'
        })
      };
    }

    // Validate user session
    const user = await validateUserSession(userSession);
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

    // Exchange authorization code for access token
    // TikTok uses a different endpoint structure
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BASE_URL}/.netlify/functions/oauth-tiktok-callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('TikTok token exchange failed:', errorData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Failed to exchange authorization code'
        })
      };
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.data) {
      console.error('TikTok token error:', tokenData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: tokenData.error?.message || 'Failed to get access token'
        })
      };
    }

    const accessToken = tokenData.data.access_token;
    const refreshToken = tokenData.data.refresh_token;
    const expiresIn = tokenData.data.expires_in || 86400; // Default 24 hours
    const openId = tokenData.data.open_id;

    // Get TikTok user info
    const userInfoUrl = 'https://open.tiktokapis.com/v2/user/info/';
    const userInfoQuery = new URLSearchParams({
      fields: 'open_id,union_id,avatar_url,display_name,username'
    });

    const userInfoResponse = await fetch(`${userInfoUrl}?${userInfoQuery}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    let userData = { display_name: 'TikTok User', username: openId };
    if (userInfoResponse.ok) {
      const userInfoData = await userInfoResponse.json();
      if (userInfoData.data?.user) {
        userData = userInfoData.data.user;
      }
    }

    // Calculate token expiry date (TikTok tokens expire quickly - 24 hours)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Store account in database
    await storeSocialAccountToken(user.id, 'tiktok', {
      id: openId,
      name: userData.display_name || userData.username || 'TikTok User',
      username: userData.username || openId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      profile_picture: userData.avatar_url || null
    });

    // Redirect to dashboard with success message
    return {
      statusCode: 302,
      headers: {
        Location: '/dashboard.html?oauth_success=tiktok'
      }
    };

  } catch (error) {
    console.error('TikTok OAuth callback error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error.message
      })
    };
  }
};
