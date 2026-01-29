// LinkedIn OAuth Initiate - Netlify Function
// Initiates OAuth flow for LinkedIn
// URL: /.netlify/functions/oauth-linkedin-initiate

import { validateUserSession } from './utils/supabase.js';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix

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

    // Create state parameter with user session
    const state = Buffer.from(JSON.stringify({
      session_token: sessionToken,
      user_id: user.id,
      timestamp: Date.now()
    })).toString('base64');

    // Build LinkedIn OAuth authorization URL
    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-linkedin-callback`;

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', process.env.LINKEDIN_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', 'r_liteprofile r_emailaddress r_organization_social rw_organization_admin');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        authorization_url: authUrl.toString(),
        message: 'LinkedIn OAuth URL generated successfully'
      })
    };

  } catch (error) {
    console.error('LinkedIn OAuth initiate error:', error);
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
