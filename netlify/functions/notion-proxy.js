const NOTION_KEY = process.env.NOTION_API_KEY;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!NOTION_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'NOTION_API_KEY not configured' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { endpoint, payload } = body;

    const allowed = ['/v1/pages', '/v1/databases'];
    const path = endpoint || '/v1/pages';
    if (!allowed.some(a => path.startsWith(a))) {
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
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
