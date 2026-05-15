// POST /api/notion-sync — Sincronización full Notion → Supabase
// Body: {} = todas las DBs | { db: 'boletas' } = solo una

import { createClient } from '@supabase/supabase-js';

const NOTION_KEY   = process.env.NOTION_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const NOTION_VER   = '2022-06-28';

export const DB_IDS = {
  boletas:       '3337ab7f-975e-81e2-a15d-fb2e6071f1bf',
  proyectos:     '3337ab7f-975e-81b4-8045-d33fe1515aca',
  suscripciones: '3337ab7f-975e-8151-95e0-ca9568b29bcb',
  entregas:      '3337ab7f-975e-812c-a0ed-e6af65288d67',
};

const TABLES = {
  boletas:       'notion_boletas',
  proyectos:     'notion_proyectos',
  suscripciones: 'notion_suscripciones',
  entregas:      'notion_entregas',
};

// ── Notion helpers ───────────────────────────────────────────
function notionHeaders() {
  return {
    Authorization: `Bearer ${NOTION_KEY}`,
    'Notion-Version': NOTION_VER,
    'Content-Type': 'application/json',
  };
}

export async function fetchPage(pageId) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: notionHeaders(),
  });
  return res.json();
}

async function fetchAllPages(databaseId) {
  const pages = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: notionHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.results) break;
    pages.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

// ── Extractores de propiedades Notion ───────────────────────
const getText = (page, name) => {
  const p = page.properties?.[name];
  if (!p) return null;
  if (p.type === 'title')     return p.title?.[0]?.plain_text ?? null;
  if (p.type === 'rich_text') return p.rich_text?.[0]?.plain_text ?? null;
  return null;
};
const getSelect      = (page, name) => page.properties?.[name]?.select?.name ?? null;
const getMultiSelect = (page, name) => page.properties?.[name]?.multi_select?.map(o => o.name) ?? [];
const getNumber      = (page, name) => page.properties?.[name]?.number ?? null;
const getDate        = (page, name) => page.properties?.[name]?.date?.start ?? null;
const getCheckbox    = (page, name) => page.properties?.[name]?.checkbox ?? null;
const getRelationId  = (page, name) => page.properties?.[name]?.relation?.[0]?.id ?? null;

// ── Mappers Notion → Supabase ────────────────────────────────
export function mapBoleta(page) {
  return {
    notion_id:          page.id,
    nombre:             getText(page, 'Nombre') ?? getText(page, 'Name'),
    tipo:               getSelect(page, 'Tipo'),
    monto_clp:          getNumber(page, 'Monto CLP') ?? getNumber(page, 'Monto'),
    estado:             getSelect(page, 'Estado'),
    fecha:              getDate(page, 'Fecha'),
    proyecto_notion_id: getRelationId(page, 'Proyecto'),
    proveedor:          getText(page, 'Proveedor'),
    descripcion:        getText(page, 'Descripción') ?? getText(page, 'Descripcion'),
    last_edited_time:   page.last_edited_time,
    synced_at:          new Date().toISOString(),
  };
}

export function mapProyecto(page) {
  return {
    notion_id:        page.id,
    nombre:           getText(page, 'Nombre') ?? getText(page, 'Name'),
    cliente:          getText(page, 'Cliente'),
    tipo:             getMultiSelect(page, 'Tipo'),
    estado:           getSelect(page, 'Estado'),
    presupuesto_clp:  getNumber(page, 'Presupuesto CLP') ?? getNumber(page, 'Presupuesto'),
    fecha_inicio:     getDate(page, 'Fecha Inicio'),
    fecha_entrega:    getDate(page, 'Fecha Entrega'),
    last_edited_time: page.last_edited_time,
    synced_at:        new Date().toISOString(),
  };
}

export function mapSuscripcion(page) {
  return {
    notion_id:        page.id,
    nombre:           getText(page, 'Nombre') ?? getText(page, 'Name'),
    categoria:        getSelect(page, 'Categoría') ?? getSelect(page, 'Categoria'),
    monto_clp:        getNumber(page, 'Monto CLP') ?? getNumber(page, 'Monto'),
    frecuencia:       getSelect(page, 'Frecuencia'),
    activa:           getCheckbox(page, 'Activa') ?? true,
    fecha_renovacion: getDate(page, 'Fecha Renovación') ?? getDate(page, 'Fecha Renovacion'),
    last_edited_time: page.last_edited_time,
    synced_at:        new Date().toISOString(),
  };
}

export function mapEntrega(page) {
  return {
    notion_id:          page.id,
    titulo:             getText(page, 'Título') ?? getText(page, 'Titulo') ?? getText(page, 'Name'),
    estado:             getSelect(page, 'Estado'),
    proyecto_notion_id: getRelationId(page, 'Proyecto'),
    deadline:           getDate(page, 'Deadline') ?? getDate(page, 'Fecha Límite'),
    prioridad:          getSelect(page, 'Prioridad'),
    last_edited_time:   page.last_edited_time,
    synced_at:          new Date().toISOString(),
  };
}

const MAPPERS = { boletas: mapBoleta, proyectos: mapProyecto, suscripciones: mapSuscripcion, entregas: mapEntrega };

// Detecta a qué DB pertenece una página por su parent database_id
export function detectDbName(page) {
  const parentId = page.parent?.database_id?.replace(/-/g, '');
  for (const [name, id] of Object.entries(DB_IDS)) {
    if (id.replace(/-/g, '') === parentId) return name;
  }
  return null;
}

// Upsert de una sola página (usado por notion-webhook.js)
export async function upsertPage(supabase, dbName, page) {
  const mapper = MAPPERS[dbName];
  const table  = TABLES[dbName];
  if (!mapper || !table) return;
  const row = mapper(page);
  const { error } = await supabase.from(table).upsert(row, { onConflict: 'notion_id' });
  if (error) throw error;
  return row;
}

// ── Handler Vercel ───────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_BASE_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // Auth básica: solo desde el dashboard interno
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token || token !== process.env.STUDIO_SECRET)
    return res.status(401).json({ error: 'Unauthorized' });

  if (!NOTION_KEY || !SUPABASE_URL || !SUPABASE_KEY)
    return res.status(500).json({ error: 'Missing env vars' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { db: targetDb } = req.body || {};
  const targets = targetDb && TABLES[targetDb] ? [targetDb] : Object.keys(DB_IDS);
  const results = {};

  for (const dbName of targets) {
    try {
      const pages = await fetchAllPages(DB_IDS[dbName]);
      const rows  = pages.map(MAPPERS[dbName]);

      if (rows.length > 0) {
        const { error } = await supabase
          .from(TABLES[dbName])
          .upsert(rows, { onConflict: 'notion_id' });
        if (error) throw error;
      }

      results[dbName] = { ok: true, synced: rows.length };
      await supabase.from('notion_sync_log').insert({
        db_name: dbName, trigger: 'full_sync', pages_synced: rows.length, status: 'ok',
      });
    } catch (err) {
      results[dbName] = { ok: false, error: err.message };
      await supabase.from('notion_sync_log').insert({
        db_name: dbName, trigger: 'full_sync', status: 'error', error: err.message,
      });
    }
  }

  return res.status(200).json({ results });
}
