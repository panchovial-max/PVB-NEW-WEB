// brief-parse.js — Parsea un brief libre con IA y extrae datos estructurados de proyecto
// Usado por studio.html tab "Crear con IA" — OpenAI gpt-5.5 Responses API

import OpenAI from 'openai';
import { createHmac } from 'crypto';

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (payload.expires < Date.now()) return false;
    const secret = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const expected = createHmac('sha256', secret).update(`brain:${payload.expires}`).digest('hex');
    return payload.sig === expected;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token || !verifyToken(token)) return res.status(401).json({ error: 'No autorizado' });

  const { brief } = req.body || {};
  if (!brief?.trim()) return res.status(400).json({ error: 'Falta el brief' });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.responses.create({
      model: 'gpt-5.5',
      input: `Eres el asistente de proyectos de PVB Estudio Creativo, una agencia audiovisual en Chile.

El usuario escribió este brief de proyecto:
"${brief}"

Extrae los datos y responde SOLO en JSON válido, sin texto extra:
{
  "nombre": "nombre corto del proyecto (máx 50 chars)",
  "cliente": "nombre del cliente o empresa",
  "tipos": ["Video", "Foto", "Branding", "Web", "Social Media", "Print"],
  "presupuesto": 0,
  "estado": "Brief",
  "notas": "resumen de los deliverables y fecha si se mencionan"
}

Reglas:
- tipos: array con los que apliquen de esta lista exacta: ["Video", "Foto", "Branding", "Web", "Social Media", "Print"]
- presupuesto: número en CLP (sin puntos ni comas), 0 si no se menciona
- estado: siempre "Brief" si no se especifica otra etapa
- notas: máx 200 chars, resumen útil del scope`
    });

    const text = response.output_text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ ok: false, error: 'No pude parsear el brief' });

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ ok: true, ...parsed });

  } catch (err) {
    console.error('brief-parse error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
