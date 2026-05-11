// notion-query.js — Consultas a Notion para el bot de Telegram
// Reutilizable desde telegram-bot.js y otros servicios internos

const NOTION_VERSION = '2022-06-28';

const DB = {
  boletas:      '3337ab7f-975e-81e2-a15d-fb2e6071f1bf',
  proyectos:    '3337ab7f-975e-81b4-8045-d33fe1515aca',
  assets:       '3337ab7f-975e-8132-9caf-dad72d6a9233',
  suscripciones:'3337ab7f-975e-8151-95e0-ca9568b29bcb',
  entregas:     '3337ab7f-975e-812c-a0ed-e6af65288d67',
};

function notionHeaders(apiKey) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json'
  };
}

export async function getProyectosActivos(apiKey) {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB.proyectos}/query`, {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      filter: {
        or: [
          { property: 'Estado', select: { equals: 'Brief' } },
          { property: 'Estado', select: { equals: 'Pre-produccion' } },
          { property: 'Estado', select: { equals: 'Produccion' } },
          { property: 'Estado', select: { equals: 'Post-produccion' } },
        ]
      },
      sorts: [{ property: 'Fecha Entrega', direction: 'ascending' }],
      page_size: 10
    })
  });
  return res.json();
}

export async function getBoletasPendientes(apiKey) {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB.boletas}/query`, {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      filter: { property: 'Estado', select: { equals: 'Pendiente' } },
      sorts: [{ property: 'Fecha', direction: 'descending' }],
      page_size: 10
    })
  });
  return res.json();
}

export async function getResumenFinanciero(apiKey) {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB.boletas}/query`, {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      filter: {
        and: [
          { property: 'Estado', select: { equals: 'Procesada' } },
          {
            property: 'Fecha',
            date: { on_or_after: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] }
          }
        ]
      },
      page_size: 50
    })
  });
  return res.json();
}

export async function createProyecto(apiKey, { nombre, cliente, tipo, presupuesto, fechaEntrega }) {
  const properties = {
    'Nombre': { title: [{ text: { content: nombre } }] },
    'Cliente': { rich_text: [{ text: { content: cliente || '' } }] },
    'Estado': { select: { name: 'Brief' } },
  };
  if (tipo) properties['Tipo'] = { multi_select: [{ name: tipo }] };
  if (presupuesto) properties['Presupuesto CLP'] = { number: parseInt(presupuesto) };
  if (fechaEntrega) properties['Fecha Entrega'] = { date: { start: fechaEntrega } };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      parent: { database_id: DB.proyectos },
      properties
    })
  });
  return res.json();
}

export async function updateProyectoEstado(apiKey, pageId, estado) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      properties: { 'Estado': { select: { name: estado } } }
    })
  });
  return res.json();
}

export async function addNotaProyecto(apiKey, pageId, nota) {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: `[${new Date().toLocaleString('es-CL')}] ${nota}` }
          }]
        }
      }]
    })
  });
  return res.json();
}
