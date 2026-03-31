// Google Calendar OAuth Initiate - Netlify Function
// Uses Google OAuth 2.0 with Calendar API scope
// Reuses YOUTUBE_CLIENT_ID/SECRET (same Google Cloud project)

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
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Missing authorization token' }) };
    }

    const sessionToken = authHeader.substring(7);
    const user = await validateUserSession(sessionToken);
    if (!user) {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: 'Invalid or expired session' }) };
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
    if (!clientId) {
      return { statusCode: 503, headers, body: JSON.stringify({ success: false, message: 'Google Calendar integration not configured yet' }) };
    }

    const state = await createOAuthState(user.id, sessionToken, 'google_calendar');

    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-google-calendar-callback`;

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', state);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, authorization_url: authUrl.toString() })
    };

  } catch (error) {
    console.error('Google Calendar OAuth initiate error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal server error' }) };
  }
};
