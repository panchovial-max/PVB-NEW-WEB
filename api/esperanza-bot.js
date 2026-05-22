// esperanza-bot.js — Agente de ventas PVB para captación de clientes
// Flujo conversacional para invitar prospects a dejar sus datos

const ONBOARDING_URL = 'https://panchovial.com/client-onboarding';
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Estado de conversación por chat
const conversations = {};

function escapeMarkdown(text) {
  return String(text || '').replace(/[_*`[]/g, '\\$&');
}

async function sendMessage(chatId, text, telegramApi, keyboard = null) {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown'
  };
  if (keyboard) {
    body.reply_markup = {
      inline_keyboard: keyboard
    };
  }
  const res = await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function notifyOwner(telegramApi, prospect) {
  if (!OWNER_CHAT_ID) return;
  const msg = `🌟 *Nuevo prospecto — Esperanza*\n\n` +
    `👤 ${escapeMarkdown(prospect.name || 'Sin nombre')}\n` +
    `📱 @${escapeMarkdown(prospect.username || 'sin username')}\n` +
    `🎯 Interés: ${escapeMarkdown(prospect.interest || 'No especificado')}\n` +
    `📅 ${new Date().toLocaleString('es-CL')}\n\n` +
    `_Dejó sus datos en el portal_\n` +
    `[Ver en portal](${ONBOARDING_URL})`;

  await fetch(`${telegramApi}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: OWNER_CHAT_ID,
      text: msg,
      parse_mode: 'Markdown'
    })
  });
}

export async function handleEsperanzaCommand(chatId, command, telegramApi) {
  if (command === '/esperanza' || command === '/start_esperanza') {
    await startConversation(chatId, telegramApi);
    return true;
  }
  return false;
}

export async function handleEsperanza(chatId, text, from, telegramApi) {
  const state = conversations[chatId] || { step: 'idle' };

  // Iniciar si menciona trabajo, cotización, proyecto
  const triggers = ['hola', 'cotiz', 'proyecto', 'video', 'foto', 'social', 'web', 'marketing', 'ads', 'precio', 'info'];
  const lower = text.toLowerCase();
  const isTrigger = triggers.some(t => lower.includes(t));

  if (state.step === 'idle' && isTrigger) {
    await startConversation(chatId, telegramApi, from);
    return true;
  }

  if (state.step === 'waiting_interest') {
    conversations[chatId] = { ...state, interest: text, step: 'waiting_decision' };
    await sendMessage(chatId,
      `Perfecto 🙌\n\n` +
      `PVB trabaja con marcas que quieren contenido que vende — no solo que se ve bonito.\n\n` +
      `¿Tienes un proyecto puntual ahora o quieres que te contactemos cuando estés listo?`,
      telegramApi,
      [
        [{ text: '🔥 Tengo un proyecto ahora', callback_data: 'esp_now' }],
        [{ text: '📋 Quiero dejar mis datos para después', callback_data: 'esp_later' }]
      ]
    );
    return true;
  }

  return false;
}

export async function handleEsperanzaCallback(chatId, data, from, telegramApi) {
  const state = conversations[chatId] || {};

  if (data === 'esp_service_video') {
    conversations[chatId] = { ...state, interest: 'Producción de video / foto', step: 'waiting_decision' };
    await handleInterestSelected(chatId, 'Producción de video / foto', telegramApi);
    return true;
  }
  if (data === 'esp_service_social') {
    conversations[chatId] = { ...state, interest: 'Social media y contenido', step: 'waiting_decision' };
    await handleInterestSelected(chatId, 'Social media y contenido', telegramApi);
    return true;
  }
  if (data === 'esp_service_ads') {
    conversations[chatId] = { ...state, interest: 'Ads pagados (Meta, Google)', step: 'waiting_decision' };
    await handleInterestSelected(chatId, 'Ads pagados', telegramApi);
    return true;
  }
  if (data === 'esp_service_web') {
    conversations[chatId] = { ...state, interest: 'Web y marketing digital', step: 'waiting_decision' };
    await handleInterestSelected(chatId, 'Web y marketing digital', telegramApi);
    return true;
  }
  if (data === 'esp_service_other') {
    conversations[chatId] = { ...state, step: 'waiting_interest' };
    await sendMessage(chatId, '¿Qué tienes en mente? Cuéntame brevemente.', telegramApi);
    return true;
  }

  if (data === 'esp_now') {
    conversations[chatId] = { ...state, step: 'done' };
    await sendMessage(chatId,
      `Excelente 🎬\n\n` +
      `Deja tu info aquí y Pancho te contacta personalmente:\n\n` +
      `👉 ${ONBOARDING_URL}\n\n` +
      `_Toma menos de 2 minutos y nos ayuda a preparar una propuesta a tu medida._`,
      telegramApi
    );
    await notifyOwner(telegramApi, {
      name: `${from?.first_name || ''} ${from?.last_name || ''}`.trim(),
      username: from?.username,
      interest: state.interest || 'Proyecto inmediato'
    });
    return true;
  }

  if (data === 'esp_later') {
    conversations[chatId] = { ...state, step: 'done' };
    await sendMessage(chatId,
      `Perfecto, no hay apuro 😊\n\n` +
      `Deja tus datos y te contactamos cuando sea el momento:\n\n` +
      `👉 ${ONBOARDING_URL}\n\n` +
      `_Solo toma 2 minutos. Así sabemos cómo ayudarte mejor._`,
      telegramApi
    );
    await notifyOwner(telegramApi, {
      name: `${from?.first_name || ''} ${from?.last_name || ''}`.trim(),
      username: from?.username,
      interest: state.interest || 'Para después'
    });
    return true;
  }

  return false;
}

async function startConversation(chatId, telegramApi, from) {
  const name = from?.first_name ? `, ${from.first_name}` : '';
  conversations[chatId] = { step: 'waiting_service' };

  await sendMessage(chatId,
    `Hola${escapeMarkdown(name)} 👋 Soy Esperanza de *PVB Estudio Creativo*.\n\n` +
    `Somos una productora audiovisual y agencia de marketing en Santiago.\n\n` +
    `¿En qué área te podemos ayudar?`,
    telegramApi,
    [
      [{ text: '🎬 Video / Fotografía', callback_data: 'esp_service_video' }],
      [{ text: '📱 Social Media', callback_data: 'esp_service_social' }],
      [{ text: '📣 Ads pagados', callback_data: 'esp_service_ads' }],
      [{ text: '🌐 Web / Marketing', callback_data: 'esp_service_web' }],
      [{ text: '💬 Otro', callback_data: 'esp_service_other' }]
    ]
  );
}

async function handleInterestSelected(chatId, interest, telegramApi) {
  await sendMessage(chatId,
    `*${escapeMarkdown(interest)}* — buena elección.\n\n` +
    `PVB trabaja con marcas que quieren contenido que vende.\n\n` +
    `¿Tienes un proyecto puntual ahora o prefieres dejar tus datos para cuando estés listo?`,
    telegramApi,
    [
      [{ text: '🔥 Tengo un proyecto ahora', callback_data: 'esp_now' }],
      [{ text: '📋 Dejar datos para después', callback_data: 'esp_later' }]
    ]
  );
}
