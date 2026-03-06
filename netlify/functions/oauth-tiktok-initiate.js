// TikTok OAuth Initiate - Netlify Function
// Initiates OAuth flow for TikTok
// URL: /.netlify/functions/oauth-tiktok-initiate

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

        // Generate PKCE code_verifier and code_challenge (SHA256 / S256)
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const stateWithVerifier = Buffer.from(JSON.stringify({
      session_token: sessionToken,
      user_id: user.id,
      timestamp: Date.now(),
      code_verifier: codeVerifier
    })).toString('base64');

    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-tiktok-callback`;

    const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
    authUrl.searchParams.append('client_key', process.env.TIKTOK_CLIENT_KEY);
    authUrl.searchParams.append('scope', 'user.info.basic,video.list');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', stateWithVerifier);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        authorization_url: authUrl.toString(),
        message: 'TikTok OAuth URL generated successfully'
      })
    };

  } catch (error) {
    console.error('TikTok OAuth initiate error:', error);
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

// Helper function to generate random string for PKCE
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Generate PKCE code_challenge using SHA256 (S256 method)
async function generateCodeChallenge(codeVerifier) {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(codeVerifier).digest('base64url');
}
