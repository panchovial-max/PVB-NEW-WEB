// register-notion-webhooks.js
// Registra webhooks de Notion → Netlify para las bases de datos PVB
// Uso: NOTION_API_KEY=xxx node scripts/register-notion-webhooks.js

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const WEBHOOK_URL = 'https://panchovial.com/.netlify/functions/notion-webhook';
const NOTION_VERSION = '2022-06-28';

const DATABASES = [
  { name: 'Proyectos',       id: '3337ab7f-975e-81b4-8045-d33fe1515aca' },
  { name: 'Boletas y Gastos', id: '3337ab7f-975e-81e2-a15d-fb2e6071f1bf' },
  { name: 'Entregas',        id: '3337ab7f-975e-812c-a0ed-e6af65288d67' },
];

const EVENTS = ['page.created', 'page.updated', 'page.deleted'];

async function registerWebhook(db) {
  const res = await fetch('https://api.notion.com/v1/automations/webhooks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      parent: { type: 'database_id', database_id: db.id },
      event_types: EVENTS
    })
  });

  const data = await res.json();
  if (data.id) {
    console.log(`✅ ${db.name} → webhook registrado`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Secret: ${data.secret || '(ver Notion Dashboard)'}`);
  } else {
    console.log(`❌ ${db.name} → error:`, data.message || JSON.stringify(data));
  }
  return data;
}

async function listWebhooks() {
  const res = await fetch('https://api.notion.com/v1/automations/webhooks', {
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': NOTION_VERSION
    }
  });
  const data = await res.json();
  console.log('\n📋 Webhooks existentes:', JSON.stringify(data, null, 2));
}

if (!NOTION_API_KEY) {
  console.error('❌ Falta NOTION_API_KEY. Uso: NOTION_API_KEY=xxx node scripts/register-notion-webhooks.js');
  process.exit(1);
}

console.log('🔗 Registrando webhooks Notion → Netlify...\n');
console.log(`URL destino: ${WEBHOOK_URL}\n`);

for (const db of DATABASES) {
  await registerWebhook(db);
}

console.log('\n✅ Listo. Copia los secrets y agrégalos como NOTION_WEBHOOK_SECRET en Netlify.');
