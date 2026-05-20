// telegram-provee.js — Bot @pvb_provee para proveedores
// Notifica a Pancho cuando un proveedor se registra o interactúa
import { createClient } from '@supabase/supabase-js';

function escapeMarkdown(text) {
  return String(text || '').replace(/[_*`[]/g, '\\$&');
}

async function sendMessage(chatId, text) {
  const token = process.env.TELEGRAM_PROVEE_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
  });
  const data = await res.json();
  if (!data.ok) console.error('❌ pvb_provee error:', data.description);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('PVB Provee Bot OK');

  try {
    const update = req.body;
    const message = update.message || update.edited_message;
    if (!message?.text) return res.status(200).send('ok');

    const chatId = message.chat.id;
    const text = message.text.trim();
    const ownerChatId = process.env.TELEGRAM_CHAT_ID;

    if (text.startsWith('/')) {
      const command = text.split(' ')[0].split('@')[0];

      if (command === '/start') {
        await sendMessage(chatId,
          `👋 Hola, soy el bot de *PVB Estudio Creativo*.\n\nEste canal es para proveedores del estudio.\n\nSi tienes preguntas, escríbenos a info@panchovial.com`
        );
        // Notificar a Pancho
        if (ownerChatId && chatId !== parseInt(ownerChatId)) {
          await sendMessage(ownerChatId,
            `🔔 *Nuevo proveedor en bot*\n\n👤 ${escapeMarkdown(message.from?.first_name || 'Sin nombre')} ${escapeMarkdown(message.from?.last_name || '')}\n📱 @${escapeMarkdown(message.from?.username || 'sin username')}\n🆔 chat_id: ${chatId}`
          );
        }
      } else if (command === '/ping') {
        await sendMessage(chatId, '✅ Bot activo.');
      } else {
        await sendMessage(chatId, 'Para consultas escríbenos a info@panchovial.com');
      }
    } else {
      // Mensaje libre — reenviar a Pancho
      if (ownerChatId && chatId !== parseInt(ownerChatId)) {
        const nombre = `${message.from?.first_name || ''} ${message.from?.last_name || ''}`.trim();
        await sendMessage(ownerChatId,
          `📩 *Mensaje de proveedor*\n👤 ${escapeMarkdown(nombre)} (@${escapeMarkdown(message.from?.username || 'sin username')})\n\n${escapeMarkdown(text)}`
        );
        await sendMessage(chatId, 'Gracias, recibimos tu mensaje. Te contactaremos pronto.');
      }
    }

    return res.status(200).send('ok');
  } catch (err) {
    console.error('telegram-provee error:', err);
    return res.status(200).send('ok');
  }
}
