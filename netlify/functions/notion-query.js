// notion-query.js — Consultas a Notion para el bot de Telegram y agentes PVB
// Actualizado con Notion Developer Platform 2026 (Markdown API, nuevos endpoints)

const NOTION_VERSION = '2022-06-28';

export const DB = {
  boletas:       '3337ab7f-975e-81e2-a15d-fb2e6071f1bf',
  proyectos:     '3337ab7f-975e-81b4-8045-d33fe1515aca',
  assets:        '3337ab7f-975e-8132-9caf-dad72d6a9233',
  suscripciones: '3337ab7f-975e-8151-95e0-ca9568b29bcb',
  entregas:      '3337ab7f-975e-812c-a0ed-e6af65288d67',
};

function notionHeaders(apiKey, extra = {}) {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
    ...extra
  };
}

// ─── Proyectos ───

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

export async function getTodosProyectos(apiKey) {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB.proyectos}/query`, {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      sorts: [{ property: 'Fecha Entrega', direction: 'descending' }],
      page_size: 25
    })
  });
  return res.json();
}

export async function createProyecto(apiKey, { nombre, cliente, tipo, presupuesto, fechaEntrega, notas }) {
  const properties = {
    'Nombre': { title: [{ text: { content: nombre } }] },
    'Cliente': { rich_text: [{ text: { content: cliente || '' } }] },
    'Estado': { select: { name: 'Brief' } },
  };
  if (tipo) properties['Tipo'] = { multi_select: [{ name: tipo }] };
  if (presupuesto) properties['Presupuesto CLP'] = { number: parseInt(presupuesto) };
  if (fechaEntrega) properties['Fecha Entrega'] = { date: { start: fechaEntrega } };
  if (notas) properties['Notas'] = { rich_text: [{ text: { content: notas } }] };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({ parent: { database_id: DB.proyectos }, properties })
  });
  return res.json();
}

export async function updateProyectoEstado(apiKey, pageId, estado) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({ properties: { 'Estado': { select: { name: estado } } } })
  });
  return res.json();
}

export async function updateProyecto(apiKey, pageId, updates) {
  const properties = {};
  if (updates.estado) properties['Estado'] = { select: { name: updates.estado } };
  if (updates.cliente) properties['Cliente'] = { rich_text: [{ text: { content: updates.cliente } }] };
  if (updates.presupuesto) properties['Presupuesto CLP'] = { number: parseInt(updates.presupuesto) };
  if (updates.fechaEntrega) properties['Fecha Entrega'] = { date: { start: updates.fechaEntrega } };
  if (updates.notas) properties['Notas'] = { rich_text: [{ text: { content: updates.notas } }] };

  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({ properties })
  });
  return res.json();
}

// ─── Notas y contenido (Markdown API) ───

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

export async function getPageContent(apiKey, pageId) {
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=50`, {
    headers: notionHeaders(apiKey)
  });
  return res.json();
}

export async function getPage(apiKey, pageId) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: notionHeaders(apiKey)
  });
  return res.json();
}

// ─── Boletas y finanzas ───

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
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const res = await fetch(`https://api.notion.com/v1/databases/${DB.boletas}/query`, {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      filter: {
        and: [
          { property: 'Estado', select: { equals: 'Procesada' } },
          { property: 'Fecha', date: { on_or_after: startOfMonth } }
        ]
      },
      page_size: 50
    })
  });
  return res.json();
}

export async function createBoleta(apiKey, { descripcion, monto, tipo, categoria, fecha, proyectoId }) {
  const properties = {
    'Descripcion': { title: [{ text: { content: descripcion } }] },
    'Estado': { select: { name: 'Pendiente' } },
  };
  if (monto) properties['Monto CLP'] = { number: parseInt(monto) };
  if (tipo) properties['Tipo Documento'] = { select: { name: tipo } };
  if (categoria) properties['Categoria'] = { select: { name: categoria } };
  if (fecha) properties['Fecha'] = { date: { start: fecha } };
  if (proyectoId) properties['Proyecto'] = { relation: [{ id: proyectoId }] };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({ parent: { database_id: DB.boletas }, properties })
  });
  return res.json();
}

// ─── Entregas ───

export async function getEntregasPendientes(apiKey) {
  const res = await fetch(`https://api.notion.com/v1/databases/${DB.entregas}/query`, {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 10
    })
  });
  return res.json();
}

// ─── Webhooks (registro programático) ───

export async function registerWebhook(apiKey, { url, databaseId, events }) {
  const res = await fetch('https://api.notion.com/v1/webhooks', {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      url,
      parent: { type: 'database_id', database_id: databaseId },
      event_types: events || ['page.created', 'page.updated']
    })
  });
  return res.json();
}

export async function listWebhooks(apiKey) {
  const res = await fetch('https://api.notion.com/v1/webhooks', {
    headers: notionHeaders(apiKey)
  });
  return res.json();
}

// ─── Search ───

export async function searchNotion(apiKey, query, filter = {}) {
  const res = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: notionHeaders(apiKey),
    body: JSON.stringify({
      query,
      filter,
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: 10
    })
  });
  return res.json();
}
