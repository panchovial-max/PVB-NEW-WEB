// Calendar Events - Netlify Function
// Fetches events from Google Calendar API for the authenticated user
// Supports token refresh for expired access tokens

import { validateUserSession, getSupabaseAdmin } from './utils/supabase.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

async function refreshGoogleToken(refreshToken) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token refresh failed: ${errText}`);
  }

  return res.json();
}

async function fetchCalendarEvents(accessToken, timeMin, timeMax) {
  const url = new URL(`${CALENDAR_API}/calendars/primary/events`);
  url.searchParams.append('timeMin', timeMin);
  url.searchParams.append('timeMax', timeMax);
  url.searchParams.append('singleEvents', 'true');
  url.searchParams.append('orderBy', 'startTime');
  url.searchParams.append('maxResults', '100');

  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const status = res.status;
    const errText = await res.text();
    throw new Error(`Calendar API error (${status}): ${errText}`);
  }

  return res.json();
}

function mapEventType(event) {
  const summary = (event.summary || '').toLowerCase();
  if (summary.includes('deadline') || summary.includes('entrega')) return 'deadline';
  if (summary.includes('meeting') || summary.includes('reunion') || summary.includes('reunión') || summary.includes('call') || summary.includes('llamada')) return 'meeting';
  if (summary.includes('launch') || summary.includes('lanzamiento') || summary.includes('estreno')) return 'campaign_start';
  if (summary.includes('milestone') || summary.includes('hito')) return 'milestone';
  if (summary.includes('shoot') || summary.includes('rodaje') || summary.includes('grabación') || summary.includes('grabacion')) return 'campaign_start';
  return 'meeting'; // default
}

function mapPriority(event) {
  // Google Calendar doesn't have priority, infer from color or default
  const colorId = event.colorId;
  if (colorId === '11' || colorId === '4') return 'high';   // red / flamingo
  if (colorId === '6' || colorId === '5') return 'medium';  // tangerine / banana
  return 'normal';
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

    // Get Google Calendar account from Supabase
    const supabase = getSupabaseAdmin();
    const { data: accounts, error: dbError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'google_calendar');

    if (dbError || !accounts?.length) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, events: [], connected: false, message: 'Google Calendar not connected' })
      };
    }

    const account = accounts[0];
    let accessToken = account.access_token;

    // Check if token is expired and refresh
    const now = new Date();
    const expiresAt = new Date(account.token_expires_at);
    if (expiresAt <= now && account.refresh_token) {
      try {
        const refreshed = await refreshGoogleToken(account.refresh_token);
        accessToken = refreshed.access_token;

        // Update token in DB
        const newExpires = new Date();
        newExpires.setSeconds(newExpires.getSeconds() + (refreshed.expires_in || 3600));

        await supabase
          .from('social_accounts')
          .update({
            access_token: accessToken,
            token_expires_at: newExpires.toISOString(),
            last_sync_at: new Date().toISOString()
          })
          .eq('id', account.id);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: false, events: [], connected: true, needs_reauth: true, message: 'Calendar token expired. Please reconnect.' })
        };
      }
    }

    // Parse month parameter (YYYY-MM) or default to current month
    const monthParam = event.queryStringParameters?.month;
    let timeMin, timeMax;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [year, month] = monthParam.split('-').map(Number);
      timeMin = new Date(year, month - 1, 1).toISOString();
      timeMax = new Date(year, month, 0, 23, 59, 59).toISOString();
    } else {
      const now = new Date();
      timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    }

    const calData = await fetchCalendarEvents(accessToken, timeMin, timeMax);

    // Map Google Calendar events to our format
    const events = (calData.items || []).map(item => {
      const start = item.start?.dateTime || item.start?.date;
      const startDate = new Date(start);
      const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

      let timeStr = null;
      if (item.start?.dateTime) {
        timeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }

      return {
        event_id: item.id,
        event_title: item.summary || '(Sin título)',
        event_description: item.description || '',
        event_date: dateStr,
        event_time: timeStr || 'All day',
        event_type: mapEventType(item),
        priority: mapPriority(item),
        campaign_name: item.location || null,
        google_link: item.htmlLink || null
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, events, connected: true })
    };

  } catch (error) {
    console.error('Calendar events error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: error.message }) };
  }
};
