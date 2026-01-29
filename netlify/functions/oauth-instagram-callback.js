// Instagram OAuth Callback - Netlify Function
// Handles OAuth callback from Instagram/Meta
// URL: /.netlify/functions/oauth-instagram-callback

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
      console.error('Instagram OAuth error:', error, errorDescription);
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

    // Decode state to get user session token
    let userSession;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      userSession = stateData.session_token;
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
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BASE_URL}/.netlify/functions/oauth-instagram-callback`,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Instagram token exchange failed:', errorData);
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

    // Get long-lived access token (Instagram tokens expire in 60 days)
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${tokenData.access_token}`
    );

    const longLivedTokenData = await longLivedTokenResponse.json();
    const accessToken = longLivedTokenData.access_token || tokenData.access_token;
    const expiresIn = longLivedTokenData.expires_in || 5184000; // Default 60 days

    // Get Instagram account info
    const userInfoResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`
    );

    const userInfo = await userInfoResponse.json();

    // Calculate token expiry date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Store account in database
    await storeSocialAccountToken(user.id, 'instagram', {
      id: userInfo.id,
      name: userInfo.username,
      username: userInfo.username,
      access_token: accessToken,
      refresh_token: null, // Instagram doesn't provide refresh tokens
      expires_at: expiresAt.toISOString(),
      profile_picture: null // Can fetch separately if needed
    });

    // Redirect to dashboard with success message
    return {
      statusCode: 302,
      headers: {
        Location: '/dashboard.html?oauth_success=instagram'
      }
    };

  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
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
