// bot-router.js — Router unificado para todos los bots de PVB
// Detecta qué bot recibió el mensaje por el secret path y delega

import { handleTasksMessage } from '../lib/tasks-bot.js';
import { handleFinancesMessage } from '../lib/finances-bot.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  // req.url puede ser /api/bot-router/tasks, /api/bot-router.js?path=tasks, etc.
  // También revisamos headers y query params por seguridad
  const fullUrl = (req.url || '') + JSON.stringify(req.query || {});
  const slug = req.query?.path || req.query?.bot || '';

  const isTasks    = fullUrl.includes('tasks')    || slug.includes('tasks');
  const isFinances = fullUrl.includes('finances') || slug.includes('finances');

  if (isTasks)    return handleTasksMessage(req, res);
  if (isFinances) return handleFinancesMessage(req, res);

  // Fallback: si llega sin path reconocible pero hay mensaje de Telegram, asumimos tasks
  if (req.body?.message) return handleTasksMessage(req, res);

  return res.status(200).json({ ok: true });
}
