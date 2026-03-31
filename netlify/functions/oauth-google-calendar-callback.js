// Google Calendar OAuth Callback - Netlify Function
// Exchanges code for tokens and stores calendar access

import { validateUserSession, storeSocialAccountToken, consumeOAuthState } from './utils/supabase.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

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
      console.error('Google Calendar OAuth error:', error, error_description);
      return {
        statusCode: 302,
        headers: { Location: `/settings.html?error=${encodeURIComponent(error_description || error)}#integrations` }
      };
    }

    if (!code) {
      return { statusCode: 302, headers: { Location: '/settings.html?error=missing_code#integrations' } };
    }

    const stateData = await consumeOAuthState(state);
    if (!stateData) {
      return { statusCode: 302, headers: { Location: '/settings.html?error=invalid_state#integrations' } };
    }

    const user = await validateUserSession(stateData.session_token);
    if (!user) {
      return { statusCode: 302, headers: { Location: '/login.html?error=session_expired&redirect=settings' } };
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = `${process.env.BASE_URL}/.netlify/functions/oauth-google-calendar-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Google Calendar token exchange failed:', errText);
      let errCode = 'token_exchange_failed';
      try { const errJson = JSON.parse(errText); if (errJson.error) errCode = errJson.error; } catch {}
      return {
        statusCode: 302,
        headers: { Location: `/settings.html?error=${encodeURIComponent(errCode)}&detail=${encodeURIComponent(errText.substring(0, 300))}#integrations` }
      };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;

    // Get primary calendar info
    const calRes = await fetch(`${CALENDAR_API}/calendars/primary`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    let calendarName = 'Google Calendar';
    let calendarId = 'primary';
    let calendarEmail = user.email;

    if (calRes.ok) {
      const calData = await calRes.json();
      calendarName = calData.summary || 'Google Calendar';
      calendarId = calData.id || 'primary';
      calendarEmail = calData.id; // calendar ID is usually the email
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    await storeSocialAccountToken(user.id, 'google_calendar', {
      id: calendarId,
      name: calendarName,
      username: calendarEmail,
      access_token: accessToken,
      refresh_token: refreshToken || null,
      expires_at: expiresAt.toISOString(),
      profile_picture: null
    });

    return {
      statusCode: 302,
      headers: { Location: '/dashboard.html?oauth_success=google_calendar' }
    };

  } catch (error) {
    console.error('Google Calendar OAuth callback error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal server error' }) };
  }
};
