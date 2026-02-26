// LinkedIn OAuth Callback - Netlify Function
// Handles OAuth callback from LinkedIn
// URL: /.netlify/functions/oauth-linkedin-callback

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
      console.error('LinkedIn OAuth error:', error, errorDescription);
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
    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-linkedin-callback`;

    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('LinkedIn token exchange failed:', errorData);
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
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000; // Default 60 days

    // Get LinkedIn user profile via OpenID Connect userinfo endpoint
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!profileResponse.ok) {
      console.error('LinkedIn profile fetch failed');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Failed to fetch LinkedIn profile'
        })
      };
    }

    const profileData = await profileResponse.json();

    // OpenID Connect userinfo returns name and email directly
    const fullName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim();
    const email = profileData.email || null;

    // Calculate token expiry date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Store account in database
    await storeSocialAccountToken(user.id, 'linkedin', {
      id: profileData.sub,
      name: fullName,
      username: email || profileData.sub,
      access_token: accessToken,
      refresh_token: null,
      expires_at: expiresAt.toISOString(),
      profile_picture: profileData.picture || null
    });

    // Redirect to dashboard with success message
    return {
      statusCode: 302,
      headers: {
        Location: '/dashboard.html?oauth_success=linkedin'
      }
    };

  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
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
