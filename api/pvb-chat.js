// pvb-chat.js — Chat general PVB con OpenAI gpt-5.5
// Asistente conversacional para studio.html (futuro tab "Chat")
// Contexto: PVB Estudio Creativo — proyectos, finanzas, estrategia

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

const PVB_SYSTEM = `Eres el asistente principal de PVB Estudio Creativo, una agencia audiovisual en Santiago, Chile.

PVB produce contenido audiovisual, fotografía, branding y social media para marcas. Clientes activos: Refugio Chiloé, Kaya Unite, Romerelli.

Ayudas con:
- Gestión de proyectos (etapas: Brief → Pre-producción → Producción → Post-producción → Entrega)
- Finanzas y presupuestos en CLP
- Estrategia de contenido y redes sociales
- Coordinación de equipo y proveedores
- Redacción de propuestas y contratos

Estilo: directo, profesional, en español chileno. Sin floro. Máximo 3-4 párrafos por respuesta salvo que se pida más detalle.`;

// Historial en memoria por sesión (se pierde al reiniciar — suficiente para una sesión de trabajo)
const sessions = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  if (!token || !verifyToken(token)) return res.status(401).json({ error: 'No autorizado' });

  const { message, session_id = 'default', clear = false } = req.body || {};

  if (clear) {
    delete sessions[session_id];
    return res.status(200).json({ ok: true, message: 'Historial borrado' });
  }

  if (!message?.trim()) return res.status(400).json({ error: 'Falta message' });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (!sessions[session_id]) sessions[session_id] = [];
    sessions[session_id].push({ role: 'user', content: message });
    // Mantener últimos 20 mensajes
    if (sessions[session_id].length > 20) sessions[session_id] = sessions[session_id].slice(-20);

    const response = await client.responses.create({
      model: 'gpt-5.5',
      instructions: PVB_SYSTEM,
      input: sessions[session_id]
    });

    const reply = response.output_text;
    sessions[session_id].push({ role: 'assistant', content: reply });

    return res.status(200).json({
      ok: true,
      reply,
      session_id,
      turns: sessions[session_id].length / 2
    });

  } catch (err) {
    console.error('pvb-chat error:', err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
