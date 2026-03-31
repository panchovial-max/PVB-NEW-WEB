import { validateUserSession } from './utils/supabase.js';

const NOTION_KEY = process.env.NOTION_API_KEY;
const DB_BOLETAS = '3337ab7f-975e-81e2-a15d-fb2e6071f1bf';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.BASE_URL || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Auth check
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization token' }) };
  }
  const user = await validateUserSession(authHeader.substring(7));
  if (!user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid or expired session' }) };
  }

  if (!NOTION_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'NOTION_API_KEY not configured' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { endpoint, payload } = body;

    // Strict allowlist: only specific endpoints
    const allowed = ['/v1/pages', `/v1/databases/${DB_BOLETAS}/query`];
    const path = endpoint || '/v1/pages';
    if (!allowed.includes(path)) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Endpoint not allowed' }) };
    }

    const res = await fetch(`https://api.notion.com${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return { statusCode: res.status, headers, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
