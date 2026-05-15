#!/usr/bin/env node
// Registra el webhook de Notion apuntando al endpoint Vercel
// Uso: NOTION_API_KEY=xxx node scripts/register-notion-webhook.js

const NOTION_KEY   = process.env.NOTION_API_KEY;
const WEBHOOK_URL  = 'https://panchovial.com/api/notion-webhook';

if (!NOTION_KEY) {
  console.error('❌  Falta NOTION_API_KEY');
  process.exit(1);
}

const DB_IDS = [
  '3337ab7f-975e-81e2-a15d-fb2e6071f1bf', // boletas
  '3337ab7f-975e-81b4-8045-d33fe1515aca', // proyectos
  '3337ab7f-975e-8151-95e0-ca9568b29bcb', // suscripciones
  '3337ab7f-975e-812c-a0ed-e6af65288d67', // entregas
];

async function registerWebhook() {
  const res = await fetch('https://api.notion.com/v1/webhooks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      event_types: [
        'page.created',
        'page.updated',
        'page.deleted',
      ],
      // Filtra solo las DBs relevantes
      filters: DB_IDS.map(id => ({
        property: 'parent',
        value: { type: 'database_id', id },
      })),
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('❌  Error registrando webhook:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✅  Webhook registrado:');
  console.log('   ID:     ', data.id);
  console.log('   Secret: ', data.secret);
  console.log('');
  console.log('👉  Agrega este secret como env var en Netlify:');
  console.log('   NOTION_WEBHOOK_SECRET =', data.secret);
}

registerWebhook().catch(console.error);
