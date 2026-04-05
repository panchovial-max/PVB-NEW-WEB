// Google Drive OAuth Initiate - Netlify Function
// Reuses same Google Cloud credentials as Calendar

import { validateUserSession, createOAuthState } from './utils/supabase.js';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    // Brain PIN auth (no Supabase session needed)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Missing auth' }) };
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
    if (!clientId) {
      return { statusCode: 503, headers, body: JSON.stringify({ success: false, message: 'Google credentials not configured' }) };
    }

    // Use a simple state token for brain (not Supabase user)
    const state = 'brain-drive-' + Date.now();

    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-drive-callback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/drive');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', state);
    // Suggest info@panchovial.com account
    authUrl.searchParams.append('login_hint', 'info@panchovial.com');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, authorization_url: authUrl.toString() })
    };

  } catch (error) {
    console.error('Drive OAuth initiate error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: error.message }) };
  }
};
