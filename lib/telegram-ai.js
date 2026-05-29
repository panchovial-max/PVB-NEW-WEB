// telegram-ai.js — Cerebro IA del bot PVB
// Recibe mensajes libres desde telegram-bot.js y responde con Claude
// Tiene herramientas: Notion, Drive, fetch de URLs, lectura de páginas Notion

// Drop-in adapter: usa Gemini default, Groq fallback. Mantiene interfaz Anthropic.
import Anthropic from './llm-client.js';
import { createClient } from '@supabase/supabase-js';
import { uploadFromUrl } from './google-drive.js';
import {
  getProyectosActivos,
  getTodosProyectos,
  getBoletasPendientes,
  getResumenFinanciero,
  getEntregasPendientes,
  createProyecto,
  updateProyecto,
  addNotaProyecto,
  createBoleta,
  searchNotion,
  getPage,
  getPageContent
} from './notion-query.js';

// ─── Constantes ───

const HISTORY_LIMIT = 20; // mensajes máximos en contexto
const HISTORY_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas — después se reinicia

// ─── Supabase (para persistir historial) ───

function getSB() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function loadHistory(chatId) {
  try {
    const sb = getSB();
    const { data } = await sb
      .from('telegram_ai_history')
      .select('messages, updated_at')
      .eq('chat_id', String(chatId))
      .single();
    if (!data) return [];
    // Expirar historial si lleva más de TTL sin actividad
    if (Date.now() - new Date(data.updated_at).getTime() > HISTORY_TTL_MS) return [];
    return data.messages || [];
  } catch {
    return [];
  }
}

async function saveHistory(chatId, messages) {
  try {
    const sb = getSB();
    await sb.from('telegram_ai_history').upsert(
      { chat_id: String(chatId), messages: messages.slice(-HISTORY_LIMIT), updated_at: new Date().toISOString() },
      { onConflict: 'chat_id' }
    );
  } catch (e) {
    console.error('saveHistory error:', e.message);
  }
}

// ─── System Prompt ───

const SYSTEM_PROMPT = `Eres el asistente de IA de PVB Estudio Creativo, una productora audiovisual y agencia de marketing en Santiago, Chile. Solo atiendes a Francisco Vial Brown (Pancho), el fundador.

IDIOMA OBLIGATORIO: SIEMPRE responde en español. Nunca cambies al inglés. Sin excepciones.

SCOPE ESTRICTO — Solo respondes sobre:
- Proyectos PVB (producción audiovisual, social media, pauta digital, web, branding)
- Finanzas y boletas de la agencia
- Estrategia de marketing y contenido para clientes actuales
- Copies, briefs, fichas, propuestas, calendarios de contenido
- Consultas sobre Notion, proyectos, entregas, clientes

FUERA DE SCOPE — Declinas amablemente:
- Legal, contratos, asesoría jurídica → "Eso escapa de mi área. Para temas legales, consulta con un abogado."
- Temas médicos, salud, psicología
- Tecnología ajena a PVB
- Política, religión, opiniones personales

Proyectos activos:
- Refugio Chiloé: rebranding + contenido visual para venta de terrenos ($2.200.000 + IVA). Video documental, lifestyle, drone, web inmersiva. Contexto: Puente Chacao al 65%, inaugura 2028, plusvalía garantizada.
- Kaya Unite: campaña Invierno 2026 "Everyday is Culture" — entregado ✅

Capacidades reales (SOLO promete lo que puedes hacer con tus herramientas):
- Leer páginas de Notion por URL o ID → usa notion_get_page
- Buscar en Notion → usa notion_search
- Ver proyectos, boletas, entregas → usa herramientas específicas
- Crear/actualizar proyectos y boletas en Notion
- Agregar notas a proyectos
- Guardar archivos en Google Drive desde URL → usa drive_save_file
- Leer URLs externas y páginas web → usa web_fetch

HONESTIDAD: Si no tienes una herramienta para hacer algo, dilo directamente. No digas "lo investigaré" a menos que vayas a usar una herramienta ahora mismo. Muestra el resultado inmediatamente, no prometas resultados futuros.

Estilo:
- Directo, en español chileno
- Telegram: máximo 3-4 párrafos
- Markdown cuando ayude a la legibilidad
- Variantes enumeradas claramente
- Muestra los datos reales, no solo confirma que los obtuviste`;

// ─── Herramientas ───

const TOOLS = [
  {
    name: 'notion_get_proyectos',
    description: 'Obtiene proyectos activos (Brief, Pre-produccion, Produccion, Post-produccion) desde Notion',
    input_schema: { type: 'object', properties: { todos: { type: 'boolean', description: 'Si true, trae todos incluyendo Entregado y Archivado' } }, required: [] }
  },
  {
    name: 'notion_get_boletas',
    description: 'Obtiene boletas/facturas pendientes desde Notion',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'notion_resumen_financiero',
    description: 'Obtiene resumen financiero del mes actual desde Notion',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'notion_get_entregas',
    description: 'Obtiene entregas pendientes desde Notion',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'notion_search',
    description: 'Busca páginas o bases de datos en Notion por texto',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Texto a buscar' } },
      required: ['query']
    }
  },
  {
    name: 'notion_get_page',
    description: 'Lee el contenido completo de una página de Notion. Acepta URL completa (notion.so/...) o un ID de página. Úsalo cuando Pancho comparta un link de Notion o pida ver el contenido de una página.',
    input_schema: {
      type: 'object',
      properties: {
        url_or_id: { type: 'string', description: 'URL completa de Notion (ej: https://notion.so/pvb/...) o ID de página (32 chars hex)' }
      },
      required: ['url_or_id']
    }
  },
  {
    name: 'web_fetch',
    description: 'Obtiene el contenido de una URL externa (página web, documento público, etc). Úsalo cuando Pancho comparta un link externo y pida que lo leas o analices.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL completa a leer (https://...)' }
      },
      required: ['url']
    }
  },
  {
    name: 'notion_create_proyecto',
    description: 'Crea un nuevo proyecto en Notion',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        cliente: { type: 'string' },
        tipo: { type: 'string', description: 'Video, Foto, Branding, Web, Social Media, Print' },
        presupuesto: { type: 'number', description: 'Presupuesto en CLP' },
        fechaEntrega: { type: 'string', description: 'YYYY-MM-DD' },
        notas: { type: 'string' }
      },
      required: ['nombre']
    }
  },
  {
    name: 'notion_update_proyecto',
    description: 'Actualiza estado, cliente, presupuesto, fecha o notas de un proyecto en Notion',
    input_schema: {
      type: 'object',
      properties: {
        busqueda: { type: 'string', description: 'Nombre o parte del nombre del proyecto' },
        estado: { type: 'string', description: 'Brief, Pre-produccion, Produccion, Post-produccion, Entregado, Archivado' },
        cliente: { type: 'string' },
        presupuesto: { type: 'number' },
        fechaEntrega: { type: 'string', description: 'YYYY-MM-DD' },
        notas: { type: 'string' }
      },
      required: ['busqueda']
    }
  },
  {
    name: 'notion_add_nota',
    description: 'Agrega una nota con timestamp a un proyecto en Notion',
    input_schema: {
      type: 'object',
      properties: {
        busqueda: { type: 'string', description: 'Nombre o parte del nombre del proyecto' },
        nota: { type: 'string', description: 'Texto de la nota' }
      },
      required: ['busqueda', 'nota']
    }
  },
  {
    name: 'notion_create_boleta',
    description: 'Registra una boleta o factura en Notion',
    input_schema: {
      type: 'object',
      properties: {
        descripcion: { type: 'string' },
        monto: { type: 'number', description: 'Monto en CLP' },
        tipo: { type: 'string', description: 'Boleta, Factura, Nota Credito, Otro' },
        categoria: { type: 'string', description: 'Produccion, Software, Oficina, Marketing, Profesional, Otro' },
        fecha: { type: 'string', description: 'YYYY-MM-DD' }
      },
      required: ['descripcion']
    }
  },
  {
    name: 'drive_save_file',
    description: 'Guarda un archivo o imagen en Google Drive PVB desde una URL pública. Solo úsalo si tienes una URL real del archivo.',
    input_schema: {
      type: 'object',
      properties: {
        url:      { type: 'string', description: 'URL pública del archivo a guardar' },
        filename: { type: 'string', description: 'Nombre del archivo con extensión (ej: banner-kaya.png)' },
        mimeType: { type: 'string', description: 'MIME type (ej: image/png, application/pdf, video/mp4)' },
        project:  { type: 'string', description: 'Nombre del proyecto PVB. Omitir para General.' },
      },
      required: ['url', 'filename', 'mimeType']
    }
  }
];

// ─── Helpers ───

function mapProyecto(p) {
  return {
    nombre: p.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre',
    cliente: p.properties.Cliente?.rich_text?.[0]?.plain_text || '',
    estado: p.properties.Estado?.select?.name || '',
    entrega: p.properties['Fecha Entrega']?.date?.start || '',
    presupuesto: p.properties['Presupuesto CLP']?.number || 0,
    notas: p.properties.Notas?.rich_text?.[0]?.plain_text || '',
    id: p.id,
    url: p.url
  };
}

async function findProyecto(notionKey, busqueda) {
  const data = await getTodosProyectos(notionKey);
  return data.results?.find(p =>
    p.properties.Nombre?.title?.[0]?.plain_text?.toLowerCase().includes(busqueda.toLowerCase())
  );
}

function extractNotionPageId(urlOrId) {
  // Si ya es un ID (32 hex chars, opcionalmente con guiones)
  const cleanId = urlOrId.replace(/-/g, '');
  if (/^[0-9a-f]{32}$/i.test(cleanId)) return cleanId;
  // Extraer ID de URL de Notion (último segmento después de -)
  const match = urlOrId.match(/([0-9a-f]{32})(?:[?#]|$)/i);
  if (match) return match[1];
  // Último segmento de la URL
  const parts = urlOrId.split(/[-/]/);
  const last = parts[parts.length - 1].split('?')[0];
  if (/^[0-9a-f]{8,32}$/i.test(last)) return last.padEnd(32, '0');
  return null;
}

function extractTextFromBlocks(blocks) {
  const lines = [];
  for (const block of blocks || []) {
    const type = block.type;
    const content = block[type];
    if (!content) continue;
    const text = content.rich_text?.map(t => t.plain_text).join('') || '';
    if (type === 'heading_1') lines.push(`# ${text}`);
    else if (type === 'heading_2') lines.push(`## ${text}`);
    else if (type === 'heading_3') lines.push(`### ${text}`);
    else if (type === 'bulleted_list_item') lines.push(`• ${text}`);
    else if (type === 'numbered_list_item') lines.push(`- ${text}`);
    else if (type === 'to_do') lines.push(`[${content.checked ? 'x' : ' '}] ${text}`);
    else if (type === 'code') lines.push(`\`\`\`\n${text}\n\`\`\``);
    else if (text) lines.push(text);
  }
  return lines.join('\n');
}

// ─── Ejecutor de herramientas ───

async function executeTool(toolName, toolInput, notionKey) {
  switch (toolName) {
    case 'notion_get_proyectos': {
      const data = toolInput.todos
        ? await getTodosProyectos(notionKey)
        : await getProyectosActivos(notionKey);
      return data.results?.map(mapProyecto) || [];
    }
    case 'notion_get_boletas': {
      const data = await getBoletasPendientes(notionKey);
      return data.results?.map(p => ({
        descripcion: p.properties.Descripcion?.title?.[0]?.plain_text || '',
        monto: p.properties['Monto CLP']?.number || 0,
        fecha: p.properties.Fecha?.date?.start || '',
        tipo: p.properties['Tipo Documento']?.select?.name || '',
        id: p.id
      })) || [];
    }
    case 'notion_resumen_financiero': {
      const data = await getResumenFinanciero(notionKey);
      const porCategoria = {};
      let total = 0;
      for (const p of data.results || []) {
        const cat = p.properties.Categoria?.select?.name || 'Otro';
        const monto = p.properties['Monto CLP']?.number || 0;
        porCategoria[cat] = (porCategoria[cat] || 0) + monto;
        total += monto;
      }
      return { total, por_categoria: porCategoria, registros: data.results?.length || 0 };
    }
    case 'notion_get_entregas': {
      const data = await getEntregasPendientes(notionKey);
      return data.results?.map(p => ({
        nombre: p.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre',
        id: p.id, url: p.url
      })) || [];
    }
    case 'notion_search': {
      const data = await searchNotion(notionKey, toolInput.query);
      return data.results?.map(r => ({
        titulo: r.properties?.Nombre?.title?.[0]?.plain_text || r.properties?.title?.title?.[0]?.plain_text || r.title?.[0]?.plain_text || 'Sin título',
        tipo: r.object,
        url: r.url,
        id: r.id
      })) || [];
    }
    case 'notion_get_page': {
      const pageId = extractNotionPageId(toolInput.url_or_id);
      if (!pageId) return { error: `No pude extraer un ID de Notion válido de: ${toolInput.url_or_id}` };
      const [pageData, blocksData] = await Promise.all([
        getPage(notionKey, pageId),
        getPageContent(notionKey, pageId)
      ]);
      if (pageData.object === 'error') return { error: pageData.message };
      const title = pageData.properties?.Nombre?.title?.[0]?.plain_text
        || pageData.properties?.title?.title?.[0]?.plain_text
        || pageData.properties?.Name?.title?.[0]?.plain_text
        || 'Sin título';
      const content = extractTextFromBlocks(blocksData.results);
      return { title, url: pageData.url, content: content || '(página sin contenido de texto)' };
    }
    case 'web_fetch': {
      try {
        const res = await fetch(toolInput.url, {
          headers: { 'User-Agent': 'Mozilla/5.0 PVB-Bot/1.0' },
          signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return { error: `HTTP ${res.status} al intentar leer ${toolInput.url}` };
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text')) return { error: 'El archivo no es texto/HTML legible' };
        const html = await res.text();
        // Limpieza básica de HTML → texto
        const text = html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 4000); // Máximo ~4k chars para no saturar el contexto
        return { url: toolInput.url, content: text };
      } catch (e) {
        return { error: `No pude leer la URL: ${e.message}` };
      }
    }
    case 'notion_create_proyecto': {
      const page = await createProyecto(notionKey, toolInput);
      return { ok: !!page.id, url: page.url, id: page.id };
    }
    case 'notion_update_proyecto': {
      const proyecto = await findProyecto(notionKey, toolInput.busqueda);
      if (!proyecto) return { error: `No encontré proyecto con "${toolInput.busqueda}"` };
      await updateProyecto(notionKey, proyecto.id, toolInput);
      return { ok: true, nombre: proyecto.properties.Nombre?.title?.[0]?.plain_text, url: proyecto.url };
    }
    case 'notion_add_nota': {
      const proyecto = await findProyecto(notionKey, toolInput.busqueda);
      if (!proyecto) return { error: `No encontré proyecto con "${toolInput.busqueda}"` };
      await addNotaProyecto(notionKey, proyecto.id, toolInput.nota);
      return { ok: true, nombre: proyecto.properties.Nombre?.title?.[0]?.plain_text };
    }
    case 'notion_create_boleta': {
      const page = await createBoleta(notionKey, toolInput);
      return { ok: !!page.id, url: page.url, id: page.id };
    }
    case 'drive_save_file': {
      const file = await uploadFromUrl({
        url: toolInput.url,
        filename: toolInput.filename,
        mimeType: toolInput.mimeType,
        project: toolInput.project || null,
      });
      return { ok: true, id: file.id, viewUrl: file.webViewLink, name: file.name };
    }
    default:
      return { error: 'Herramienta no encontrada' };
  }
}

// ─── API pública ───

async function loadStyleRules() {
  try {
    const sb = getSB();
    const { data } = await sb.from('brain_style_memory').select('type,rule').order('created_at', { ascending: false });
    return data || [];
  } catch { return []; }
}

function buildSystemPrompt(styleRules) {
  let rulesBlock = '';
  if (styleRules.length) {
    const never = styleRules.filter(r => r.type === 'never').map(r => `• NUNCA: ${r.rule}`).join('\n');
    const change = styleRules.filter(r => r.type === 'change').map(r => `• SIEMPRE: ${r.rule}`).join('\n');
    rulesBlock = `\n\nREGLAS DE ESTILO PVB (permanentes — aplica en toda propuesta creativa o recomendación visual):\n${[never, change].filter(Boolean).join('\n')}`;
  }
  return SYSTEM_PROMPT + rulesBlock;
}

export async function askClaude(userMessage, notionKey, anthropicKey, chatId = null) {
  console.log(`[telegram-ai] askClaude invocado por chat ${chatId}`);
  const client = new Anthropic({ apiKey: anthropicKey });

  // Cargar historial y reglas de estilo en paralelo
  const [history, styleRules] = await Promise.all([
    chatId ? loadHistory(chatId) : Promise.resolve([]),
    loadStyleRules()
  ]);

  const dynamicSystem = buildSystemPrompt(styleRules);

  // Agregar mensaje actual al historial para el contexto
  const messages = [
    ...history,
    { role: 'user', content: userMessage }
  ];

  let response = await client.messages.create({
    model: 'gemini-agent',
    max_tokens: 1024,
    system: dynamicSystem,
    tools: TOOLS,
    messages
  });

  // Agentic loop — ejecuta herramientas si Claude las pide
  while (response.stop_reason === 'tool_use') {
    const toolUses = response.content.filter(b => b.type === 'tool_use');
    const toolResults = [];

    for (const toolUse of toolUses) {
      const result = await executeTool(toolUse.name, toolUse.input, notionKey);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result)
      });
    }

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: 'gemini-agent',
      max_tokens: 1024,
      system: dynamicSystem,
      tools: TOOLS,
      messages
    });
  }

  const textBlock = response.content.find(b => b.type === 'text');
  const reply = textBlock?.text || 'Sin respuesta';

  // Persistir historial actualizado (solo user text + assistant text, sin tool calls)
  if (chatId) {
    const updatedHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: reply }
    ];
    await saveHistory(chatId, updatedHistory);
  }

  return reply;
}
