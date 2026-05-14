// calendar-create-event.js — crea eventos en Google Calendar del usuario con color PVB
// Colores Google Calendar: 1=lavender 2=sage 3=grape 4=flamingo 5=banana 6=tangerine
//                          7=peacock 8=blueberry 9=basil 10=tomato 11=flamingo(alt)

import { validateUserSession, getSupabaseAdmin } from './utils/supabase.js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

// Map de colores PVB → colorId de Google Calendar
const COLOR_MAP = {
  green:    '10', // basil (verde oscuro) — campañas confirmadas
  teal:     '7',  // peacock — lanzamientos
  yellow:   '5',  // banana — alertas / preparación
  orange:   '6',  // tangerine — deadlines
  red:      '4',  // flamingo — urgente
  blue:     '8',  // blueberry — reuniones
  purple:   '3',  // grape — brainstorm / creatividad
  lavender: '1',  // lavender — recordatorios
};

async function refreshGoogleToken(refreshToken) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' })
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing token' }) };

    const sessionToken = authHeader.substring(7);
    const user = await validateUserSession(sessionToken);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid session' }) };

    const body = JSON.parse(event.body || '{}');
    const { title, description, date, endDate, color = 'green', allDay = true, reminderDays = 7 } = body;

    if (!title || !date) return { statusCode: 400, headers, body: JSON.stringify({ error: 'title y date son requeridos' }) };

    // Fetch OAuth tokens from Supabase
    const supabase = getSupabaseAdmin();
    const { data: tokenRow } = await supabase
      .from('oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google_calendar')
      .single();

    if (!tokenRow) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Google Calendar no conectado', needs_connect: true }) };

    let accessToken = tokenRow.access_token;
    if (new Date(tokenRow.expires_at) < new Date()) {
      const refreshed = await refreshGoogleToken(tokenRow.refresh_token);
      accessToken = refreshed.access_token;
      await supabase.from('oauth_tokens').update({
        access_token: refreshed.access_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      }).eq('user_id', user.id).eq('provider', 'google_calendar');
    }

    // Build Google Calendar event
    const colorId = COLOR_MAP[color] || '10';
    const gcEvent = {
      summary: title,
      description: description || '',
      colorId,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: reminderDays * 24 * 60 },
          { method: 'popup', minutes: reminderDays * 24 * 60 }
        ]
      }
    };

    if (allDay) {
      gcEvent.start = { date };
      gcEvent.end = { date: endDate || date };
    } else {
      gcEvent.start = { dateTime: date, timeZone: 'America/Santiago' };
      gcEvent.end = { dateTime: endDate || date, timeZone: 'America/Santiago' };
    }

    const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(gcEvent)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Google Calendar create error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Error al crear evento en Google Calendar', detail: err }) };
    }

    const created = await res.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, event_id: created.id, link: created.htmlLink })
    };

  } catch (err) {
    console.error('calendar-create-event error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
