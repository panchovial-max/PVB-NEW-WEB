// bot-router.js — Router unificado para todos los bots de PVB
// Detecta qué bot recibió el mensaje por el secret path y delega

import { handleTasksMessage } from '../lib/tasks-bot.js';
import { handleFinancesMessage } from '../lib/finances-bot.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  // El webhook se registra como /api/bot-router/tasks o /api/bot-router/finances
  const path = req.url || '';

  if (path.includes('tasks')) return handleTasksMessage(req, res);
  if (path.includes('finances')) return handleFinancesMessage(req, res);

  return res.status(200).json({ ok: true });
}
