// Brief Parse — Netlify Function
// Uses Claude to extract project data from free-text brief
// POST /.netlify/functions/brief-parse

import { validateAnyToken } from './utils/auth.js';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{"error":"Method not allowed"}' };

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const auth = await validateAnyToken(authHeader);
  if (!auth) return { statusCode: 401, headers, body: '{"error":"Unauthorized"}' };

  if (!ANTHROPIC_KEY) return { statusCode: 500, headers, body: '{"error":"ANTHROPIC_API_KEY not configured"}' };

  try {
    const { brief } = JSON.parse(event.body);
    if (!brief?.trim()) return { statusCode: 400, headers, body: '{"error":"Brief vacío"}' };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Eres un asistente de producción audiovisual. Extrae la información de este brief de proyecto. Responde SOLO con un JSON válido, sin markdown ni texto extra:

{
  "nombre": "nombre corto del proyecto (max 50 chars)",
  "cliente": "nombre del cliente o marca",
  "tipos": ["Video", "Foto", "Branding", "Web", "Social Media", "Print"],
  "presupuesto": 0,
  "estado": "Brief",
  "notas": "resumen del brief con los detalles clave (max 200 chars)"
}

Reglas:
- "tipos" solo puede contener: "Video", "Foto", "Branding", "Web", "Social Media", "Print"
- "presupuesto" en CLP. Si dice "2 palos" = 2000000, "500 lucas" = 500000, "2M" = 2000000
- Si no menciona presupuesto, pon 0
- Si no menciona cliente, pon "Por definir"
- "estado" siempre "Brief" a menos que diga que ya empezó

Brief:
${brief}`
        }]
      })
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else return { statusCode: 500, headers, body: JSON.stringify({ error: 'No se pudo parsear la respuesta de IA' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ...parsed }) };

  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
