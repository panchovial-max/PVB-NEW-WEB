// telegram-ai.js — Cerebro IA del bot PVB
// Recibe mensajes libres desde telegram-bot.js y responde con Claude
// Tiene herramientas: Notion, Drive, generación de contenido

import Anthropic from '@anthropic-ai/sdk';
import {
  getProyectosActivos,
  getBoletasPendientes,
  createProyecto,
  updateProyectoEstado,
  addNotaProyecto
} from './notion-query.js';

const SYSTEM_PROMPT = `Eres el asistente de IA de PVB Estudio Creativo, una productora audiovisual y agencia de marketing en Santiago, Chile.

Quién eres:
- Asistente directo de Francisco Vial Brown (Pancho), fundador de PVB
- Tienes acceso a proyectos, boletas y clientes de la agencia
- Puedes crear y actualizar contenido en Notion, generar copies, fichas, briefs y estrategias

Proyectos activos conocidos:
- Refugio Chiloé: rebranding + contenido visual para venta de terrenos en Chiloé ($2.200.000 + IVA). Incluye video documental, lifestyle, fotografía drone, web inmersiva con fichas por terreno, corretaje. Contexto clave: Puente Chacao al 65% de avance, inaugura 2028, plusvalía garantizada.
- Kaya Unite: campaña Invierno 2026 "Everyday is Culture" - micro-videos y fotografía lifestyle

Capacidades:
- Generar copies para Meta Ads, Instagram, newsletters
- Crear fichas de terreno, briefs, propuestas
- Actualizar proyectos en Notion
- Planificar calendarios de contenido
- Analizar estrategias de marketing

Estilo de respuesta:
- Directo y profesional, en español chileno
- Respuestas concisas para Telegram (máximo 3-4 párrafos)
- Usa formato Markdown cuando sea útil
- Si generas múltiples variantes, enuméralas claramente

Herramientas disponibles:
- notion_get_proyectos: obtener proyectos activos
- notion_get_boletas: obtener boletas pendientes
- notion_create_proyecto: crear proyecto en Notion
- notion_update_estado: cambiar estado de proyecto
- notion_add_nota: agregar nota a proyecto`;

const TOOLS = [
  {
    name: 'notion_get_proyectos',
    description: 'Obtiene los proyectos activos de PVB desde Notion',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'notion_get_boletas',
    description: 'Obtiene las boletas/facturas pendientes desde Notion',
    input_schema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'notion_create_proyecto',
    description: 'Crea un nuevo proyecto en Notion',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre del proyecto' },
        cliente: { type: 'string', description: 'Nombre del cliente' },
        tipo: { type: 'string', description: 'Tipo: Video, Foto, Branding, Web, Social Media, Print' },
        presupuesto: { type: 'number', description: 'Presupuesto en CLP' },
        fechaEntrega: { type: 'string', description: 'Fecha entrega YYYY-MM-DD' }
      },
      required: ['nombre']
    }
  },
  {
    name: 'notion_update_estado',
    description: 'Cambia el estado de un proyecto en Notion',
    input_schema: {
      type: 'object',
      properties: {
        busqueda: { type: 'string', description: 'Nombre o parte del nombre del proyecto' },
        estado: { type: 'string', description: 'Nuevo estado: Brief, Pre-produccion, Produccion, Post-produccion, Entregado, Archivado' }
      },
      required: ['busqueda', 'estado']
    }
  },
  {
    name: 'notion_add_nota',
    description: 'Agrega una nota a un proyecto en Notion',
    input_schema: {
      type: 'object',
      properties: {
        busqueda: { type: 'string', description: 'Nombre o parte del nombre del proyecto' },
        nota: { type: 'string', description: 'Texto de la nota' }
      },
      required: ['busqueda', 'nota']
    }
  }
];

async function executeTool(toolName, toolInput, notionKey) {
  switch (toolName) {
    case 'notion_get_proyectos': {
      const data = await getProyectosActivos(notionKey);
      return data.results?.map(p => ({
        nombre: p.properties.Nombre?.title?.[0]?.plain_text || 'Sin nombre',
        cliente: p.properties.Cliente?.rich_text?.[0]?.plain_text || '',
        estado: p.properties.Estado?.select?.name || '',
        entrega: p.properties['Fecha Entrega']?.date?.start || '',
        presupuesto: p.properties['Presupuesto CLP']?.number || 0,
        id: p.id
      })) || [];
    }
    case 'notion_get_boletas': {
      const data = await getBoletasPendientes(notionKey);
      return data.results?.map(p => ({
        descripcion: p.properties.Descripcion?.title?.[0]?.plain_text || '',
        monto: p.properties['Monto CLP']?.number || 0,
        fecha: p.properties.Fecha?.date?.start || '',
        tipo: p.properties['Tipo Documento']?.select?.name || ''
      })) || [];
    }
    case 'notion_create_proyecto': {
      const page = await createProyecto(notionKey, toolInput);
      return { ok: !!page.id, url: page.url, id: page.id };
    }
    case 'notion_update_estado': {
      const data = await getProyectosActivos(notionKey);
      const proyecto = data.results?.find(p =>
        p.properties.Nombre?.title?.[0]?.plain_text?.toLowerCase().includes(toolInput.busqueda.toLowerCase())
      );
      if (!proyecto) return { error: `No encontré proyecto con "${toolInput.busqueda}"` };
      await updateProyectoEstado(notionKey, proyecto.id, toolInput.estado);
      return { ok: true, nombre: proyecto.properties.Nombre?.title?.[0]?.plain_text };
    }
    case 'notion_add_nota': {
      const data = await getProyectosActivos(notionKey);
      const proyecto = data.results?.find(p =>
        p.properties.Nombre?.title?.[0]?.plain_text?.toLowerCase().includes(toolInput.busqueda.toLowerCase())
      );
      if (!proyecto) return { error: `No encontré proyecto con "${toolInput.busqueda}"` };
      await addNotaProyecto(notionKey, proyecto.id, toolInput.nota);
      return { ok: true, nombre: proyecto.properties.Nombre?.title?.[0]?.plain_text };
    }
    default:
      return { error: 'Herramienta no encontrada' };
  }
}

export async function askClaude(userMessage, notionKey, anthropicKey) {
  const client = new Anthropic({ apiKey: anthropicKey });
  const messages = [{ role: 'user', content: userMessage }];

  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
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
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    });
  }

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock?.text || 'Sin respuesta';
}
